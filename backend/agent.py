import os
import asyncio
from typing import List, Optional
from pydantic import BaseModel, Field
from huggingface_hub import AsyncInferenceClient
import json
import re
import trafilatura
import httpx
from dotenv import load_dotenv
from backend.cache import analysis_cache, get_cache_key

load_dotenv()

# --- Pydantic Models ---

class RiskFlag(BaseModel):
    category: str = Field(description="Category of the risk (e.g., 'Data Selling', 'Tracking', 'IP Ownership')")
    severity: str = Field(description="Severity level: 'High', 'Medium', 'Low'")
    description: str = Field(description="Brief explanation of the risk found in the text.")

class UserRight(BaseModel):
    right: str = Field(description="Name of the right (e.g., 'Right to deletion')")
    details: str = Field(description="How the user can exercise this right.")

class PolicyAnalysis(BaseModel):
    transparency_score: int = Field(description="Score from 0-100 indicating how transparent and user-friendly the policy is.")
    summary: str = Field(description="A concise summary of the policy in plain English.")
    risk_flags: List[RiskFlag] = Field(description="List of potential red flags or aggressive terms.")
    user_rights: List[UserRight] = Field(description="List of rights the user has.")
    verdict: str = Field(description="Overall verdict: 'Safe', 'Caution', or 'Unsafe'.")

class PolicyComparison(BaseModel):
    policy_a_score: int = Field(description="Transparency score for Policy A from 0-100.")
    policy_b_score: int = Field(description="Transparency score for Policy B from 0-100.")
    winner: str = Field(description="Which policy is more user-friendly: 'Policy A', 'Policy B', or 'Tie'.")
    summary: str = Field(description="A concise comparative summary highlighting the key differences between both policies.")
    key_differences: List[str] = Field(description="Bullet points comparing predatory terms, data collection, or user rights differences.")
    policy_a_verdict: str = Field(description="Verdict for Policy A: 'Safe', 'Caution', or 'Unsafe'.")
    policy_b_verdict: str = Field(description="Verdict for Policy B: 'Safe', 'Caution', or 'Unsafe'.")

# --- Agent Setup ---

_client: Optional[AsyncInferenceClient] = None
_http_client: Optional[httpx.AsyncClient] = None

def get_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        _http_client = httpx.AsyncClient(timeout=10.0, headers=headers, follow_redirects=True)
    return _http_client

def get_hf_client(api_key: str) -> AsyncInferenceClient:
    """
    Returns a cached global AsyncInferenceClient instance with a custom 15s timeout.
    """
    global _client
    if _client is None:
        _client = AsyncInferenceClient(
            token=api_key,
            timeout=15.0
        )
    return _client


# --- Tools ---

async def fetch_jina(url: str, client: httpx.AsyncClient) -> str:
    try:
        jina_url = f"https://r.jina.ai/{url}"
        response = await client.get(jina_url)
        if response.status_code == 200 and len(response.text) > 200 and "Access Denied" not in response.text:
            return response.text[:50000]
    except Exception as e:
        print(f"Jina extraction failed: {e}")
    return ""

async def fetch_trafilatura(url: str, client: httpx.AsyncClient) -> str:
    try:
        response = await client.get(url)
        if response.status_code == 200:
            extracted = trafilatura.extract(response.text)
            if extracted:
                return extracted[:50000]
    except Exception as e:
        print(f"Direct extraction failed: {e}")
    return ""

async def fetch_policy_text(url: str) -> str:
    """
    Downloads and extracts text concurrently using Jina Reader and Trafilatura.
    Returns the first successful result to minimize latency.
    """
    client = get_http_client()
    
    jina_task = asyncio.create_task(fetch_jina(url, client))
    direct_task = asyncio.create_task(fetch_trafilatura(url, client))
    
    pending = {jina_task, direct_task}
    
    while pending:
        done, pending = await asyncio.wait(pending, return_when=asyncio.FIRST_COMPLETED)
        for task in done:
            result = task.result()
            if result:
                # Cancel remaining tasks if we found a valid result
                for p in pending:
                    p.cancel()
                return result
                
    return ""

