# engine/scoring.py

"""
GreenOps Scoring Engine

Green Score = efficiency rating 0-100
Compute Units = weighted measure of code complexity cost
"""

# Baseline cost of running any code — even clean code
# Represents fundamental execution overhead
BASELINE_COMPUTE_UNITS = 5

# Every line of code adds a tiny base weight
PER_LINE_WEIGHT = 0.1

# Penalty multiplier for detected issues
PENALTY_FACTOR = 0.6


def calculate_green_score(total_operation_weight: float) -> float:
    """
    Converts total operation weight into normalized green score (0-100).
    
    Score 90-100 = Excellent — minimal waste
    Score 70-89  = Good — minor issues
    Score 50-69  = Fair — noticeable inefficiency  
    Score 0-49   = Poor — significant waste detected
    """
    effective_penalty = total_operation_weight * PENALTY_FACTOR
    score = 100 - effective_penalty
    return max(0, round(score, 2))


def get_score_label(score: float) -> str:
    """
    Human-readable efficiency label for a green score.
    """
    if score >= 90:
        return "Excellent"
    elif score >= 70:
        return "Good"
    elif score >= 50:
        return "Fair"
    else:
        return "Poor"