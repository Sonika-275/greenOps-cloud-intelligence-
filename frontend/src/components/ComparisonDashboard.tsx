import { useState } from "react";
import { compareCode } from "../services/api";
import type { ComparisonResponse } from "../types/comparison";

import MetricCard from "./MetricsCard";
import ImpactVisualization from "./ImpactVisualisation";

// ── Constants — must match backend carbon.py ─────────────────
const CARBON_FACTOR     = 0.82;   // kg CO2 per kWh — India grid (CEA 2023)
const TREE_CO2_PER_YEAR = 21;     // kg CO2 per tree per year
const ENERGY_COST       = 10;     // ₹ per kWh

const ComparisonDashboard = () => {
  const [originalCode,  setOriginalCode]  = useState("");
  const [optimizedCode, setOptimizedCode] = useState("");
  const [result,        setResult]        = useState<ComparisonResponse | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [runsPerDay,    setRunsPerDay]    = useState(1000);

  const handleCompare = async () => {
    if (!originalCode || !optimizedCode) {
      setError("Please provide both original and optimized code.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await compareCode(originalCode, optimizedCode);
      setResult(data);
    } catch {
      setError("Failed to compare code. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  // ── Format helpers ────────────────────────────────────────────
  const fmt = (n: number, dp = 0) =>
    n.toLocaleString("en-IN", { maximumFractionDigits: dp });

  const fmtEnergy = (kwh: number) =>
    kwh >= 1 ? `${fmt(kwh, 2)} kWh` : `${fmt(kwh * 1000, 2)} Wh`;

  const fmtCo2 = (kg: number) =>
    kg >= 1000
      ? `${fmt(kg / 1000, 2)} tonnes`
      : `${fmt(kg, 2)} kg`;

  // ── Per-run CO2 from backend ──────────────────────────────────
  // co2_kg already encodes: line_count → weight → energy → co2
  const co2Before = result?.original.co2_kg  ?? 0;
  const co2After  = result?.optimized.co2_kg ?? 0;

  // ── Cloud Cost (dynamic with slider) ─────────────────────────
  // Correct chain: co2 → energy (reverse grid) → cost
  const dailyCostBefore  = (co2Before * runsPerDay / CARBON_FACTOR) * ENERGY_COST;
  const dailyCostAfter   = (co2After  * runsPerDay / CARBON_FACTOR) * ENERGY_COST;
  const annualCostBefore = dailyCostBefore * 365;
  const annualCostAfter  = dailyCostAfter  * 365;
  const annualSavings    = annualCostBefore - annualCostAfter;

  // ── Sustainability — correct forward chain ────────────────────
  // energy first (from co2), then scale, then derive CO2 from energy
  const energyPerRunBefore   = co2Before / CARBON_FACTOR;          // kWh per run
  const energyPerRunAfter    = co2After  / CARBON_FACTOR;          // kWh per run
  const annualEnergyBefore   = energyPerRunBefore * runsPerDay * 365;
  const annualEnergyAfter    = energyPerRunAfter  * runsPerDay * 365;
  const annualEnergySavedKwh = annualEnergyBefore - annualEnergyAfter;
  const annualCo2Saved       = annualEnergySavedKwh * CARBON_FACTOR;
  const treesNeeded          = annualCo2Saved / TREE_CO2_PER_YEAR;

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-10 space-y-10">

      {/* ── Header ── */}
      <div>
        <h1 className="text-4xl font-bold text-green-400">
          GreenOps — Cloud Cost Intelligence Dashboard
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Paste your original and optimized code to analyse cloud cost &amp; efficiency impact.
        </p>
      </div>

      {/* ── Code Input ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-gray-400 text-sm font-medium">Original Code</label>
          <textarea
            className="bg-gray-900 text-gray-100 p-4 rounded-xl border border-gray-700
                       focus:outline-none focus:border-green-400 resize-none font-mono text-sm"
            rows={14}
            placeholder="Paste original (unoptimized) code here..."
            value={originalCode}
            onChange={(e) => setOriginalCode(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-gray-400 text-sm font-medium">Optimized Code</label>
          <textarea
            className="bg-gray-900 text-gray-100 p-4 rounded-xl border border-gray-700
                       focus:outline-none focus:border-green-400 resize-none font-mono text-sm"
            rows={14}
            placeholder="Paste optimized code here..."
            value={optimizedCode}
            onChange={(e) => setOptimizedCode(e.target.value)}
          />
        </div>
      </div>

      {/* ── Action Button ── */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleCompare}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 disabled:opacity-50
                     text-black font-semibold px-8 py-3 rounded-xl transition"
        >
          {loading ? "Analyzing..." : "Analyze Code Impact"}
        </button>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>

      {/* ── Results ── */}
      {result && (
        <div className="space-y-10">

          {/* ── Section 1: Compute Efficiency ── */}
          <section>
            <h2 className="text-xl font-semibold text-green-400 mb-4">
               Compute Efficiency Analysis
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="Compute Units — Before"
                value={result.compute_analysis.original_compute_units}
                highlight
              />
              <MetricCard
                title="Compute Units — After"
                value={result.compute_analysis.optimized_compute_units}
                highlight
              />
              <MetricCard
                title="Efficiency Gain"
                value={`${result.compute_analysis.efficiency_gain_percent}%`}
                highlight
              />
              <MetricCard
                title="Compute Waste Reduced"
                value={result.compute_analysis.compute_waste_reduced}
                highlight
              />
            </div>
          </section>

          {/* ── Section 2: Cloud Cost Impact ── */}
          <section className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
            <h2 className="text-xl font-semibold text-green-400 mb-6">
               Cloud Cost Impact
            </h2>

            {/* Slider */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-300 text-sm font-medium">
                  Your Production Scale
                </label>
                <span className="text-green-400 font-bold text-lg">
                  {runsPerDay.toLocaleString()} runs / day
                </span>
              </div>
              <input
                type="range" min="100" max="100000" step="100"
                value={runsPerDay}
                onChange={(e) => setRunsPerDay(Number(e.target.value))}
                className="w-full accent-green-400"
              />
              <div className="flex justify-between text-gray-600 text-xs mt-1">
                <span>100</span>
                <span>1,00,000</span>
              </div>
            </div>

            {/* Savings Hero */}
            <div className="bg-green-950 border border-green-700 rounded-2xl p-6 mb-8 text-center">
              <p className="text-gray-400 text-sm mb-1">Annual Cloud Cost Savings</p>
              <p className="text-5xl font-extrabold text-green-400">
                ₹{fmt(annualSavings)}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                ₹{fmt(annualSavings / 12)} saved per month 
              </p>
            </div>

            {/* Cost Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard title="Daily Cost — Before"  value={`₹${dailyCostBefore.toFixed(2)}`} />
              <MetricCard title="Daily Cost — After"   value={`₹${dailyCostAfter.toFixed(2)}`} />
              <MetricCard title="Annual Cost — Before" value={`₹${fmt(annualCostBefore)}`} />
              <MetricCard title="Annual Cost — After"  value={`₹${fmt(annualCostAfter)}`} />
            </div>
          </section>

          {/* ── Section 3: Sustainability Impact ── */}
          <section className="bg-gray-900 p-6 rounded-2xl border border-gray-800">

            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl"></span>
              <h2 className="text-xl font-semibold text-green-400">
              Sustainability Impact
              </h2>
            </div>
            <p className="text-gray-500 text-xs mb-1">
              Environmental benefit at{" "}
              <span className="text-green-400 font-semibold">
                {runsPerDay.toLocaleString()} runs/day
              </span>
              . Updates live with the slider above.
            </p>

            {/* Disclaimer */}
            <p className="text-gray-600 text-xs mb-6 italic">
              Sustainability impact estimated using a compute-to-energy model
              and India grid carbon intensity (CEA 2023). Values are modelled
              projections, not direct measurements.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Energy Saved */}
              <div className="bg-gray-800 border border-yellow-900 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-yellow-400 text-xl"></span>
                  <p className="text-gray-400 text-sm font-medium">Annual Energy Saved</p>
                </div>
                <p className="text-3xl font-extrabold text-yellow-400">
                  {fmtEnergy(annualEnergySavedKwh)}
                </p>
                <p className="text-gray-600 text-xs mt-2 leading-relaxed">
                Compute energy eliminated annually
                  <br />India grid: 0.82 kg CO₂/kWh · CEA 2023
                </p>
              </div>

              {/* CO2 Reduced */}
              <div className="bg-gray-800 border border-green-900 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-green-400 text-xl"></span>
                  <p className="text-gray-400 text-sm font-medium">Carbon Emissions Reduced</p>
                </div>
                <p className="text-3xl font-extrabold text-green-400">
                  {fmtCo2(annualCo2Saved)}
                </p>
                <p className="text-gray-600 text-xs mt-2 leading-relaxed">
                  CO₂ not emitted annually
                  <br />energy saved × 0.82 kg CO₂/kWh
                </p>
              </div>

              {/* Trees Needed — label corrected per analysis */}
              <div className="bg-gray-800 border border-emerald-900 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-emerald-400 text-xl"></span>
                  {/* CORRECTED label — scientifically accurate */}
                  <p className="text-gray-400 text-sm font-medium">
                    Trees Needed to Absorb This CO₂
                  </p>
                </div>
                <p className="text-3xl font-extrabold text-emerald-400">
                  {treesNeeded < 1
                    ? fmt(treesNeeded, 3)
                    : fmt(treesNeeded, 1)}{" "}
                  trees
                </p>
                <p className="text-gray-600 text-xs mt-2 leading-relaxed">
                  trees needed to absorb this CO₂ in a year
                  <br />each tree absorbs ~21 kg CO₂/year
                </p>
              </div>

            </div>
          </section>

          {/* ── Section 4: Graph ── */}
          <section>
            <ImpactVisualization
              perRunBefore={result.original.co2_kg}
              perRunAfter={result.optimized.co2_kg}
              runsPerDay={runsPerDay}
            />
          </section>

        </div>
      )}

    </div>
  );
};

export default ComparisonDashboard;