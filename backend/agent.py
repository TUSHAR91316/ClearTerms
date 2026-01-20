import os
from typing import List, Optional
from pydantic import BaseModel, Field
from openai import AsyncOpenAI
import trafilatura
from dotenv import load_dotenv

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

# --- Agent Setup ---

# Client initialization is moved inside the function to prevent import errors if API key is missing.


# --- Tools ---

def fetch_policy_text(url: str) -> str:
    """
    Downloads and extracts text. Tries JReader first, then falls back to direct fetch.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    # Strategy 1: Jina Reader (good for JS-heavy sites)
    try:
        jina_url = f"https://r.jina.ai/{url}"
        downloaded = trafilatura.fetch_url(jina_url)
        if downloaded and len(downloaded) > 200 and "Access Denied" not in downloaded:
            return downloaded[:50000]
    except Exception:
        pass

    # Strategy 2: Direct Trafilatura Fetch with Headers
    try:
        downloaded = trafilatura.fetch_url(url) # trafilatura uses its own user-agent by default, we can rely on its robustness or pass config
        if not downloaded:
             # Try forcing requests logic if trafilatura default fails
             import requests
             response = requests.get(url, headers=headers, timeout=10)
             if response.status_code == 200:
                 downloaded = response.text

        if downloaded:
            extracted = trafilatura.extract(downloaded)
            if extracted:
                return extracted[:50000]
    except Exception:
        pass
    
    return ""

async def analyze_policy(url: str, text: Optional[str] = None) -> PolicyAnalysis:
    """
    Analyzes policy. If 'text' is provided, it uses that. 
    Otherwise it attempts to fetch from 'url'.
    """
    policy_text = text
    
    if not policy_text and url:
        policy_text = fetch_policy_text(url)
    
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
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
             return PolicyAnalysis(
                transparency_score=0,
                summary="Configuration Error: OPENROUTER_API_KEY is not set on the server.",
                risk_flags=[],
                user_rights=[],
                verdict="Error"
            )

        client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
            default_headers={
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "ClearTerms",
            }
        )

        models_to_try = [
            "google/gemini-2.0-flash-001",
            "openai/gpt-4o-mini",
            "meta-llama/llama-3.1-70b-instruct"
        ]

        last_error = None

        for model in models_to_try:
            try:
                print(f"Attempting analysis with model: {model}")
                completion = await client.beta.chat.completions.parse(
                    model=model, 
                    messages=[
                        {"role": "system", "content": (
                            "You are a legal expert and privacy advocate. Your goal is to analyze "
                            "Terms of Service and Privacy Policies to protect the user."
                            "Identify predatory clauses, data selling, and vague language."
                            "Be critical but fair."
                        )},
                        {"role": "user", "content": f"Analyze the following policy text: \n\n{policy_text}"},
                    ],
                    response_format=PolicyAnalysis,
                )
                return completion.choices[0].message.parsed
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
