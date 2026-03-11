export interface Issue {
  rule_id: string;
  message: string;
  line: number;
  weight: number;
  severity: string;
}

export interface CodeAnalysisResult {
  green_score:                  number;
  co2_kg:                       number;
  compute_units:                number;
  penalty_units:                number;
  issues:                       Issue[];
  optimization_recommendations: string[];
}

export interface ComputeAnalysis {
  original_compute_units:  number;
  optimized_compute_units: number;
  efficiency_gain_percent: number;
  compute_waste_reduced:   number;
}

export interface AnnualProjection {
  annual_co2_before_kg:  number;
  annual_co2_after_kg:   number;
  annual_co2_savings_kg: number;
  trees_saved_per_year:  number;
}

export interface SustainabilityMetrics {
  annual_co2_saved_kg:      number;   // scaled to runsPerDay
  annual_energy_saved_kwh:  number;   // derived: co2 / 0.82
  trees_saved_per_year:     number;   // derived: co2 / 21
}

export interface ComparisonResponse {
  original:  CodeAnalysisResult;
  optimized: CodeAnalysisResult;

  compute_analysis: ComputeAnalysis;

  comparison: {
    co2_saved_kg:       number;
    reduction_percent:  number;
    impact_message:     string;
    annual_projection:  AnnualProjection;

    // Cost metrics
    daily_cost_before:  number;
    daily_cost_after:   number;
    annual_cost_before: number;
    annual_cost_after:  number;
    annual_savings:     number;
    savings_percent:    number;
  };
}