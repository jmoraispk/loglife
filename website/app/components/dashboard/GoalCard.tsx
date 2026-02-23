"use client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GoalCategory = "Work" | "Health" | "Relationships";

export interface Goal {
  id: string;
  name: string;
  category: GoalCategory;
  streak: number;
  completionRate: number; // 0–100
  frequency: string;
  icon: string;
  recentDays: boolean[]; // last 7 days — true = completed
}

// ─── Category config (mirrors donut chart + activity list colors) ─────────────

const CATEGORY_CONFIG: Record<
  GoalCategory,
  { badge: string; barColor: string; glowColor: string }
> = {
  Work: {
    badge: "bg-blue-500/15 text-blue-300",
    barColor: "#3b82f6",
    glowColor: "rgba(59,130,246,0.15)",
  },
  Health: {
    badge: "bg-emerald-500/15 text-emerald-300",
    barColor: "#10b981",
    glowColor: "rgba(16,185,129,0.15)",
  },
  Relationships: {
    badge: "bg-amber-500/15 text-amber-300",
    barColor: "#f59e0b",
    glowColor: "rgba(245,158,11,0.15)",
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) {
    return <span className="text-xs text-slate-600 italic">No streak yet</span>;
  }
  const isHot = streak >= 10;
  return (
    <span
      className={`flex items-center gap-1 text-xs font-semibold ${
        isHot ? "text-amber-400" : "text-slate-300"
      }`}
    >
      🔥{" "}
      <span className={isHot ? "text-amber-400" : "text-white"}>
        {streak}
      </span>{" "}
      day{streak !== 1 ? "s" : ""}
      {isHot && <span className="text-amber-500 ml-0.5">🏆</span>}
    </span>
  );
}

function RecentDays({
  days,
  barColor,
}: {
  days: boolean[];
  barColor: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-slate-600 mr-0.5 select-none">7d</span>
      {days.map((done, i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full transition-colors duration-150"
          style={done ? { backgroundColor: barColor } : { backgroundColor: "rgba(51,65,85,0.7)" }}
        />
      ))}
    </div>
  );
}

// ─── GoalCard ─────────────────────────────────────────────────────────────────

interface GoalCardProps {
  goal: Goal;
}

export default function GoalCard({ goal }: GoalCardProps) {
  const config = CATEGORY_CONFIG[goal.category];
  const isStruggling = goal.completionRate < 40;
  const barColor = isStruggling ? "#f43f5e" : config.barColor;

  return (
    <div
      className="group relative bg-slate-950/50 border border-slate-800/40 rounded-2xl p-5
        transition-all duration-200 cursor-default overflow-hidden
        hover:border-slate-700/60 hover:bg-slate-800/25
        hover:scale-[1.015] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30"
    >
      {/* Colored top-edge accent — animates in on hover */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]
          opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ backgroundColor: config.barColor }}
      />

      {/* Row 1: icon + name + category tag */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl flex-shrink-0 select-none leading-none">{goal.icon}</span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-white truncate leading-snug">{goal.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{goal.frequency}</p>
          </div>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-lg flex-shrink-0 mt-0.5 ${config.badge}`}
        >
          {goal.category}
        </span>
      </div>

      {/* Row 2: completion rate progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">Completion</span>
          <span
            className={`text-sm font-bold tabular-nums ${
              isStruggling ? "text-rose-400" : "text-white"
            }`}
          >
            {goal.completionRate}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${goal.completionRate}%`, backgroundColor: barColor }}
          />
        </div>
      </div>

      {/* Row 3: streak + recent days dots */}
      <div className="flex items-center justify-between">
        <StreakBadge streak={goal.streak} />
        <RecentDays days={goal.recentDays} barColor={config.barColor} />
      </div>
    </div>
  );
}
