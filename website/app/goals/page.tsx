 "use client";

import { useMemo, useState } from "react";
import GoalCard from "@/components/goals/GoalCard";
import { TAGS } from "@/data/mock/tags";
import { MOCK_GOALS_WITH_TAGS } from "@/data/mock/goals-with-tags";
import { getDetailedGoalsFromLogs } from "@/data/test-logs-derived";
import { applyTagFilter } from "@/utils/tags";
import { useDemoMode } from "@/hooks/useDemoMode";

export default function GoalsPage() {
  const { isDemoMode } = useDemoMode();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const taxonomy = TAGS;
  const goals = useMemo(
    () => {
      if (isDemoMode) {
        return MOCK_GOALS_WITH_TAGS.map((goal) => ({
          id: goal.id,
          name: goal.name,
          description: goal.description,
          category: goal.category,
          startDate: goal.startDate,
          targetDate: goal.targetDate,
          progressPercent: goal.progressPercent,
          streak: goal.streak,
          tagIds: Array.from(new Set(goal.tagIds)),
          eventCount: goal.timeline.length,
        }));
      }
      return getDetailedGoalsFromLogs().map((goal) => ({
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
      }));
    },
    [isDemoMode]
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
