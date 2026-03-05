"use client";

import type { DateRange } from "@/data/mock-stats";

type ChartControlsProps = {
  range: DateRange;
  ranges: readonly DateRange[];
  smoothing: boolean;
  onRangeChange: (range: DateRange) => void;
  onSmoothingChange: (value: boolean) => void;
  onExportCsv: () => void;
};

export default function ChartControls({
  range,
  ranges,
  smoothing,
  onRangeChange,
  onSmoothingChange,
  onExportCsv,
}: ChartControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800/70 bg-slate-900/70 p-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Range</span>
        <div className="flex items-center gap-1 rounded-lg bg-slate-950/60 p-1">
          {ranges.map((value) => {
            const active = value === range;
            return (
              <button
                key={value}
                onClick={() => onRangeChange(value)}
                className={`cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
                }`}
              >
                Last {value}
              </button>
            );
          })}
          <span className="px-1.5 text-xs text-slate-500">days</span>
        </div>
      </div>

      <label className="ml-auto flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-300">
        <input
          type="checkbox"
          className="h-3.5 w-3.5 accent-emerald-500"
          checked={smoothing}
          onChange={(event) => onSmoothingChange(event.target.checked)}
        />
        Smooth lines
      </label>

      <button
        onClick={onExportCsv}
        className="cursor-pointer rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800/70"
      >
        Export CSV
      </button>
    </div>
  );
}
