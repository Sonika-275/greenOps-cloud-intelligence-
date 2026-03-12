from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from engine.analyzer import analyze_code
from engine.scoring import calculate_green_score
from engine.carbon import estimate_energy, estimate_co2
from engine.compare import analyze_comparison
from engine.rules import get_rule

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeRequest(BaseModel):
    code: str

class CompareRequest(BaseModel):
    original_code:  str
    optimized_code: str

@app.get("/")
def read_root():
    return {"message": "GreenOps Backend Running"}

@app.get("/health")
def health_check():
    return {"status": "OK"}

@app.post("/analyze")
def analyze(request: CodeRequest):
    region = "India"

    result       = analyze_code(request.code)
    issues       = result["issues"]
    total_weight = result["total_operation_weight"]
    base_weight  = result["baseline_weight"]
    penalty      = result["penalty_weight"]

    green_score = calculate_green_score(total_weight)
    energy      = estimate_energy(total_weight)
    co2         = estimate_co2(energy, region=region)

    return {
        "green_score":            green_score,
        "estimated_co2_kg":       co2,
        "issues":                 issues,
        "total_operation_weight": total_weight,   # ← was missing
        "baseline_weight":        base_weight,
        "penalty_weight":         penalty,
    }

@app.post("/compare")
def compare_codes(request: CompareRequest):
    return analyze_comparison(
        original_code=request.original_code,
        optimized_code=request.optimized_code,
        region="India"
    )