async def analyze_policy(url: str, text: Optional[str] = None) -> PolicyAnalysis:
    """
    Analyzes policy. If 'text' is provided, it uses that. 
    Otherwise it attempts to fetch from 'url'.
    """
    # Check cache first
    cache_key = get_cache_key(url, text)
    cached_result = analysis_cache.get(cache_key)
    if cached_result:
        print(f"Cache Hit for: {url or 'Pasted Text'}")
        return cached_result

    policy_text = text
    
    if not policy_text and url:
        policy_text = await fetch_policy_text(url)
    
    if not policy_text:
         # Return a dummy error analysis if fetch fails and no text provided
        return PolicyAnalysis(
            transparency_score=0,
            summary=f"Could not fetch content from {url or 'input'}. Please check the link or paste text manually.",
            risk_flags=[],
            user_rights=[],
            verdict="Error"
        )

    # Use OpenAI's beta parse feature which uses Pydantic models under the hood
    try:
        # Lazy initialization of client
        api_key = os.getenv("HF_TOKEN")
        if not api_key:
             return PolicyAnalysis(
                transparency_score=0,
                summary="Configuration Error: HF_TOKEN is not set on the server.",
                risk_flags=[],
                user_rights=[],
                verdict="Error"
            )

        client = get_hf_client(api_key)

        models_to_try = [
            "meta-llama/Llama-3.3-70B-Instruct",
            "Qwen/Qwen2.5-72B-Instruct",
            "mistralai/Mixtral-8x7B-Instruct-v0.1"
        ]

        last_error = None

        prompt = (
            "You are a legal expert and privacy advocate. Your goal is to analyze "
            "Terms of Service and Privacy Policies to protect the user."
            "Identify predatory clauses, data selling, and vague language."
            "Be critical but fair. If the policy is written in a non-English language, "
            "translate your findings and summary into plain English.\n\n"
            "Analyze the following policy text: \n\n"
            f"{policy_text}\n\n"
            "Respond in strictly valid JSON format matching this schema:\n"
            f"{json.dumps(PolicyAnalysis.model_json_schema())}\n"
            "Do not output anything other than JSON."
        )

        for model in models_to_try:
            try:
                print(f"Attempting analysis with model: {model}")
                completion = await client.chat_completion(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=1000,
                    response_format={"type": "json_object"}
                )
                
                content = completion.choices[0].message.content.strip()
                
                # Clean up markdown JSON block if present
                content = re.sub(r'^```(?:json)?\s*', '', content)
                content = re.sub(r'\s*```$', '', content)
                content = content.strip()
                
                # Parse to Pydantic
                parsed = PolicyAnalysis.model_validate_json(content)
                # Store in cache
                analysis_cache.set(cache_key, parsed)
                return parsed

            except Exception as e:
                print(f"Model {model} failed: {e}")
                last_error = e
                continue

        # If we get here, all models failed
        return PolicyAnalysis(
            transparency_score=0,
            summary=f"All AI providers failed. Last error: {str(last_error)}. Please try again later.",
            risk_flags=[],
            user_rights=[],
            verdict="Error"
        )
    except Exception as e:
        return PolicyAnalysis(
            transparency_score=0,
            summary=f"Unexpected System Error: {str(e)}",
            risk_flags=[],
            user_rights=[],
            verdict="Error"
        )


