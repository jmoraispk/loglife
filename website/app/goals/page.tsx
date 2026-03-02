 "use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import GoalTagList from "@/components/goals/GoalTagList";
import { TAGS, type TagNode } from "@/data/mock/tags";
import { getDetailedGoalsFromLogs, type DetailedGoal } from "@/data/test-logs-derived";
import { applyTagFilter } from "@/utils/tags";

type GoalListItem = Pick<
  DetailedGoal,
  | "id"
  | "name"
  | "description"
  | "category"
  | "startDate"
  | "targetDate"
  | "progressPercent"
  | "streak"
> & {
  tagIds: string[];
  eventCount: number;
};

const categoryColors: Record<
  GoalListItem["category"],
  { bg: string; text: string; border: string }
> = {
  Work: {
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    border: "border-sky-500/20",
  },
  Health: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  Relationships: {
    bg: "bg-pink-500/10",
    text: "text-pink-400",
    border: "border-pink-500/20",
  },
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function GoalCard({
  goal,
  taxonomy,
  onTagClick,
}: {
  goal: GoalListItem;
  taxonomy: TagNode[];
  onTagClick: (tagId: string) => void;
}) {
  const colors = categoryColors[goal.category];

  return (
    <Link
      href={`/goals/${goal.id}`}
      className="group flex h-full flex-col rounded-2xl border border-slate-800/60 bg-slate-900/60 hover:bg-slate-900/80 hover:border-slate-700/60 transition-colors"
    >
      <div className="px-5 py-4 border-b border-slate-800/50 flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase border ${colors.bg} ${colors.text} ${colors.border}`}
            >
              {goal.category}
            </span>
            <span className="text-[11px] text-slate-500 uppercase tracking-wide">
              Streak:{" "}
              <span className="text-slate-300 font-semibold">
                {goal.streak} days
              </span>
            </span>
          </div>
          <h2 className="text-sm font-semibold text-white">{goal.name}</h2>
          <p className="text-xs text-slate-400 line-clamp-2">
            {goal.description}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0 w-24 pt-2">
          <span className="text-[11px] text-slate-500 uppercase tracking-wide">
            Progress
          </span>
          <span className="text-sm font-semibold text-slate-100">
            {goal.progressPercent}%
          </span>
          <div className="w-full h-1.5 rounded-full bg-slate-800 mt-0.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{ width: `${goal.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="px-5 py-3 flex items-center justify-between gap-4 text-[11px] text-slate-500">
        <GoalTagList tagIds={goal.tagIds} tree={taxonomy} onTagClick={onTagClick} />
        <span className="shrink-0 text-right">
          {formatDate(goal.startDate)} → {formatDate(goal.targetDate)}
        </span>
      </div>

      <div className="px-5 py-3 border-t border-slate-800/50 flex items-center justify-between gap-2 mt-auto">
        <span className="text-[11px] text-slate-500">
          {goal.eventCount} recent{" "}
          {goal.eventCount === 1 ? "event" : "events"}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors">
          View timeline
          <svg
            className="w-3.5 h-3.5"
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
        </span>
      </div>
    </Link>
  );
}

export default function GoalsPage() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const taxonomy = TAGS;
  const goals = useMemo(
    () =>
      getDetailedGoalsFromLogs().map((goal) => ({
        id: goal.id,
        name: goal.name,
        description: goal.description,
        category: goal.category,
        startDate: goal.startDate,
        targetDate: goal.targetDate,
        progressPercent: goal.progressPercent,
        streak: goal.streak,
        tagIds: Array.from(new Set(goal.tags)),
        eventCount: goal.events.length,
      })),
    []
  );

  const sortedGoals = useMemo(() => {
    const filtered = applyTagFilter(goals, selectedTags);
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }, [goals, selectedTags]);

  return (
    <main className="min-h-screen pt-20 pb-12 px-4 lg:px-8">
      <div className="max-w-[1200px] mx-auto space-y-6 animate-fade-in-up-1">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Goals</h1>
          <p className="mt-1 text-sm text-slate-400">
            High-level outcomes you&apos;re driving, with taxonomy-aware tags.
          </p>
          {selectedTags.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-slate-400">
                Filtering by {selectedTags.length} tag
                {selectedTags.length > 1 ? "s" : ""}
              </span>
              <button
                type="button"
                className="cursor-pointer text-xs text-emerald-300 hover:text-emerald-200"
                onClick={() => setSelectedTags([])}
              >
                Clear filters
              </button>
            </div>
          )}
        </header>

        {sortedGoals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700/70 bg-slate-900/40 px-4 py-6 text-center">
            <p className="text-sm text-slate-300">
              {selectedTags.length > 0 ? "No goals match selected tags." : "No goals yet."}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {selectedTags.length > 0
                ? "Clear filters or add logs with matching tags."
                : "Start logging goal-linked activity to populate this page."}
            </p>
            {selectedTags.length > 0 ? (
              <button
                type="button"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-800/70 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700/80 transition-colors"
                onClick={() => setSelectedTags([])}
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                taxonomy={taxonomy}
                onTagClick={(tagId) =>
                  setSelectedTags((curr) =>
                    curr.includes(tagId) ? curr.filter((id) => id !== tagId) : [...curr, tagId]
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
