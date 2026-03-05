"use client";

import Link from "next/link";
import GoalTagList from "@/components/goals/GoalTagList";
import type { TagNode } from "@/data/mock/tags";
import type { DetailedGoal } from "@/data/test-logs-derived";

export type GoalListItem = Pick<
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

export default function GoalCard({
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
