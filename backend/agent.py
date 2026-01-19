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

# Fallback to OpenAI direct client due to pydantic-ai installation issues on Python 3.13
# OpenRouter is OpenAI compatible.
client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
    default_headers={
        "HTTP-Referer": "http://localhost:3000", # Or your deployed URL
        "X-Title": "ClearTerms",
    }
)

# --- Tools ---

def fetch_policy_text(url: str) -> str:
    """Downloads and extracts text using Jina Reader to bypass bot protection."""
    try:
        # Use Jina Reader as a proxy to handle JS rendering and anti-bot checks
        jina_url = f"https://r.jina.ai/{url}"
        
        # trafilatura.fetch_url handles the HTTP request cleanly
        downloaded = trafilatura.fetch_url(jina_url)
        
        if not downloaded:
             return "" 
        
        # Jina returns clean Markdown/Text. We assume it's good to go.
        return downloaded[:50000] # Increased limit as Jina is efficient
    except Exception:
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
    completion = await client.beta.chat.completions.parse(
        model="xiaomi/mimo-v2-flash", 
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
