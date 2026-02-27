import Link from "next/link";
import { GOALS, type Goal, type GoalCategory } from "@/data/mockGoals";

const categoryColors: Record<
  GoalCategory,
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

function GoalCard({ goal }: { goal: Goal }) {
  const colors = categoryColors[goal.category];

  return (
    <Link
      href={`/goals/${goal.id}`}
      className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4 hover:bg-white/10 hover:border-slate-500/60 transition-colors"
    >
      {/* Top: meta + progress */}
      <div className="flex items-start justify-between gap-4">
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
          <h2 className="text-sm font-semibold text-white truncate">
            {goal.name}
          </h2>
          <p className="text-xs text-slate-400 line-clamp-2">
            {goal.description}
          </p>
        </div>

        {/* Progress — fixed width so bars align across cards */}
        <div className="flex flex-col items-end gap-1 shrink-0 w-28">
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

      {/* Middle: tags + dates */}
      <div className="flex items-center justify-between gap-4 text-[11px] text-slate-500">
        <div className="flex flex-wrap gap-2">
          {goal.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-800/80 text-[10px] text-slate-300"
            >
              #{tag}
            </span>
          ))}
          {goal.tags.length > 3 && (
            <span className="text-[10px] text-slate-500">
              +{goal.tags.length - 3} more
            </span>
          )}
        </div>
        <span className="shrink-0 text-right">
          {formatDate(goal.startDate)} → {formatDate(goal.targetDate)}
        </span>
      </div>

      {/* Bottom: event count + CTA — mt-auto pins to card bottom */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60 mt-auto">
        <span className="text-[11px] text-slate-500">
          {goal.events.length} recent{" "}
          {goal.events.length === 1 ? "event" : "events"}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 group-hover:text-slate-50">
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
  const sortedGoals = [...GOALS].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <main className="min-h-screen pt-20 pb-12 px-4 lg:px-8">
      <div className="max-w-[1200px] mx-auto space-y-6 animate-fade-in-up-1">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-white">Goals</h1>
            <p className="text-sm text-slate-400">
              High-level outcomes you&apos;re driving, with simple timelines and
              streaks.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      </div>
    </main>
  );
}
