"use client";

import Sparkline from "@/components/stats/Sparkline";

type KPICardProps = {
  label: string;
  value: string;
  changePct: number;
  helperText?: string;
  sparklineValues?: number[];
};

export default function KPICard({
  label,
  value,
  changePct,
  helperText,
  sparklineValues = [],
}: KPICardProps) {
  const positive = changePct >= 0;

  return (
    <article className="animate-fade-in-up rounded-xl border border-slate-800/70 bg-slate-900/70 p-4 transition-transform duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-100">{value}</p>
          <p className={`mt-1 text-xs font-medium ${positive ? "text-emerald-400" : "text-rose-400"}`}>
            {positive ? "+" : ""}
            {changePct.toFixed(1)}% vs previous period
          </p>
          {helperText ? <p className="mt-1 text-xs text-slate-500">{helperText}</p> : null}
        </div>
        {sparklineValues.length > 0 ? (
          <Sparkline values={sparklineValues} color={positive ? "#34d399" : "#f43f5e"} />
        ) : null}
      </div>
    </article>
  );
}
