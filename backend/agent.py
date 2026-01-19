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
    """Downloads and extracts text from a given URL with browser headers."""
    try:
        # User-Agent to mimic a real browser
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        downloaded = trafilatura.fetch_url(url) # trafilatura handles some headers, but explicit check or requests might be better if this fails.
        # Note: trafilatura.fetch_url uses requests under the hood. 
        # For deeper customization we might use requests directly, but let's try standard first.
        
        if not downloaded:
             return "" 
        text = trafilatura.extract(downloaded)
        return text[:20000] if text else ""
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
        model="google/gemini-2.0-flash-exp:free", 
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