async def compare_policies(
    url_a: Optional[str] = None,
    text_a: Optional[str] = None,
    url_b: Optional[str] = None,
    text_b: Optional[str] = None
) -> PolicyComparison:
    """
    Fetches and analyzes two policies concurrently, then performs an AI-powered comparative analysis.
    """
    # Fetch both policy texts concurrently
    policy_a_text, policy_b_text = await asyncio.gather(
        analyze_policy(url_a or "", text_a) if (url_a or text_a) else asyncio.sleep(0, result=None),
        analyze_policy(url_b or "", text_b) if (url_b or text_b) else asyncio.sleep(0, result=None)
    )

    analysis_a: PolicyAnalysis = policy_a_text
    analysis_b: PolicyAnalysis = policy_b_text

    if not analysis_a or not analysis_b or analysis_a.verdict == "Error" or analysis_b.verdict == "Error":
        return PolicyComparison(
            policy_a_score=analysis_a.transparency_score if analysis_a else 0,
            policy_b_score=analysis_b.transparency_score if analysis_b else 0,
            winner="Error",
            summary="Could not complete comparative analysis because one or both policy analyses failed.",
            key_differences=["One or both policy inputs were invalid or could not be retrieved."],
            policy_a_verdict=analysis_a.verdict if analysis_a else "Error",
            policy_b_verdict=analysis_b.verdict if analysis_b else "Error"
        )

    # Perform comparison via LLM prompt
    api_key = os.getenv("HF_TOKEN")
    if not api_key:
        # Fallback comparison if no key
        winner = "Policy A" if analysis_a.transparency_score > analysis_b.transparency_score else ("Policy B" if analysis_b.transparency_score > analysis_a.transparency_score else "Tie")
        return PolicyComparison(
            policy_a_score=analysis_a.transparency_score,
            policy_b_score=analysis_b.transparency_score,
            winner=winner,
            summary=f"Policy A scored {analysis_a.transparency_score}/100 while Policy B scored {analysis_b.transparency_score}/100.",
            key_differences=[
                f"Policy A Summary: {analysis_a.summary}",
                f"Policy B Summary: {analysis_b.summary}"
            ],
            policy_a_verdict=analysis_a.verdict,
            policy_b_verdict=analysis_b.verdict
        )

    client = get_hf_client(api_key)
    models_to_try = [
        "meta-llama/Llama-3.3-70B-Instruct",
        "Qwen/Qwen2.5-72B-Instruct",
        "mistralai/Mixtral-8x7B-Instruct-v0.1"
    ]

    prompt = (
        "You are a legal expert comparing two privacy policies.\n\n"
        f"POLICY A ANALYSIS:\nScore: {analysis_a.transparency_score}/100\nVerdict: {analysis_a.verdict}\nSummary: {analysis_a.summary}\n\n"
        f"POLICY B ANALYSIS:\nScore: {analysis_b.transparency_score}/100\nVerdict: {analysis_b.verdict}\nSummary: {analysis_b.summary}\n\n"
        "Compare both policies. Which one is safer/more transparent? What are the key differences?\n"
        "Respond in strictly valid JSON format matching this schema:\n"
        f"{json.dumps(PolicyComparison.model_json_schema())}\n"
        "Do not output anything other than JSON."
    )

    for model in models_to_try:
        try:
            completion = await client.chat_completion(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000,
                response_format={"type": "json_object"}
            )
            content = completion.choices[0].message.content.strip()
            content = re.sub(r'^```(?:json)?\s*', '', content)
            content = re.sub(r'\s*```$', '', content).strip()
            return PolicyComparison.model_validate_json(content)
        except Exception as e:
            print(f"Compare model {model} failed: {e}")
            continue

    winner = "Policy A" if analysis_a.transparency_score > analysis_b.transparency_score else ("Policy B" if analysis_b.transparency_score > analysis_a.transparency_score else "Tie")
    return PolicyComparison(
        policy_a_score=analysis_a.transparency_score,
        policy_b_score=analysis_b.transparency_score,
        winner=winner,
        summary=f"Policy A scored {analysis_a.transparency_score}/100 ({analysis_a.verdict}) and Policy B scored {analysis_b.transparency_score}/100 ({analysis_b.verdict}).",
        key_differences=[
            f"Policy A: {analysis_a.summary}",
            f"Policy B: {analysis_b.summary}"
        ],
        policy_a_verdict=analysis_a.verdict,
        policy_b_verdict=analysis_b.verdict
    )
