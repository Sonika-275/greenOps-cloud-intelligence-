import React from "react";
import type { TooltipProps } from "recharts";
type ValueType = number | string;
type NameType = string;

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from "recharts";

interface Props {
  perRunBefore: number;
  perRunAfter: number;
}

// Constants
const ENERGY_COST_PER_KWH = 10; // ₹ per kWh
const CARBON_FACTOR = 0.82; // kg CO₂ per kWh
const SCALE_POINTS = [1000, 10000, 25000, 50000, 75000, 100000];

// -----------------------------------------
// Custom Tooltip with proper TypeScript types
// -----------------------------------------
const CustomTooltip = (props: TooltipProps<ValueType, NameType>) => {
  const { active, payload, label } = props as unknown as {
    active?: boolean;
    payload?: Array<{ dataKey: string; value: number }>;
    label?: string | number;
  };

  if (active && payload && payload.length) {
    const carbon = payload.find((p) => p.dataKey === "carbon")?.value as number;
    const revenue = payload.find((p) => p.dataKey === "revenue")?.value as number;

    return (
      <div
        style={{
          backgroundColor: "#1f2937",
          padding: "10px",
          borderRadius: 8,
          border: "1px solid #444",
          color: "#fff",
          fontWeight: 600,
        }}
      >
        <p>{`Runs: ${label}`}</p>
        <p style={{ color: "#22c55e" }}>
          {`Carbon Saved: ${carbon.toLocaleString()} kg`}
        </p>
        <p style={{ color: "#facc15" }}>
          {`Revenue Saved: ₹${revenue.toLocaleString()}`}
        </p>
      </div>
    );
  }

  return null;
};


// -----------------------------------------
// Main Component
// -----------------------------------------
const ImpactVisualization: React.FC<Props> = ({ perRunBefore, perRunAfter }) => {
  // Prepare data
  const data = SCALE_POINTS.map((runs) => {
    const annualBefore = perRunBefore * runs * 365;
    const annualAfter = perRunAfter * runs * 365;

    const carbonSaved = annualBefore - annualAfter;
    const energyCostSaved = (carbonSaved / CARBON_FACTOR) * ENERGY_COST_PER_KWH;
    const revenueSaved = energyCostSaved;

    return {
      runs,
      carbon: parseFloat(carbonSaved.toFixed(1)),
      energyCost: parseFloat(energyCostSaved.toFixed(1)),
      revenue: parseFloat(revenueSaved.toFixed(1)),
    };
  });

  // Tick formatter
  const tickFormatter = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 mt-10 shadow-lg">
      <h3 className="text-2xl font-bold text-green-400 mb-6">
            GreenOps Impact: Carbon → Energy → Revenue
      </h3>

      <ResponsiveContainer width="100%" height={450}>
        <ComposedChart data={data} margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
          {/* Gradients */}
          <defs>
            <linearGradient id="carbonGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
              <stop offset="50%" stopColor="#16a34a" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#065f46" stopOpacity={0.5} />
            </linearGradient>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#facc15" stopOpacity={1} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.8} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#333" />

          {/* X-Axis */}
          <XAxis
            dataKey="runs"
            stroke="#aaa"
            tickFormatter={(value) => `${value / 1000}k runs`}
            tick={{ fontSize: 12, fontWeight: 600 }}
          />

          {/* Y-Axis Left - Carbon */}
          <YAxis
            yAxisId="left"
            stroke="#22c55e"
            tickFormatter={tickFormatter}
            tick={{ fontSize: 12, dy: -4 }}
            label={{
              value: "Carbon Saved (kg)",
              angle: -90,
              position: "insideLeft",
              dy: -20,
              fill: "#22c55e",
              style: { fontWeight: 700 },
            }}
          />

          {/* Y-Axis Right - Revenue */}
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#facc15"
            tickFormatter={tickFormatter}
            tick={{ fontSize: 12, dy: -4 }}
            label={{
              value: "Revenue Saved (₹)",
              angle: 90,
              position: "insideRight",
              dy: 20,
              fill: "#facc15",
              style: { fontWeight: 700 },
            }}
          />

          {/* Tooltip */}
          <Tooltip content={CustomTooltip} />

          {/* Legend */}
          <Legend
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              marginTop: 20,
            }}
          />

          {/* Bars - Carbon */}
          <Bar
            yAxisId="left"
            dataKey="carbon"
            fill="url(#carbonGradient)"
            barSize={30}
            fillOpacity={0.8}
            name="Carbon Saved"
            isAnimationActive={true}
            animationDuration={1500}
          />

          {/* Line - Revenue */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="revenue"
            stroke="url(#revenueGradient)"
            strokeWidth={4}
            dot={{ r: 5, stroke: "#facc15", strokeWidth: 3, fill: "#fff" }}
            activeDot={{ r: 7, stroke: "#facc15", strokeWidth: 3, fill: "#fff" }}
            name="Revenue Saved"
            isAnimationActive={true}
            animationDuration={1500}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Info Box */}
      <div className="mt-4 text-sm text-gray-200 font-medium">
         <span className="text-green-400 font-bold">Green Bars</span> = Carbon Saved (kg) →{" "}
        <span className="text-yellow-400 font-bold"> Energy Cost</span> →{" "}
        <span className="text-yellow-200 font-bold"> Revenue Saved (₹)</span>
        <br />
      </div>
    </div>
  );
};

export default ImpactVisualization;
