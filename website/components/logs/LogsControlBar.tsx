import { DailyDateOption, LogsView, RECENT_COUNT_OPTIONS, RecentCountOption } from "./mockData";

interface LogsControlBarProps {
  view: LogsView;
  dailyDateOptions: DailyDateOption[];
  selectedDate: string;
  selectedRecentCount: RecentCountOption;
  onViewChange: (view: LogsView) => void;
  onDateChange: (date: string) => void;
  onRecentCountChange: (count: RecentCountOption) => void;
}

function ToggleButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
        active
          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
          : "bg-slate-800/70 text-slate-300 border border-slate-700/70 hover:bg-slate-700/70"
      }`}
    >
      {label}
    </button>
  );
}

export default function LogsControlBar({
  view,
  dailyDateOptions,
  selectedDate,
  selectedRecentCount,
  onViewChange,
  onDateChange,
  onRecentCountChange,
}: LogsControlBarProps) {
  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="inline-flex items-center gap-2">
        <ToggleButton active={view === "daily"} label="Daily View" onClick={() => onViewChange("daily")} />
        <ToggleButton active={view === "recent"} label="Recent Logs" onClick={() => onViewChange("recent")} />
      </div>

      {view === "daily" ? (
        <label className="inline-flex items-center gap-2 text-sm text-slate-400">
          <span>Date:</span>
          <select
            value={selectedDate}
            onChange={(event) => onDateChange(event.target.value)}
            className="rounded-lg bg-slate-950/70 border border-slate-700/70 text-slate-200 text-sm px-3 py-1.5 outline-none focus:border-emerald-500/40 transition-colors"
          >
            {dailyDateOptions.length === 0 ? (
              <option value="">No dates</option>
            ) : (
              dailyDateOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            )}
          </select>
        </label>
      ) : (
        <label className="inline-flex items-center gap-2 text-sm text-slate-400">
          <span>Last:</span>
          <select
            value={selectedRecentCount}
            onChange={(event) => onRecentCountChange(Number(event.target.value) as RecentCountOption)}
            className="rounded-lg bg-slate-950/70 border border-slate-700/70 text-slate-200 text-sm px-3 py-1.5 outline-none focus:border-emerald-500/40 transition-colors"
          >
            {RECENT_COUNT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
