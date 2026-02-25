"use client";
import { useState } from "react";

export interface HabitDay {
  date: string;
  value: number;
}

interface HabitHeatmapProps {
  data?: HabitDay[];
  month?: string;
}

interface StatsPanelProps {
  activeDays: number;
  daysInMonth: number;
  avgPercent: number;
  bestValue: number;
  bestDayLabel: string;
  currentStreak: number;
}

const MOCK_DATA: HabitDay[] = [
  { date: "2026-01-01", value: 70 },
  { date: "2026-01-02", value: 82 },
  { date: "2026-01-03", value: 35 },
  { date: "2026-01-04", value: 20 },
  { date: "2026-01-05", value: 76 },
  { date: "2026-01-06", value: 88 },
  { date: "2026-01-07", value: 64 },
  { date: "2026-01-08", value: 90 },
  { date: "2026-01-09", value: 72 },
  { date: "2026-01-10", value: 28 },
  { date: "2026-01-11", value: 0 },
  { date: "2026-01-12", value: 68 },
  { date: "2026-01-13", value: 80 },
  { date: "2026-01-14", value: 92 },
  { date: "2026-01-15", value: 74 },
  { date: "2026-01-16", value: 58 },
  { date: "2026-01-17", value: 32 },
  { date: "2026-01-18", value: 18 },
  { date: "2026-01-19", value: 84 },
  { date: "2026-01-20", value: 66 },
  { date: "2026-01-21", value: 0 },
  { date: "2026-01-22", value: 52 },
  { date: "2026-01-23", value: 74 },
  { date: "2026-01-24", value: 40 },
  { date: "2026-01-25", value: 22 },
  { date: "2026-01-26", value: 86 },
  { date: "2026-01-27", value: 79 },
  { date: "2026-01-28", value: 67 },
  { date: "2026-01-29", value: 83 },
  { date: "2026-01-30", value: 71 },
  { date: "2026-01-31", value: 36 },
];

function getIntensityColor(value: number): string {
  if (value === 0) return "rgba(39,39,42,0.82)";
  if (value <= 25) return "rgba(34,197,94,0.24)";
  if (value <= 50) return "rgba(34,197,94,0.4)";
  if (value <= 75) return "rgba(34,197,94,0.56)";
  return "rgba(34,197,94,0.7)";
}

function formatTooltipDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTooltipValue(value: number): string {
  return `${value}% productive`;
}

