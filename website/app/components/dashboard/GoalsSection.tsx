"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import GoalCard, { Goal } from "./GoalCard";
import { getGoalsFromLogs } from "@/data/test-logs-derived";

// ─── Sort modes ───────────────────────────────────────────────────────────────

type SortMode = "streak" | "needs-work";

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
  const [sortMode] = useState<SortMode>("streak");

  const goals = useMemo(() => getGoalsFromLogs() as Goal[], []);
  const hasGoalActivity = useMemo(
    () =>
      goals.some(
        (goal) =>
          goal.streak > 0 ||
          goal.completionRate > 0 ||
          goal.recentDays.some(Boolean)
      ),
    [goals]
  );

  const sorted = useMemo(() => sortGoals(goals, sortMode), [goals, sortMode]);
  const stats = useMemo(() => computeStats(goals), [goals]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-5 animate-fade-in-up-3 min-h-[260px] lg:min-h-[320px]">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800/50 flex items-center justify-between flex-wrap gap-3">
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

      {hasGoalActivity ? (
        <>
          {/* Goal cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sorted.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>

          {/* Summary footer */}
          <div className="pt-4 border-t border-slate-800/40 flex items-center justify-between flex-wrap gap-4">
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
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-700/70 bg-slate-900/40 px-4 py-6 text-center">
          <p className="text-sm text-slate-300">No goal activity yet.</p>
          <p className="mt-1 text-xs text-slate-500">Start logging to unlock goal progress insights.</p>
          <Link
            href="/logs"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-800/70 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700/80 transition-colors"
          >
            Add your first log
          </Link>
        </div>
      )}
    </div>
  );
}
