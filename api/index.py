from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from backend.agent import analyze_policy, PolicyAnalysis
import os

app = FastAPI()

class AnalyzeRequest(BaseModel):
    url: str
    text: str | None = None

@app.post("/api/analyze", response_model=PolicyAnalysis)
async def analyze_endpoint(request: AnalyzeRequest):
    try:
        # In a real deployment, we might need to handle async execution carefully 
        # or offload to a worker if the LLM takes too long.
        # For Vercel Serverless, 10-60s timeout usually applies.
        
        # Ensure API Key is present for the agent
        if not os.getenv("HF_TOKEN"):
             raise HTTPException(status_code=500, detail="HF_TOKEN is not set in environment variables.")

        result = await analyze_policy(request.url, request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
def health():
    return {"status": "ok"}
