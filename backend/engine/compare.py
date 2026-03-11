# engine/compare.py
from engine.analyzer import analyze_code
from engine.carbon   import estimate_energy, estimate_co2, compare_optimization
from engine.scoring  import calculate_green_score, get_score_label
from engine.rules    import get_rule
from engine.cost     import compute_savings


def analyze_comparison(
    original_code:  str,
    optimized_code: str,
    region:         str = "India",
    runs_per_day:   int = 10000
) -> dict:

    # ── Original ───────────────────────────────────────────────
    orig_result        = analyze_code(original_code)
    orig_weight        = orig_result["total_operation_weight"]
    orig_penalty       = orig_result["penalty_weight"]
    orig_issues        = orig_result.get("issues", [])
    orig_energy        = estimate_energy(orig_weight)
    orig_co2           = estimate_co2(orig_energy, region)
    orig_score         = calculate_green_score(orig_weight)
    orig_score_label   = get_score_label(orig_score)

    orig_recommendations = list({
        get_rule(i["rule_id"])["suggestion"]
        for i in orig_issues
        if i.get("rule_id") and get_rule(i["rule_id"])
    })

    # ── Optimized ──────────────────────────────────────────────
    opt_result         = analyze_code(optimized_code)
    opt_weight         = opt_result["total_operation_weight"]
    opt_penalty        = opt_result["penalty_weight"]
    opt_issues         = opt_result.get("issues", [])
    opt_energy         = estimate_energy(opt_weight)
    opt_co2            = estimate_co2(opt_energy, region)
    opt_score          = calculate_green_score(opt_weight)
    opt_score_label    = get_score_label(opt_score)

    opt_recommendations = list({
        get_rule(i["rule_id"])["suggestion"]
        for i in opt_issues
        if i.get("rule_id") and get_rule(i["rule_id"])
    })

    # ── Compute Efficiency ─────────────────────────────────────
    # Use total_weight — must match exactly what frontend cards display
    # Before: 104.3, After: 9.4 → waste = 94.9, gain = 90.99%
    compute_waste_reduced = round(orig_weight - opt_weight, 2)
    efficiency_gain = (
        round(((orig_weight - opt_weight) / orig_weight) * 100, 2)
        if orig_weight > 0 else 0.0
    )

    # ── Cost — uses weight directly, no circular conversion ────
    cost_metrics = compute_savings(orig_weight, opt_weight, runs_per_day)

    # ── Carbon ─────────────────────────────────────────────────
    impact_projection = compare_optimization(orig_co2, opt_co2, runs_per_day)
    co2_saved         = round(orig_co2 - opt_co2, 8)
    co2_reduction_pct = (
        round((co2_saved / orig_co2) * 100, 2)
        if orig_co2 > 0 else 0.0
    )

    # ── Impact message — cost-first ────────────────────────────
    spct = cost_metrics["savings_percent"]
    sval = f"₹{cost_metrics['annual_savings']:,.0f}"

    if spct >= 75:
        impact_message = f"Massive compute waste eliminated — {sval} saved annually."
    elif spct >= 40:
        impact_message = f"Significant cost reduction — {sval} saved annually."
    elif spct > 0:
        impact_message = f"Cloud cost reduced by {spct}% — {sval} annual savings."
    else:
        impact_message = "No structural compute improvement detected."

    return {
        "original": {
            "green_score":       orig_score,
            "score_label":       orig_score_label,
            "co2_kg":            orig_co2,
            "compute_units":     orig_weight,
            "penalty_units":     orig_penalty,
            "issues":            orig_issues,
            "optimization_recommendations": orig_recommendations
        },
        "optimized": {
            "green_score":       opt_score,
            "score_label":       opt_score_label,
            "co2_kg":            opt_co2,
            "compute_units":     opt_weight,
            "penalty_units":     opt_penalty,
            "issues":            opt_issues,
            "optimization_recommendations": opt_recommendations
        },
        "compute_analysis": {
            "original_compute_units":  orig_weight,
            "optimized_compute_units": opt_weight,
            "efficiency_gain_percent": efficiency_gain,
            "compute_waste_reduced":   compute_waste_reduced   # now always clean 2dp
        },
        "comparison": {
            "co2_saved_kg":       co2_saved,
            "reduction_percent":  co2_reduction_pct,
            "impact_message":     impact_message,
            "annual_projection":  impact_projection,

            "daily_cost_before":  cost_metrics["daily_cost_before"],
            "daily_cost_after":   cost_metrics["daily_cost_after"],
            "annual_cost_before": cost_metrics["annual_cost_before"],
            "annual_cost_after":  cost_metrics["annual_cost_after"],
            "annual_savings":     cost_metrics["annual_savings"],
            "savings_percent":    cost_metrics["savings_percent"],

            # Sustainability 
            "annual_co2_saved_kg":      impact_projection["annual_co2_savings_kg"],
            "annual_energy_saved_kwh":  round(
                (orig_energy - opt_energy) * runs_per_day * 365, 4
            ),
            "trees_saved_per_year":     impact_projection["trees_saved_per_year"],
                }
    }