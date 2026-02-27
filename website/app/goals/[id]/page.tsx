import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getGoalByIdFromLogs,
  getGoalRadarFromLogs,
  type DetailedGoal as Goal,
  type GoalContribution,
  type GoalCategory,
} from "@/data/test-logs-derived";
import GoalRadarPanel from "./GoalRadarPanel";

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
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function GoalHeader({ goal }: { goal: Goal }) {
  const colors = categoryColors[goal.category];

  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 animate-fade-in-up-1">
      {/* Card header */}
      <div className="px-6 py-5 border-b border-slate-800/50 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase border ${colors.bg} ${colors.text} ${colors.border}`}
          >
            {goal.category}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-800/70 border border-slate-700/80 text-[11px] text-slate-300">
            Streak:{" "}
            <span className="font-semibold text-slate-50">
              {goal.streak} days
            </span>
          </span>
        </div>

        {/* Progress badge — right side of header */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-500 uppercase tracking-wide block mb-1">
              Progress
            </span>
            <div className="flex items-center gap-2">
              <div className="w-28 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${goal.progressPercent}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-slate-100 tabular-nums">
                {goal.progressPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-white">{goal.name}</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            {goal.description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {goal.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Date range */}
          <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0">
            <div>
              <span className="text-slate-500 uppercase tracking-wide text-[11px] font-medium block mb-0.5">
                Start
              </span>
              {formatDate(goal.startDate)}
            </div>
            <svg
              className="w-4 h-4 text-slate-700 shrink-0"
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
            <div>
              <span className="text-slate-500 uppercase tracking-wide text-[11px] font-medium block mb-0.5">
                Target
              </span>
              {formatDate(goal.targetDate)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalTimeline({ goal }: { goal: Goal }) {
  const sortedEvents = [...goal.events].sort((a, b) => {
    const aKey = `${a.date}T${a.time}`;
    const bKey = `${b.date}T${b.time}`;
    return aKey < bKey ? 1 : aKey > bKey ? -1 : 0;
  });

  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 animate-fade-in-up-2">
      {/* Section header */}
      <div className="px-6 py-5 border-b border-slate-800/50 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Timeline</h2>
          <p className="text-sm text-slate-400 mt-1">
            Recent sessions, milestones, and notes for this goal.
          </p>
        </div>
        <span className="text-[11px] text-slate-500 shrink-0 px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/60">
          {sortedEvents.length}{" "}
          {sortedEvents.length === 1 ? "event" : "events"}
        </span>
      </div>

      {/* Timeline body */}
      <div className="p-6">
        {sortedEvents.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center">
            No events logged yet for this goal.
          </p>
        ) : (
          <div
            className="logs-explorer-scroll min-h-0 overflow-y-auto rounded-xl border border-slate-800/60 bg-slate-900/30 max-h-[min(60vh,34rem)]"
            data-scrollbar="theme"
          >
            <ol className="space-y-6 p-3">
              {sortedEvents.map((event, index) => {
                const isMilestone = event.type === "milestone";
                const isNote = event.type === "note";

                const dotColor = isMilestone
                  ? "bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.20)]"
                  : isNote
                  ? "bg-sky-400 shadow-[0_0_0_3px_rgba(56,189,248,0.20)]"
                  : "bg-emerald-400 shadow-[0_0_0_3px_rgba(74,222,128,0.20)]";

                const isLast = index === sortedEvents.length - 1;

                return (
                  <li
                    key={`${event.date}-${event.time}-${index}`}
                    className="flex gap-4"
                  >
                    {/* Left rail */}
                    <div className="relative flex w-10 shrink-0 justify-center">
                      <span
                        className={`relative z-10 mt-1.5 h-2.5 w-2.5 rounded-full border border-slate-900/80 ${dotColor}`}
                      />
                      {!isLast && (
                        <span className="absolute top-4 bottom-[-24px] left-1/2 w-px -translate-x-1/2 bg-slate-800/70" />
                      )}
                    </div>

                    {/* Event card */}
                    <div className="flex-1 min-w-0 rounded-xl border border-slate-800/70 bg-slate-950/40 px-4 py-3 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[11px] font-semibold uppercase tracking-wide ${
                            isMilestone
                              ? "text-amber-400"
                              : isNote
                              ? "text-sky-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {event.type === "milestone"
                            ? "Milestone"
                            : event.type === "note"
                            ? "Note"
                            : "Session"}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {formatDate(event.date)} at {event.time}
                        </span>
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed">
                        {event.text}
                      </p>

                      {event.value && (
                        <p className="text-[11px] text-emerald-300 font-medium">
                          {"km" in event.value && `${event.value.km} km`}
                          {"hours" in event.value && `${event.value.hours}h`}
                        </p>
                      )}

                      {event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {event.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-800/80 text-[10px] text-slate-400"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

function formatCompactDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function ProgressLineChart({ series }: { series: Goal["timeSeries"] }) {
  const sortedSeries = [...series].sort((a, b) => a.date.localeCompare(b.date));
  const chartWidth = 320;
  const chartHeight = 120;
  const padding = 12;

  if (sortedSeries.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4">
        <p className="text-sm text-slate-500">No progress history yet.</p>
      </div>
    );
  }

  const maxValue = Math.max(100, ...sortedSeries.map((point) => point.value));
  const xStep = sortedSeries.length > 1 ? (chartWidth - padding * 2) / (sortedSeries.length - 1) : 0;

  const points = sortedSeries
    .map((point, index) => {
      const x = padding + index * xStep;
      const y = chartHeight - padding - (point.value / maxValue) * (chartHeight - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const latestValue = sortedSeries[sortedSeries.length - 1]?.value ?? 0;

  return (
    <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400">Progress over time</p>
        <span className="text-sm font-semibold text-emerald-300 tabular-nums">
          {latestValue}%
        </span>
      </div>

      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="h-28 w-full"
        role="img"
        aria-label="Progress trend over time"
      >
        <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} className="stroke-slate-800" />
        <polyline points={points} fill="none" className="stroke-emerald-400" strokeWidth={2.5} strokeLinecap="round" />
        {sortedSeries.map((point, index) => {
          const x = padding + index * xStep;
          const y = chartHeight - padding - (point.value / maxValue) * (chartHeight - padding * 2);
          return <circle key={`${point.date}-${index}`} cx={x} cy={y} r={2.5} className="fill-emerald-300" />;
        })}
      </svg>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
        <span>{formatCompactDate(sortedSeries[0].date)}</span>
        <span>{formatCompactDate(sortedSeries[sortedSeries.length - 1].date)}</span>
      </div>
    </div>
  );
}

function GoalInsights({ goal }: { goal: Goal }) {
  const insightSeries = goal.timeSeries.length > 0 ? goal.timeSeries : [{ date: goal.startDate, value: goal.progressPercent }];
  const milestones = goal.milestones;
  const mappedEvents =
    goal.contributionEvents.length > 0
      ? goal.contributionEvents
      : goal.events.slice(0, 4).map((event, index) => ({
          id: `${goal.id}-event-${index}`,
          date: event.date,
          text: event.text,
          contribution: (event.type === "session" ? "major" : event.type === "milestone" ? "minor" : "note") as GoalContribution,
        }));

  const contributionStyles: Record<GoalContribution, string> = {
    major: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
    minor: "bg-sky-500/15 text-sky-300 border border-sky-500/30",
    note: "bg-slate-700/40 text-slate-300 border border-slate-600/60",
  };

  const totalSessions = mappedEvents.filter((event) => event.contribution !== "note").length;
  const avgSessionsPerWeek = totalSessions > 0 ? (totalSessions / 2).toFixed(1) : "0.0";

  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 p-6 mt-6 lg:mt-0 animate-fade-in-up-3">
      <div>
        <h2 className="text-base font-semibold text-white">Goal Insights</h2>
        <p className="mt-1 text-sm text-slate-400">
          Momentum, milestones, contribution patterns, and motivation.
        </p>
      </div>

      <div className="mt-4 space-y-4">
        <ProgressLineChart series={insightSeries} />

        <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4 space-y-3">
          <h3 className="text-sm font-medium text-slate-100">Milestones</h3>
          {milestones.length === 0 ? (
            <p className="text-sm text-slate-500">No milestones yet.</p>
          ) : (
            <div
              className="logs-explorer-scroll min-h-0 overflow-y-auto rounded-lg border border-slate-800/60 bg-slate-900/30 max-h-56 p-2"
              data-scrollbar="theme"
            >
              <ul className="space-y-2">
                {milestones.map((milestone) => (
                  <li key={milestone.id} className="flex items-center justify-between gap-3 rounded-md px-2 py-1">
                    <div>
                      <p className="text-sm text-slate-100">{milestone.title}</p>
                      <p className="text-xs text-slate-500">{formatDate(milestone.date)}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] border ${
                        milestone.isUpcoming
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                          : "bg-slate-700/30 text-slate-300 border-slate-600/60"
                      }`}
                    >
                      {milestone.isUpcoming ? "Upcoming" : "Completed"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4 space-y-3">
          <h3 className="text-sm font-medium text-slate-100">Activity → Goal Mapping</h3>
          <div
            className="logs-explorer-scroll min-h-0 overflow-y-auto rounded-lg border border-slate-800/60 bg-slate-900/30 max-h-56 p-2"
            data-scrollbar="theme"
          >
            <ul className="space-y-2">
              {mappedEvents.map((event) => (
                <li key={event.id} className="flex items-center justify-between gap-3 rounded-md px-2 py-1">
                  <div>
                    <p className="text-sm text-slate-100">{event.text}</p>
                    <p className="text-xs text-slate-500">{formatDate(event.date)}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] capitalize ${contributionStyles[event.contribution]}`}>
                    {event.contribution}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4 space-y-3">
          <h3 className="text-sm font-medium text-slate-100">Effort &amp; Consistency</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-[11px] text-slate-500">🔥 Streak</p>
              <p className="text-sm font-semibold text-slate-100">{goal.streak} days</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-[11px] text-slate-500">Avg sessions/week</p>
              <p className="text-sm font-semibold text-slate-100">{avgSessionsPerWeek}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-[11px] text-slate-500">Total sessions</p>
              <p className="text-sm font-semibold text-slate-100">{totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4">
          <h3 className="text-sm font-medium text-slate-100">Why this goal matters</h3>
          <p className="mt-2 text-sm text-slate-300 italic">
            {goal.why || "Keep moving toward the person you want to become."}
          </p>
          <p className="mt-2 text-[11px] text-slate-500">This is your long-term motivation</p>
        </div>
      </div>
    </section>
  );
}

interface GoalDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function GoalDetailPage({ params }: GoalDetailPageProps) {
  const { id } = await params;
  const goal = getGoalByIdFromLogs(id);

  if (!goal) {
    return notFound();
  }

  const radarData = getGoalRadarFromLogs(goal.id);

  return (
    <main className="min-h-screen pt-20 pb-12 px-4 lg:px-8">
      <div className="max-w-[1200px] mx-auto space-y-4">
        {/* Back nav */}
        <div className="mb-2">
          <Link
            href="/goals"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100 transition-colors"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to goals
          </Link>
        </div>

        <GoalHeader goal={goal} />

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-4 items-start">
          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 animate-fade-in-up-2">
              <div className="mb-4 flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-base font-semibold text-white">Life Balance Radar</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Static preview of this goal across key dimensions.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-800/70 border border-slate-700/80 text-[11px] text-slate-300">
                  Derived from test logs
                </span>
              </div>
              <div className="flex justify-center">
                <GoalRadarPanel data={radarData} />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                <span className="px-2 py-0.5 rounded-full bg-slate-800/70 border border-slate-700/70">
                  Direct: Work, Health, Relationships
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800/70 border border-slate-700/70">
                  Inferred: Mind, Body, Social (from text + tags)
                </span>
              </div>
            </section>

            <GoalTimeline goal={goal} />
          </div>

          <GoalInsights goal={goal} />
        </div>
      </div>
    </main>
  );
}