function formatShortMonthDay(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LEGEND_LEVELS = [0, 20, 45, 70, 95] as const;

function StatsPanel({
  activeDays,
  daysInMonth,
  avgPercent,
  bestValue,
  bestDayLabel,
  currentStreak,
}: StatsPanelProps) {
  return (
    <aside className="h-full flex flex-col bg-gradient-to-b from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-sm rounded-xl p-4 md:p-5 transition-all duration-200 ease-out hover:-translate-y-px hover:brightness-105">
      <div className="flex flex-col flex-1 gap-4">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white">Month Snapshot</h3>
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-medium text-white/40 uppercase tracking-widest">Active days</p>
              <p className="text-lg font-semibold text-white mt-0.5">
                {activeDays}
                <span className="text-base font-normal text-white/40 ml-1">/ {daysInMonth}</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-white/40 uppercase tracking-widest">Average</p>
              <p className="text-lg font-semibold text-white mt-0.5">
                {avgPercent}
                <span className="text-base font-normal text-white/40 ml-0.5">%</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-white/40 uppercase tracking-widest">Best</p>
              <p className="text-lg font-semibold text-emerald-300 mt-0.5">
                {bestValue}
                <span className="text-base font-normal text-white/40 ml-0.5">%</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-4">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="space-y-3">
            <h4 className="text-[11px] font-medium uppercase tracking-widest text-white/40">Insights</h4>
            <p className="text-sm text-white/70">Best day: {bestDayLabel} ({bestValue}%)</p>
            <p className="text-sm text-white/70">Current streak: {currentStreak} days</p>
          </div>
        </div>

        <div className="space-y-4 mt-auto pt-2">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-medium text-white/35">Less</span>
            <div className="flex items-center gap-1.5">
              {LEGEND_LEVELS.map((v) => (
                <div
                  key={`panel-legend-${v}`}
                  className="w-2.5 h-2.5 rounded-[4px]"
                  style={{ backgroundColor: getIntensityColor(v) }}
                />
              ))}
            </div>
            <span className="text-[11px] font-medium text-white/35">More</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function LegacyHabitHeatmap({
  data = MOCK_DATA,
  month = "2026-01",
}: HabitHeatmapProps) {
  const today = new Date().toISOString().split("T")[0];
  const [hoveredStreakId, setHoveredStreakId] = useState<number | null>(null);

  const [year, monthNum] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNum - 1, 1);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const startDayOfWeek = firstDay.getDay();

  const monthLabel = firstDay.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const dataMap = new Map(data.map((d) => [d.date, d.value]));
  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const activeDays = data.filter((d) => d.value > 0).length;
  const avgPercent =
    activeDays > 0
      ? Math.round(data.filter((d) => d.value > 0).reduce((sum, d) => sum + d.value, 0) / activeDays)
      : 0;
  const bestDay =
    sortedData.length > 0
      ? sortedData.reduce((best, day) => (day.value > best.value ? day : best), sortedData[0])
      : null;

  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return { day, date, value: dataMap.get(date) ?? 0 };
  });

  type StreakMeta = {
    streakId: number | null;
    isStreak: boolean;
    isCurrentStreak: boolean;
  };

  const streakMetaByDate = new Map<string, StreakMeta>();
  monthDays.forEach((entry) =>
    streakMetaByDate.set(entry.date, {
      streakId: null,
      isStreak: false,
      isCurrentStreak: false,
    }),
  );

  let streakCounter = 0;
  let i = 0;
  while (i < monthDays.length) {
    if (monthDays[i].value <= 0) {
      i += 1;
      continue;
    }
    const start = i;
    while (i < monthDays.length && monthDays[i].value > 0) i += 1;
    const end = i - 1;
    const runLength = end - start + 1;
    const streakId = runLength >= 2 ? streakCounter++ : null;
    for (let idx = start; idx <= end; idx++) {
      streakMetaByDate.set(monthDays[idx].date, {
        streakId,
        isStreak: runLength >= 2,
        isCurrentStreak: false,
      });
    }
  }

  let currentStreak = 0;
  let currentEnd = monthDays.length - 1;
  while (currentEnd >= 0 && monthDays[currentEnd].value <= 0) currentEnd -= 1;
  if (currentEnd >= 0) {
    let currentStart = currentEnd;
    while (currentStart >= 0 && monthDays[currentStart].value > 0) currentStart -= 1;
    currentStart += 1;
    currentStreak = currentEnd - currentStart + 1;
    for (let idx = currentStart; idx <= currentEnd; idx++) {
      const prevMeta = streakMetaByDate.get(monthDays[idx].date) ?? {
        streakId: null,
        isStreak: false,
        isCurrentStreak: false,
      };
      streakMetaByDate.set(monthDays[idx].date, {
        ...prevMeta,
        isCurrentStreak: true,
      });
    }
  }

  type Cell =
    | { type: "empty"; key: string }
    | {
        type: "day";
        day: number;
        date: string;
        value: number;
        streakId: number | null;
        isStreak: boolean;
        isCurrentStreak: boolean;
      };

  const cells: Cell[] = [];

  for (let j = 0; j < startDayOfWeek; j++) {
    cells.push({ type: "empty", key: `pre-${j}` });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const streakMeta = streakMetaByDate.get(dateStr) ?? {
      streakId: null,
      isStreak: false,
      isCurrentStreak: false,
    };
    cells.push({
      type: "day",
      day: d,
      date: dateStr,
      value: dataMap.get(dateStr) ?? 0,
      streakId: streakMeta.streakId,
      isStreak: streakMeta.isStreak,
      isCurrentStreak: streakMeta.isCurrentStreak,
    });
  }

  const remainder = cells.length % 7;
  if (remainder !== 0) {
    for (let j = 0; j < 7 - remainder; j++) {
      cells.push({ type: "empty", key: `post-${j}` });
    }
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl mb-8 animate-fade-in-up-2">
      <div className="px-5 py-4 border-b border-slate-800/50">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white">Monthly Habit Overview</h2>
          <p className="text-lg text-white/95 mt-0.5">{monthLabel}</p>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-[560px_1fr] gap-6 md:gap-8 items-stretch">
          <div className="w-full max-w-[560px]">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-[11px] font-medium text-white/35">Less</span>
              <div className="flex items-center gap-1.5">
                {LEGEND_LEVELS.map((v) => (
                  <div
                    key={`left-legend-${v}`}
                    className="w-2.5 h-2.5 rounded-[4px]"
                    style={{ backgroundColor: getIntensityColor(v) }}
                  />
                ))}
              </div>
              <span className="text-[11px] font-medium text-white/35">More</span>
            </div>

            <div className="grid grid-cols-7 w-full gap-2 mb-1.5">
              {WEEKDAYS.map((label) => (
                <div
                  key={label}
                  className="text-center text-[11px] font-medium text-white/50 py-0 select-none"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 w-full gap-2 p-1 rounded-lg bg-slate-800/20 ring-1 ring-slate-700/30">
              {cells.map((cell, idx) => {
                if (cell.type === "empty") {
                  return (
                    <div
                      key={cell.key}
                      className="aspect-square w-full rounded-md bg-zinc-900/45 border border-white/5 pointer-events-none"
                    />
                  );
                }

                const isToday = cell.date === today;
                const isHoveredStreak = cell.streakId !== null && hoveredStreakId === cell.streakId;
                const isInactive = cell.value <= 0;

                return (
                  <div
                    key={`${cell.date}-${idx}`}
                    className="relative group aspect-square w-full"
                    onMouseEnter={() => setHoveredStreakId(cell.streakId)}
                    onMouseLeave={() => setHoveredStreakId(null)}
                  >
                    <div
                      className={`w-full h-full rounded-md border border-white/10 [box-shadow:inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(15,23,42,0.2)] transition-all duration-200 ease-out cursor-pointer
                    hover:scale-[1.06] hover:border-white/30 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_10px_rgba(34,197,94,0.3)] hover:z-10
                    ${isInactive ? "border-zinc-700/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),inset_0_-1px_0_rgba(0,0,0,0.35)]" : ""}
                    ${cell.isStreak ? "border-emerald-300/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(15,23,42,0.2),0_0_8px_rgba(34,197,94,0.14)]" : ""}
                    ${isHoveredStreak ? "scale-[1.03] border-emerald-300/45 brightness-110 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_10px_rgba(34,197,94,0.24)]" : ""}
                    ${cell.isCurrentStreak ? "ring-1 ring-emerald-300/40 ring-inset" : ""}
                    ${isToday ? "ring-1 ring-white/25 shadow-[0_0_0_1px_rgba(34,197,94,0.2)]" : ""}
                  `}
                      style={{ backgroundColor: getIntensityColor(cell.value) }}
                    >
                      <span className={`absolute inset-0 flex items-center justify-center text-sm font-semibold [text-shadow:0_1px_1px_rgba(2,6,23,0.75)] select-none pointer-events-none ${isInactive ? "text-white/55" : "text-white/90"}`}>
                        {cell.day}
                      </span>
                      {cell.isStreak && (
                        <span
                          className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-[2px] rounded-full pointer-events-none
                          ${cell.isCurrentStreak ? "w-[18px] bg-emerald-300/75" : "w-[14px] bg-emerald-300/55"}`}
                        />
                      )}
                    </div>

                    <div
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                    opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out
                    pointer-events-none z-30 whitespace-nowrap"
                    >
                      <div className="bg-slate-800/95 border border-white/10 rounded-lg px-2.5 py-1.5 shadow-2xl backdrop-blur-sm">
                        <p className="text-xs font-semibold text-white">
                          {formatTooltipDate(cell.date)}
                          {isToday && (
                            <span className="ml-1.5 text-[10px] font-medium text-emerald-400">Today</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-300 mt-0.5">
                          {formatTooltipValue(cell.value)}
                        </p>
                      </div>
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
          </div>

          <div className="w-full min-w-0">
            <StatsPanel
              activeDays={activeDays}
              daysInMonth={daysInMonth}
              avgPercent={avgPercent}
              bestValue={bestDay?.value ?? 0}
              bestDayLabel={bestDay ? formatShortMonthDay(bestDay.date) : "-"}
              currentStreak={currentStreak}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
