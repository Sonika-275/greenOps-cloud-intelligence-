import React, { useState } from "react";
import {
  ComposedChart, Line, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend, ReferenceLine
} from "recharts";

interface Props {
  perRunBefore: number;
  perRunAfter:  number;
  runsPerDay:   number;
}

const TIERS = [
  { id: "free",       label: "Free",       sublabel: "$0",           costMonthly: 0,        color: "#22c55e", description: "VSCode Extension · zero cost · individual dev" },
  { id: "pro",        label: "Pro",        sublabel: "$9/dev/mo",    costMonthly: 9  * 83,  color: "#60a5fa", description: "Small teams · CI integration + dashboard" },
  { id: "enterprise", label: "Enterprise", sublabel: "$19/dev/mo",   costMonthly: 19 * 83,  color: "#f59e0b", description: "ESG dashboards · compliance reports · API" },
];

const CARBON_FACTOR = 0.82;
const ENERGY_COST   = 10;

// Typical codebase: research shows ~15 inefficient patterns per 1000 LOC
// A small startup service averages 3000–5000 LOC → ~45–75 issues
// We use "functions" as a proxy: avg 1.2 issues per function
const ISSUES_PER_FUNCTION = 1.2;

interface TooltipEntry { dataKey: string; value: number; }
interface TTProps { active?: boolean; payload?: TooltipEntry[]; label?: string; tierCost: number; scaledSavings: number; }

const CustomTooltip: React.FC<TTProps> = ({ active, payload, label, tierCost }) => {
  if (!active || !payload?.length) return null;
  const month       = Number(label?.replace("Mo ", "") ?? 0);
  const cumSnippet  = payload.find(p => p.dataKey === "cumSnippet")?.value  ?? 0;
  const cumCodebase = payload.find(p => p.dataKey === "cumCodebase")?.value ?? 0;
  const cumCost     = tierCost * month;

  return (
    <div style={{ backgroundColor: "#1f2937", padding: "12px 16px", borderRadius: 10,
      border: "1px solid #374151", minWidth: 230 }}>
      <p style={{ color: "#9ca3af", marginBottom: 8, fontWeight: 600 }}>{label}</p>
      <p style={{ color: "#22c55e",  marginBottom: 4 }}>📄 This snippet:  ₹{Number(cumSnippet).toLocaleString("en-IN")}</p>
      <p style={{ color: "#60a5fa",  marginBottom: 4 }}>🗂 Codebase est: ₹{Number(cumCodebase).toLocaleString("en-IN")}</p>
      {tierCost > 0 && (
        <p style={{ color: "#ef4444", marginBottom: 4 }}>💳 GreenOps cost: ₹{Number(cumCost).toLocaleString("en-IN")}</p>
      )}
      <p style={{ color: "#facc15", fontWeight: 700, marginTop: 6, borderTop: "1px solid #374151", paddingTop: 6 }}>
        Net ROI (codebase): ₹{(cumCodebase - cumCost).toLocaleString("en-IN")}
      </p>
    </div>
  );
};

