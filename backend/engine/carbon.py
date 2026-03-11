# engine/carbon.py
"""
GreenOps Carbon & Cost Engine

Calculation chain:
  lines of code
      → AST analysis → compute weight
      → × ENERGY_PER_COMPUTE_UNIT_KWH  → energy per execution (kWh)
      → × grid intensity                → CO2 per execution (kg)

Energy constant calibration:
  AWS Lambda 128MB, ~100ms execution
  Real measured CPU energy ≈ 0.0001 kWh per vCPU-second
  1 compute unit ≈ extra CPU cycles from one inefficient pattern
  Calibrated so R1 (weight=40) at 43k runs/day → ~638 kWh/year
  which falls in realistic backend optimization range (500–3000 kWh/year)
"""

# Grid intensity (kg CO2 per kWh) — CEA 2023
GRID_INTENSITY = {
    "India": 0.82,
    "USA":   0.40,
    "EU":    0.30
}

# Energy per compute unit — calibrated to realistic AWS Lambda measurements
# 1 unit = ~0.000001 kWh extra per execution
# R1 (nested loop, weight=40) at 43k runs/day → ~638 kWh/year saved
ENERGY_PER_COMPUTE_UNIT_KWH = 0.000001   # kWh per compute unit per execution

# AWS Lambda cost mapping (calibrated separately from energy)
COST_PER_COMPUTE_UNIT_INR = 0.00035      # ₹ per compute unit per execution

# Carbon equivalents
CO2_PER_TREE_PER_YEAR = 21    # kg CO2 absorbed per tree per year
CAR_CO2_PER_KM        = 0.12  # kg CO2 per km driven

# Currency
USD_TO_INR = 83


def estimate_energy(total_operation_weight: float) -> float:
    """
    Energy (kWh) per execution caused by code's compute weight.
    Includes baseline (lines of code) + inefficiency penalties.
    """
    return round(total_operation_weight * ENERGY_PER_COMPUTE_UNIT_KWH, 10)


def estimate_co2(energy_kwh: float, region: str = "India") -> float:
    """
    CO2 (kg) per execution from energy × grid intensity.
    """
    intensity = GRID_INTENSITY.get(region, 0.82)
    return round(energy_kwh * intensity, 10)


def estimate_cost_per_run_inr(total_operation_weight: float) -> float:
    """
    Cloud cost (₹) per execution from compute weight.
    """
    return round(total_operation_weight * COST_PER_COMPUTE_UNIT_INR, 6)


def compare_optimization(
    original_co2_per_run:  float,
    optimized_co2_per_run: float,
    executions_per_day:    int = 10000
) -> dict:
    """
    Annual carbon comparison between original and optimized code.
    """
    original_annual  = round(original_co2_per_run  * executions_per_day * 365, 6)
    optimized_annual = round(optimized_co2_per_run * executions_per_day * 365, 6)
    co2_savings      = round(original_annual - optimized_annual, 6)

    return {
        "annual_co2_before_kg":  original_annual,
        "annual_co2_after_kg":   optimized_annual,
        "annual_co2_savings_kg": co2_savings,
        "trees_saved_per_year":  round(co2_savings / CO2_PER_TREE_PER_YEAR, 4)
    }


def annual_projection(co2_per_run: float, executions_per_day: int = 40000) -> dict:
    annual_co2   = round(co2_per_run * executions_per_day * 365, 6)
    trees_needed = round(annual_co2 / CO2_PER_TREE_PER_YEAR, 4)
    return {
        "executions_per_day":    executions_per_day,
        "annual_co2_kg":         annual_co2,
        "trees_needed_per_year": trees_needed
    }