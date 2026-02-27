"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import GoalCard, { Goal } from "../GoalCard";
import { getGoalsFromLogs } from "@/data/test-logs-derived";

const FALLBACK_GOALS: Goal[] = [
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

type SortMode = "streak" | "needs-work";

function sortGoals(goals: Goal[], mode: SortMode): Goal[] {
  return [...goals].sort((a, b) =>
    mode === "streak"
      ? b.streak - a.streak
      : a.completionRate - b.completionRate,
  );
}

function computeStats(goals: Goal[]) {
  const active = goals.filter((g) => g.streak > 0).length;
  const avgCompletion = Math.round(
    goals.reduce((s, g) => s + g.completionRate, 0) / goals.length,
  );
  const topStreak = Math.max(...goals.map((g) => g.streak));
  const struggling = goals.filter((g) => g.completionRate < 40).length;
  return { active, avgCompletion, topStreak, struggling };
}

export default function LegacyGoalsSection() {
  const [sortMode] = useState<SortMode>("streak");

  const goals = useMemo(() => {
    const derived = getGoalsFromLogs();
    return derived.length > 0 ? (derived as Goal[]) : FALLBACK_GOALS;
  }, []);

  const sorted = useMemo(() => sortGoals(goals, sortMode), [goals, sortMode]);
  const stats = useMemo(() => computeStats(goals), [goals]);

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl mb-8 animate-fade-in-up-3">
      <div className="px-6 py-5 border-b border-slate-800/50 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Goals &amp; Progress</h2>
          <p className="text-sm text-slate-400 mt-1">{goals.length} active goals this month</p>
        </div>

        <Link
          href="/goals?from=dashboard"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/70 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:bg-slate-700/80 transition-colors"
        >
          View All Goals
          <svg
            className="w-3.5 h-3.5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>

      <div className="px-6 py-4 border-t border-slate-800/40 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">On streak</p>
            <p className="text-base font-bold text-white mt-1">
              {stats.active}
              <span className="text-sm font-normal text-slate-500 ml-1">/ {goals.length}</span>
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
        </div>
        <p className="text-xs text-slate-600 italic">last 7 days shown per goal</p>
      </div>
    </div>
  );
}
