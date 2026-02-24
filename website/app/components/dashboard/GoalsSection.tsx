"use client";

import { useState, useMemo } from "react";
import GoalCard, { Goal } from "./GoalCard";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_GOALS: Goal[] = [
  {
    id: "1",
    name: "Go to gym",
    category: "Health",
    streak: 5,
    completionRate: 80,
    frequency: "3x per week",
    icon: "🏋️",
    recentDays: [true, true, false, true, true, true, true],
  },
  {
    id: "2",
    name: "Deep work sessions",
    category: "Work",
    streak: 3,
    completionRate: 60,
    frequency: "Daily",
    icon: "💻",
    recentDays: [true, false, true, false, true, true, true],
  },
  {
    id: "3",
    name: "Read before bed",
    category: "Health",
    streak: 12,
    completionRate: 92,
    frequency: "Daily",
    icon: "📚",
    recentDays: [true, true, true, true, true, true, true],
  },
  {
    id: "4",
    name: "Call a friend or family",
    category: "Relationships",
    streak: 1,
    completionRate: 35,
    frequency: "2x per week",
    icon: "📞",
    recentDays: [false, false, false, false, true, false, false],
  },
  {
    id: "5",
    name: "Morning walk",
    category: "Health",
    streak: 0,
    completionRate: 20,
    frequency: "Daily",
    icon: "🚶",
    recentDays: [false, true, false, false, false, false, false],
  },
  {
    id: "6",
    name: "Team check-ins",
    category: "Work",
    streak: 8,
    completionRate: 95,
    frequency: "Daily",
    icon: "💼",
    recentDays: [true, true, true, true, true, true, true],
  },
];

// ─── Sort modes ───────────────────────────────────────────────────────────────

type SortMode = "streak" | "needs-work";

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  // { id: "streak", label: "🔥 Top Streaks" },
  // { id: "needs-work", label: "⚠️ Needs Work" },
];

function sortGoals(goals: Goal[], mode: SortMode): Goal[] {
  return [...goals].sort((a, b) =>
    mode === "streak"
      ? b.streak - a.streak
      : a.completionRate - b.completionRate
  );
}

// ─── Summary stats ────────────────────────────────────────────────────────────

function computeStats(goals: Goal[]) {
  const active = goals.filter((g) => g.streak > 0).length;
  const avgCompletion = Math.round(
    goals.reduce((s, g) => s + g.completionRate, 0) / goals.length
  );
  const topStreak = Math.max(...goals.map((g) => g.streak));
  const struggling = goals.filter((g) => g.completionRate < 40).length;
  return { active, avgCompletion, topStreak, struggling };
}

// ─── GoalsSection ─────────────────────────────────────────────────────────────

export default function GoalsSection() {
  const [sortMode, setSortMode] = useState<SortMode>("streak");

  const sorted = useMemo(() => sortGoals(MOCK_GOALS, sortMode), [sortMode]);
  const stats = useMemo(() => computeStats(MOCK_GOALS), []);

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl mb-8 animate-fade-in-up-3">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-800/50 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Goals &amp; Progress</h2>
          <p className="text-sm text-slate-400 mt-1">{MOCK_GOALS.length} active goals this month</p>
        </div>

        {/* Sort toggle – commented out for now
        <div className="flex items-center gap-0.5 bg-slate-950/60 border border-slate-800/50 rounded-xl p-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSortMode(opt.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                sortMode === opt.id
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        */}
      </div>

      {/* Goal cards grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>

      {/* Summary footer */}
      <div className="px-6 py-4 border-t border-slate-800/40 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">On streak</p>
            <p className="text-base font-bold text-white mt-1">
              {stats.active}
              <span className="text-sm font-normal text-slate-500 ml-1">/ {MOCK_GOALS.length}</span>
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg completion</p>
            <p className="text-base font-bold text-white mt-1">
              {stats.avgCompletion}
              <span className="text-sm font-normal text-slate-500 ml-0.5">%</span>
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Best streak</p>
            <p className="text-base font-bold text-amber-400 mt-1">
              🔥 {stats.topStreak}
              <span className="text-sm font-normal text-slate-500 ml-1">days</span>
            </p>
          </div>
          {/* Needs attention – commented out for now
          {stats.struggling > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Needs attention</p>
              <p className="text-base font-bold text-rose-400 mt-1">
                {stats.struggling}
                <span className="text-sm font-normal text-slate-500 ml-1">goal{stats.struggling !== 1 ? "s" : ""}</span>
              </p>
            </div>
          )}
          */}
        </div>
        <p className="text-xs text-slate-600 italic">last 7 days shown per goal</p>
      </div>
    </div>
  );
}
