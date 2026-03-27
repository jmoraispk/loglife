"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type HistogramBucket = {
  range: string;
  count: number;
};

type DistributionChartProps = {
  data: HistogramBucket[];
};

export default function DistributionChart({ data }: DistributionChartProps) {
  return (
    <article className="animate-fade-in-up-4 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-100">Session Length Distribution</h2>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={48} />
            <YAxis stroke="#64748b" tick={{ fontSize: 12 }} width={36} />
            <Tooltip
              cursor={{ fill: "rgba(51, 65, 85, 0.2)" }}
              contentStyle={{
                backgroundColor: "rgba(2, 6, 23, 0.96)",
                border: "1px solid #334155",
                borderRadius: "0.5rem",
                color: "#e2e8f0",
              }}
            />
            <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
