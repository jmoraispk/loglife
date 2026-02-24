"use client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HabitDay {
  date: string; // "YYYY-MM-DD"
  value: number; // 0–100
}

interface HabitHeatmapProps {
  data?: HabitDay[];
  month?: string; // "YYYY-MM"
}

// ─── Mock data (Feb 2026 — realistic weekday/weekend pattern) ─────────────────

const MOCK_DATA: HabitDay[] = [
  { date: "2026-02-01", value: 30 }, // Sun
  { date: "2026-02-02", value: 75 }, // Mon
  { date: "2026-02-03", value: 85 }, // Tue
  { date: "2026-02-04", value: 60 }, // Wed
  { date: "2026-02-05", value: 90 }, // Thu
  { date: "2026-02-06", value: 70 }, // Fri
  { date: "2026-02-07", value: 20 }, // Sat
  { date: "2026-02-08", value: 0 },  // Sun — full rest
  { date: "2026-02-09", value: 80 }, // Mon
  { date: "2026-02-10", value: 65 }, // Tue
  { date: "2026-02-11", value: 88 }, // Wed
  { date: "2026-02-12", value: 72 }, // Thu
  { date: "2026-02-13", value: 55 }, // Fri
  { date: "2026-02-14", value: 35 }, // Sat
  { date: "2026-02-15", value: 25 }, // Sun
  { date: "2026-02-16", value: 92 }, // Mon — peak
  { date: "2026-02-17", value: 78 }, // Tue
  { date: "2026-02-18", value: 0 },  // Wed — off day
  { date: "2026-02-19", value: 45 }, // Thu — recovering
  { date: "2026-02-20", value: 68 }, // Fri
  { date: "2026-02-21", value: 40 }, // Sat
  { date: "2026-02-22", value: 15 }, // Sun
  { date: "2026-02-23", value: 82 }, // Mon — today
  { date: "2026-02-24", value: 58 }, // Tue
  { date: "2026-02-25", value: 76 }, // Wed
  { date: "2026-02-26", value: 88 }, // Thu
  { date: "2026-02-27", value: 62 }, // Fri
  { date: "2026-02-28", value: 30 }, // Sat
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function getIntensityColor(value: number): string {
  if (value === 0) return "rgba(30,41,59,0.7)";
  if (value <= 25) return "rgba(16,185,129,0.22)";
  if (value <= 50) return "rgba(16,185,129,0.45)";
  if (value <= 75) return "rgba(16,185,129,0.68)";
  return "rgba(16,185,129,0.95)";
}

function formatTooltipDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTooltipValue(value: number): string {
  if (value === 0) return "No activity";
  if (value <= 25) return `${value}% — light day`;
  if (value <= 50) return `${value}% — moderate`;
  if (value <= 75) return `${value}% — solid`;
  return `${value}% — excellent`;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LEGEND_LEVELS = [0, 20, 45, 70, 95] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function HabitHeatmap({
  data = MOCK_DATA,
  month = "2026-02",
}: HabitHeatmapProps) {
  const today = new Date().toISOString().split("T")[0];

  const [year, monthNum] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNum - 1, 1);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const startDayOfWeek = firstDay.getDay();

  const monthLabel = firstDay.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const dataMap = new Map(data.map((d) => [d.date, d.value]));

  // Build flat cell array: leading empty + days + trailing empty
  type Cell =
    | { type: "empty"; key: string }
    | { type: "day"; day: number; date: string; value: number };

  const cells: Cell[] = [];

  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push({ type: "empty", key: `pre-${i}` });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ type: "day", day: d, date: dateStr, value: dataMap.get(dateStr) ?? 0 });
  }

  const remainder = cells.length % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      cells.push({ type: "empty", key: `post-${i}` });
    }
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl mb-8 animate-fade-in-up-2">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-800/50 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Monthly Habit Overview</h2>
          <p className="text-sm text-slate-400 mt-1">{monthLabel}</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-slate-500">Less</span>
          <div className="flex items-center gap-1.5">
            {LEGEND_LEVELS.map((v) => (
              <div
                key={v}
                className="w-4 h-4 rounded"
                style={{ backgroundColor: getIntensityColor(v) }}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-slate-500">More</span>
        </div>
      </div>

      {/* Grid */}
      <div className="p-6">
        {/* Weekday labels */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {WEEKDAYS.map((label) => (
            <div
              key={label}
              className="text-center text-[11px] text-slate-500 py-0.5 select-none"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((cell, idx) => {
            if (cell.type === "empty") {
              return (
                <div
                  key={cell.key}
                  className="aspect-square rounded-md opacity-0 pointer-events-none"
                />
              );
            }

            const isToday = cell.date === today;

            return (
              <div key={`${cell.date}-${idx}`} className="relative group aspect-square">
                {/* Cell square */}
                <div
                  className={`w-full h-full rounded-md transition-all duration-150 cursor-pointer
                    hover:brightness-125 hover:scale-[1.12] hover:z-10
                    ${isToday ? "ring-2 ring-emerald-400/70 ring-offset-1 ring-offset-slate-900" : ""}
                  `}
                  style={{ backgroundColor: getIntensityColor(cell.value) }}
                >
                  {/* Day number — subtle overlay */}
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] text-white/25 select-none pointer-events-none">
                    {cell.day}
                  </span>
                </div>

                {/* Tooltip */}
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5
                    opacity-0 group-hover:opacity-100 transition-opacity duration-150
                    pointer-events-none z-30 whitespace-nowrap"
                >
                  <div className="bg-slate-800 border border-slate-700/60 rounded-lg px-3 py-2 shadow-2xl">
                    <p className="text-xs font-semibold text-white">
                      {formatTooltipDate(cell.date)}
                      {isToday && (
                        <span className="ml-1.5 text-[10px] font-medium text-emerald-400">Today</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatTooltipValue(cell.value)}
                    </p>
                  </div>
                  {/* Arrow */}
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2
                      border-l-[5px] border-r-[5px] border-t-[5px]
                      border-l-transparent border-r-transparent border-t-slate-800"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Month summary row */}
        <div className="mt-5 pt-5 border-t border-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active days</p>
              <p className="text-base font-bold text-white mt-1">
                {data.filter((d) => d.value > 0).length}
                <span className="text-sm font-normal text-slate-500 ml-1">/ {daysInMonth}</span>
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg score</p>
              <p className="text-base font-bold text-white mt-1">
                {(() => {
                  const activeDays = data.filter((d) => d.value > 0);
                  return activeDays.length > 0
                    ? Math.round(activeDays.reduce((s, d) => s + d.value, 0) / activeDays.length)
                    : 0;
                })()}
                <span className="text-sm font-normal text-slate-500 ml-0.5">%</span>
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Best day</p>
              <p className="text-base font-bold text-emerald-400 mt-1">
                {Math.max(...data.map((d) => d.value))}
                <span className="text-sm font-normal text-slate-500 ml-0.5">%</span>
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-600 italic">hover cells for details</span>
        </div>
      </div>
    </div>
  );
}
