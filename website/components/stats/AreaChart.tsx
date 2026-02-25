"use client";

import type { StatsPoint } from "@/data/mock-stats";
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AreaChartProps = {
  data: StatsPoint[];
  smoothing: boolean;
};

function formatShortDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function tooltipLabelFormatter(label: unknown): string {
  if (typeof label !== "string") return "";
  return formatShortDate(label);
}

export default function AreaChart({ data, smoothing }: AreaChartProps) {
  return (
    <article className="animate-fade-in-up-3 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-100">Category Breakdown</h2>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsAreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 8 }}>
            <defs>
              <linearGradient id="workFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="healthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="relationshipsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" tickFormatter={formatShortDate} stroke="#64748b" tick={{ fontSize: 12 }} minTickGap={35} />
            <YAxis stroke="#64748b" tick={{ fontSize: 12 }} width={40} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(2, 6, 23, 0.96)",
                border: "1px solid #334155",
                borderRadius: "0.5rem",
                color: "#e2e8f0",
              }}
              labelFormatter={tooltipLabelFormatter}
            />
            <Area
              type={smoothing ? "monotone" : "linear"}
              dataKey="work"
              name="Work"
              stackId="stack"
              stroke="#60a5fa"
              fill="url(#workFill)"
            />
            <Area
              type={smoothing ? "monotone" : "linear"}
              dataKey="health"
              name="Health"
              stackId="stack"
              stroke="#34d399"
              fill="url(#healthFill)"
            />
            <Area
              type={smoothing ? "monotone" : "linear"}
              dataKey="relationships"
              name="Relationships"
              stackId="stack"
              stroke="#f59e0b"
              fill="url(#relationshipsFill)"
            />
          </RechartsAreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
