# engine/cost.py
"""
GreenOps Cost Engine

Uses COST_PER_COMPUTE_UNIT_INR from carbon.py as single source of truth.
No circular CO2 -> energy -> cost conversion.
"""

from engine.carbon import COST_PER_COMPUTE_UNIT_INR


def cost_per_execution(operation_weight: float) -> float:
    """Cost in INR for one execution of code with given weight."""
    return round(operation_weight * COST_PER_COMPUTE_UNIT_INR, 6)


def daily_cost(operation_weight: float, runs_per_day: int) -> float:
    """Daily cost in INR."""
    return round(cost_per_execution(operation_weight) * runs_per_day, 2)


def annual_cost(daily_cost_value: float) -> float:
    """Annual cost in INR."""
    return round(daily_cost_value * 365, 2)


def compute_savings(
    before_weight: float,
    after_weight:  float,
    runs_per_day:  int
) -> dict:
    """
    Full cost comparison in INR.
    Uses operation weight directly — no circular conversion.
    """
    before_daily  = daily_cost(before_weight, runs_per_day)
    after_daily   = daily_cost(after_weight,  runs_per_day)

    before_annual = annual_cost(before_daily)
    after_annual  = annual_cost(after_daily)
    savings       = round(before_annual - after_annual, 2)

    savings_pct = (
        round((savings / before_annual) * 100, 1)
        if before_annual > 0 else 0.0
    )

    return {
        "daily_cost_before":  before_daily,
        "daily_cost_after":   after_daily,
        "annual_cost_before": before_annual,
        "annual_cost_after":  after_annual,
        "annual_savings":     savings,
        "savings_percent":    savings_pct
    }