const ImpactVisualization: React.FC<Props> = ({ perRunBefore, perRunAfter, runsPerDay }) => {
  const [selectedTier,    setSelectedTier]    = useState("free");
  const [numFunctions,    setNumFunctions]    = useState(30);

  const tier           = TIERS.find(t => t.id === selectedTier) ?? TIERS[0];
  const tierCost       = tier.costMonthly;

  // ── Per-snippet savings ───────────────────────────────────
  const dailySavingsSnippet   = ((perRunBefore - perRunAfter) * runsPerDay / CARBON_FACTOR) * ENERGY_COST;
  const monthlySavingsSnippet = dailySavingsSnippet * 30;

  // ── Codebase estimate ─────────────────────────────────────
  // Each additional function has the same avg saving as this snippet
  // scaled by ISSUES_PER_FUNCTION (not every function is as bad as the pasted one)
  const estimatedIssues       = Math.round(numFunctions * ISSUES_PER_FUNCTION);
  const monthlySavingsCodebase = monthlySavingsSnippet * estimatedIssues;

  // ── Chart data ────────────────────────────────────────────
  const data = Array.from({ length: 12 }, (_, i) => {
    const month       = i + 1;
    const cumSnippet  = Math.round(monthlySavingsSnippet  * month);
    const cumCodebase = Math.round(monthlySavingsCodebase * month);
    const cumCost     = Math.round(tierCost               * month);
    return { month: `Mo ${month}`, cumSnippet, cumCodebase, cumCost,
             netSnippet: cumSnippet - cumCost, netCodebase: cumCodebase - cumCost };
  });

  const annualCodebase = monthlySavingsCodebase * 12;
  const annualCost     = tierCost * 12;
  // annualRoiPct removed — replaced with net savings (% was misleading at high scale)

  const fmt = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  const fmtK = (n: number) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(0)}k` : `₹${n}`;

  const showScaleNotice = tierCost > 0 && monthlySavingsCodebase < tierCost;

  return (
    <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-lg space-y-6">

      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-green-400">ROI Over Time</h3>
        <p className="text-gray-500 text-xs mt-1">
          Cumulative savings vs GreenOps subscription cost · 12 months
        </p>
      </div>

      {/* ── Two Controls Side by Side ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Plan Selector */}
        <div>
          <p className="text-gray-400 text-sm font-medium mb-3">GreenOps Plan</p>
          <div className="flex flex-col gap-2">
            {TIERS.map(t => (
              <button key={t.id} onClick={() => setSelectedTier(t.id)}
                className={`rounded-xl border p-3 text-left transition ${
                  selectedTier === t.id
                    ? "border-green-500 bg-green-950"
                    : "border-gray-700 bg-gray-800 hover:border-gray-600"
                }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm" style={{ color: t.color }}>{t.label}</span>
                  <span className="text-gray-400 text-xs">{t.sublabel}</span>
                </div>
                <p className="text-gray-600 text-xs mt-0.5">{t.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Codebase Size Slider */}
        <div>
          <p className="text-gray-400 text-sm font-medium mb-3">Codebase Size</p>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 h-full flex flex-col justify-between">

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-400 text-xs">Functions in codebase</span>
                <span className="text-blue-400 font-bold text-lg">{numFunctions}</span>
              </div>
              <input type="range" min="1" max="200" step="1"
                value={numFunctions}
                onChange={e => setNumFunctions(Number(e.target.value))}
                className="w-full accent-blue-400 mb-1"
              />
              <div className="flex justify-between text-gray-600 text-xs">
                <span>1 function</span><span>200 functions</span>
              </div>
            </div>

            {/* Side-by-side comparison */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-gray-900 rounded-xl p-3 border border-gray-700">
                <p className="text-gray-500 text-xs mb-1"> This snippet</p>
                <p className="text-green-400 font-bold text-lg">₹{fmt(monthlySavingsSnippet)}<span className="text-xs text-gray-500">/mo</span></p>
                <p className="text-gray-600 text-xs mt-1">1 function · {runsPerDay.toLocaleString()} runs/day</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-3 border border-blue-900">
                <p className="text-gray-500 text-xs mb-1"> Codebase est.</p>
                <p className="text-blue-400 font-bold text-lg">₹{fmt(monthlySavingsCodebase)}<span className="text-xs text-gray-500">/mo</span></p>
                <p className="text-gray-600 text-xs mt-1">{numFunctions} fns · ~{estimatedIssues} issues · {runsPerDay.toLocaleString()} runs/day</p>
              </div>
            </div>

            <p className="text-gray-600 text-xs mt-3 italic leading-relaxed">
              Assumes ~{ISSUES_PER_FUNCTION} inefficient patterns per function on average.
              Each issue has similar savings to the snippet above.
            </p>
          </div>
        </div>
      </div>

      {/* Scale notice */}
      {showScaleNotice && (
        <div className="bg-yellow-950 border border-yellow-800 rounded-xl px-4 py-3">
          <p className="text-yellow-400 text-sm font-semibold mb-1">⚠️ Scale Notice</p>
          <p className="text-yellow-200 text-xs leading-relaxed">
            At <strong>{numFunctions} functions</strong> and <strong>{runsPerDay.toLocaleString()} runs/day</strong>,
            codebase savings (₹{fmt(monthlySavingsCodebase)}/mo) are below the {tier.label} plan
            cost (₹{fmt(tierCost)}/mo). Try the <strong>Free tier</strong>, increase codebase size,
            or scale runs/day to see positive ROI.
          </p>
        </div>
      )}

      {/* Single summary bar — plan cost + annual net only */}
      {tierCost > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-center">
            <p className="text-gray-400 text-xs">Plan cost/month</p>
            <p className="text-red-400 font-bold text-lg">₹{fmt(tierCost)}</p>
          </div>
          <div className="bg-purple-950 border border-purple-800 rounded-xl px-4 py-2 text-center">
            <p className="text-gray-400 text-xs">Annual Net Savings</p>
            <p className="text-purple-400 font-bold text-lg">₹{fmt(annualCodebase - annualCost)}</p>
          </div>
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: "#9ca3af", fontSize: 12 }} />
          <YAxis stroke="#6b7280" tick={{ fill: "#9ca3af", fontSize: 11 }} tickFormatter={fmtK} />
          <Tooltip content={(props) => (
            <CustomTooltip
              active={props.active}
              payload={props.payload as TooltipEntry[] | undefined}
              label={props.label as string | undefined}
              tierCost={tierCost}
              scaledSavings={monthlySavingsCodebase}
            />
          )} />
          <Legend formatter={(value: string) => {
            const map: Record<string, string> = {
              cumSnippet:  "This Snippet",
              cumCodebase: "Codebase Estimate",
              cumCost:     "GreenOps Cost"
            };
            return <span style={{ color: "#9ca3af", fontSize: 12 }}>{map[value] ?? value}</span>;
          }} />

          <ReferenceLine y={0} stroke="#374151" />



          {/* Codebase area — larger, behind */}
          <Area type="monotone" dataKey="cumCodebase"
            fill="#1e3a5f" stroke="#60a5fa" strokeWidth={2.5}
            fillOpacity={0.4} dot={false} name="cumCodebase" />

          {/* Snippet area — smaller, in front */}
          <Area type="monotone" dataKey="cumSnippet"
            fill="#14532d" stroke="#22c55e" strokeWidth={2}
            fillOpacity={0.5} dot={false} name="cumSnippet" />

          {/* GreenOps cost line */}
          {tierCost > 0 && (
            <Line type="monotone" dataKey="cumCost"
              stroke="#ef4444" strokeWidth={2} strokeDasharray="5 4"
              dot={false} name="cumCost" />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Footer */}
      <p className="text-gray-600 text-xs text-center italic">
        Green = this snippet only · Blue = {numFunctions}-function codebase estimate at ~{ISSUES_PER_FUNCTION} issues/function ·
        {runsPerDay.toLocaleString()} runs/day · modelled projection
      </p>

    </div>
  );
};

export default ImpactVisualization;