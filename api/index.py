from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from backend.agent import analyze_policy, PolicyAnalysis
import os

app = FastAPI()

class AnalyzeRequest(BaseModel):
    url: str | None = None
    text: str | None = None

@app.post("/api/analyze", response_model=PolicyAnalysis)
async def analyze_endpoint(request: AnalyzeRequest):
    try:
        # In a real deployment, we might need to handle async execution carefully 
        # or offload to a worker if the LLM takes too long.
        # For Vercel Serverless, 10-60s timeout usually applies.
        
        result = await analyze_policy(request.url, request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
def health():
    return {"status": "ok"}
