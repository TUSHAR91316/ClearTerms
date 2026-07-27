from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from backend.agent import analyze_policy, PolicyAnalysis, compare_policies, PolicyComparison
import os

app = FastAPI()

class AnalyzeRequest(BaseModel):
    url: str | None = None
    text: str | None = None

class CompareRequest(BaseModel):
    url_a: str | None = None
    text_a: str | None = None
    url_b: str | None = None
    text_b: str | None = None

@app.post("/api/analyze", response_model=PolicyAnalysis)
async def analyze_endpoint(request: AnalyzeRequest):
    try:
        result = await analyze_policy(request.url, request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/compare", response_model=PolicyComparison)
async def compare_endpoint(request: CompareRequest):
    try:
        result = await compare_policies(request.url_a, request.text_a, request.url_b, request.text_b)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
def health():
    return {"status": "ok"}
