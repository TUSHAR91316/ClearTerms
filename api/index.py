from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from backend.agent import analyze_policy, PolicyAnalysis
import os

app = FastAPI()

class AnalyzeRequest(BaseModel):
    url: str

@app.post("/api/analyze", response_model=PolicyAnalysis)
async def analyze_endpoint(request: AnalyzeRequest):
    try:
        # In a real deployment, we might need to handle async execution carefully 
        # or offload to a worker if the LLM takes too long.
        # For Vercel Serverless, 10-60s timeout usually applies.
        
        # Ensure API Key is present for the agent
        if not os.getenv("OPENROUTER_API_KEY"):
             # Fallback or error if not set. 
             # For local test, we assume it's set in .env
             pass

        result = await analyze_policy(request.url)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
def health():
    return {"status": "ok"}
