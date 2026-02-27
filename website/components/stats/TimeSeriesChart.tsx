"use client";

import type { StatsPoint } from "@/data/mock-stats";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type SeriesKey = "total" | "work" | "health" | "relationships";

export type SeriesConfig = {
  key: SeriesKey;
  label: string;
  color: string;
};

type TimeSeriesChartProps = {
  data: StatsPoint[];
  series: SeriesConfig[];
  hiddenSeries: Partial<Record<SeriesKey, boolean>>;
  smoothing: boolean;
  onToggleSeries: (key: SeriesKey) => void;
};

type TooltipPayload = {
  payload?: StatsPoint;
  dataKey?: string;
  color?: string;
  value?: number;
  name?: string;
};

function formatShortDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({
  active,
  payload,
  label,
  data,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  data: StatsPoint[];
}) {
  if (!active || !payload || payload.length === 0 || !label) return null;

  const currentIndex = data.findIndex((point) => point.date === label);
  const previous = currentIndex > 0 ? data[currentIndex - 1] : null;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/95 p-3 shadow-xl">
      <p className="mb-2 text-xs font-medium text-slate-300">{formatShortDate(label)}</p>
      <div className="space-y-1.5">
        {payload.map((item) => {
          const dataKey = item.dataKey as SeriesKey;
          const currentValue = Number(item.value ?? 0);
          const previousValue = previous ? Number(previous[dataKey]) : null;
          const changePct =
            previousValue && previousValue !== 0
              ? ((currentValue - previousValue) / previousValue) * 100
              : null;

          return (
            <div key={item.dataKey} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </span>
              <span className="font-medium text-slate-100">{currentValue.toLocaleString()}</span>
              <span className={`${(changePct ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {changePct == null ? "-" : `${changePct >= 0 ? "+" : ""}${changePct.toFixed(1)}%`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TimeSeriesChart({
  data,
  series,
  hiddenSeries,
  smoothing,
  onToggleSeries,
}: TimeSeriesChartProps) {
  return (
    <article className="animate-fade-in-up-2 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-100">Daily Activity Timeline</h2>
        <div className="flex flex-wrap items-center gap-1.5">
          {series.map((item) => {
            const hidden = Boolean(hiddenSeries[item.key]);
            return (
              <button
                key={item.key}
                onClick={() => onToggleSeries(item.key)}
                className={`cursor-pointer rounded-md border px-2 py-1 text-xs transition-colors ${
                  hidden
                    ? "border-slate-700 bg-slate-900 text-slate-500"
                    : "border-slate-600 bg-slate-800/70 text-slate-100"
                }`}
              >
                <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" tickFormatter={formatShortDate} stroke="#64748b" tick={{ fontSize: 12 }} minTickGap={30} />
            <YAxis stroke="#64748b" tick={{ fontSize: 12 }} width={46} />
            <Tooltip content={<CustomTooltip data={data} />} />
            {series.map((item) => {
              if (hiddenSeries[item.key]) return null;
              return (
                <Line
                  key={item.key}
                  type={smoothing ? "monotone" : "linear"}
                  dataKey={item.key}
                  name={item.label}
                  stroke={item.color}
                  strokeWidth={item.key === "total" ? 2.4 : 1.8}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
