import React, { useState } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from "recharts";

interface Props {
  perRunBefore: number;
  perRunAfter:  number;
  runsPerDay:   number;
}

// ── Pricing Tiers ─────────────────────────────────────────────
const TIERS = [
  {
    id:          "free",
    label:       "Free",
    sublabel:    "VSCode Extension",
    costMonthly: 0,
    color:       "#22c55e",
    description: "Current prototype — zero cost, individual dev adoption"
  },
  {
    id:          "pro",
    label:       "Pro",
    sublabel:    "$9 / dev / mo",
    costMonthly: 9 * 83,
    color:       "#60a5fa",
    description: "Small teams — CI integration + team dashboard"
  },
  {
    id:          "enterprise",
    label:       "Enterprise",
    sublabel:    "$19 / dev / mo",
    costMonthly: 19 * 83,
    color:       "#f59e0b",
    description: "Full ESG dashboards, compliance reports, API access"
  }
];

const CARBON_FACTOR = 0.82;
const ENERGY_COST   = 10;

// ── Tooltip ───────────────────────────────────────────────────
interface TooltipEntry { dataKey: string; value: number; }
interface CustomTooltipProps {
  active?:  boolean;
  payload?: TooltipEntry[];
  label?:   string;
  tierCost: number;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, tierCost }) => {
  if (!active || !payload || payload.length === 0) return null;

  const cumSavings = payload.find(p => p.dataKey === "cumSavings")?.value ?? 0;
  const netRoi     = payload.find(p => p.dataKey === "netRoi")?.value     ?? 0;
  const month      = Number(label?.replace("Mo ", "") ?? 0);
  const cumCost    = tierCost * month;
  const isProfit   = netRoi >= 0;

  return (
    <div style={{
      backgroundColor: "#1f2937",
      padding: "12px 16px",
      borderRadius: 10,
      border: `1px solid ${isProfit ? "#22c55e" : "#6b7280"}`,
      minWidth: 210
    }}>
      <p style={{ color: "#9ca3af", marginBottom: 8, fontWeight: 600 }}>{label}</p>
      <p style={{ color: "#22c55e" }}>💰 Savings: ₹{Number(cumSavings).toLocaleString("en-IN")}</p>
      {tierCost > 0 && (
        <p style={{ color: "#ef4444" }}>
          💳 Cumulative Cost: ₹{Number(cumCost).toLocaleString("en-IN")}
          <span style={{ color: "#6b7280", fontSize: 10 }}>
            (₹{Number(tierCost).toLocaleString("en-IN")}/mo × {month} mo)
          </span>
        </p>
      )}
      <p style={{
        color: isProfit ? "#facc15" : "#9ca3af",
        fontWeight: 700,
        marginTop: 6
      }}>
        {tierCost === 0
          ? `✅ Pure Savings: ₹${Number(cumSavings).toLocaleString("en-IN")}`
          : isProfit
            ? `✅ Net Profit: ₹${Number(netRoi).toLocaleString("en-IN")}`
            : `⏳ Net: ₹${Number(netRoi).toLocaleString("en-IN")}`
        }
      </p>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────
const ImpactVisualization: React.FC<Props> = ({ perRunBefore, perRunAfter, runsPerDay }) => {
  const [selectedTier, setSelectedTier] = useState("free");
  const tier = TIERS.find(t => t.id === selectedTier) ?? TIERS[0];

  // Monthly savings from code optimization
  const dailySavings   = ((perRunBefore - perRunAfter) * runsPerDay / CARBON_FACTOR) * ENERGY_COST;
  const monthlySavings = dailySavings * 30;
  const tierCost       = tier.costMonthly;

  // Build chart data
  const data = Array.from({ length: 12 }, (_, i) => {
    const month      = i + 1;
    const cumSavings = Math.round(monthlySavings * month);
    const cumCost    = Math.round(tierCost       * month);
    const netRoi     = cumSavings - cumCost;
    return { month: `Mo ${month}`, cumSavings, cumCost, netRoi };
  });

  const annualSavings  = monthlySavings * 12;
  const annualCost     = tierCost * 12;
  const annualNet      = annualSavings - annualCost;
  const annualRoiPct   = annualCost > 0 ? Math.round((annualNet / annualCost) * 100) : null;

  const fmt = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

  const tickFormatter = (value: number) => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000)   return `₹${(value / 1000).toFixed(0)}k`;
    return `₹${value}`;
  };

  // Honest note for low-scale scenarios
  const isProViable = monthlySavings > tierCost;
  const showScaleNotice = tierCost > 0 && !isProViable;

  return (
    <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-lg">

      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-green-400">ROI Over Time</h3>
        <p className="text-gray-500 text-xs mt-1">
          Cumulative code efficiency savings vs GreenOps subscription · 12 months
        </p>
      </div>

      {/* Tier Selector */}
      <div className="mb-6">
        <p className="text-gray-400 text-sm font-medium mb-3">Select GreenOps Plan</p>
        <div className="grid grid-cols-3 gap-3">
          {TIERS.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTier(t.id)}
              className={`rounded-xl border p-3 text-left transition ${
                selectedTier === t.id ? "border-green-500 bg-green-950" : "border-gray-700 bg-gray-800 hover:border-gray-500"
              }`}
            >
              <p className="font-bold text-sm" style={{ color: t.color }}>{t.label}</p>
              <p className="text-gray-400 text-xs">{t.sublabel}</p>
              <p className="text-gray-600 text-xs mt-1 leading-relaxed">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Scale Notice — honest messaging for low traffic */}
      {showScaleNotice && (
        <div className="bg-yellow-950 border border-yellow-800 rounded-xl px-4 py-3 mb-6">
          <p className="text-yellow-400 text-sm font-semibold mb-1">
            ⚠️ Scale Notice
          </p>
          <p className="text-yellow-200 text-xs leading-relaxed">
            At <strong>{runsPerDay.toLocaleString()} runs/day</strong>, code efficiency
            savings (₹{Number(monthlySavings).toLocaleString("en-IN")}/mo) are below the {tier.label} plan cost
            (₹{Number(tierCost).toLocaleString("en-IN")}/mo). This is expected for early-stage or low-traffic services.
            <br /><br />
            <strong>GreenOps value at this scale:</strong> developer education, ESG compliance tracking, 
            and preventing bad patterns from scaling — not immediate cost savings.
          </p>
        </div>
      )}

      {/* Summary Pills */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="bg-green-950 border border-green-800 rounded-xl px-4 py-2 text-center">
          <p className="text-gray-400 text-xs">Monthly Savings</p>
          <p className="text-green-400 font-bold text-lg">₹{fmt(monthlySavings)}</p>
        </div>
        {tierCost > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-center">
            <p className="text-gray-400 text-xs">Plan Cost/month</p>
            <p className="text-red-400 font-bold text-lg">₹{fmt(tierCost)}</p>
          </div>
        )}
        <div className="bg-blue-950 border border-blue-800 rounded-xl px-4 py-2 text-center">
          <p className="text-gray-400 text-xs">Annual ROI</p>
          <p className="text-blue-400 font-bold text-lg">
            {tierCost === 0 ? `₹${fmt(annualSavings)}` : annualRoiPct !== null ? `${annualRoiPct}%` : "—"}
          </p>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: "#9ca3af", fontSize: 12 }} />
          <YAxis stroke="#6b7280" tick={{ fill: "#9ca3af", fontSize: 11 }} tickFormatter={tickFormatter} />
          <Tooltip content={(props) => (
            <CustomTooltip
              active={props.active}
              payload={props.payload as TooltipEntry[] | undefined}
              label={props.label as string | undefined}
              tierCost={tierCost}
            />
          )} />
          <Legend formatter={(value: string) => {
            const map: Record<string, string> = { cumSavings: "Cumulative Savings", cumCost: "Subscription Cost", netRoi: "Net ROI" };
            return <span style={{ color: "#9ca3af", fontSize: 12 }}>{map[value] ?? value}</span>;
          }} />
          <ReferenceLine y={0} stroke="#374151" />
          <Area type="monotone" dataKey="cumSavings" fill="#14532d" stroke="#22c55e" strokeWidth={2.5} fillOpacity={0.3} dot={false} name="cumSavings" />
          {tierCost > 0 && <Line type="monotone" dataKey="cumCost" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 4" dot={false} name="cumCost" />}
          <Line type="monotone" dataKey="netRoi" stroke="#facc15" strokeWidth={3} dot={{ r: 3, fill: "#facc15" }} name="netRoi" />
        </ComposedChart>
      </ResponsiveContainer>

      <p className="text-gray-600 text-xs mt-4 text-center italic">
        Savings from compute efficiency gain at {runsPerDay.toLocaleString()} runs/day ·
        modelled projection · not a guarantee of actual cloud savings
      </p>

    </div>
  );
};

export default ImpactVisualization;