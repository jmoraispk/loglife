"use client";

import Link from "next/link";
import ActivityList from "../ActivityList";
import LegacyDonutChart, { LegacyCategoryData } from "../legacy/LegacyDonutChart";
import { getTodayOverviewFromLogs } from "@/data/test-logs-derived";
import { useDemoMode } from "@/hooks/useDemoMode";
import type { Activity } from "@/data/test-logs-derived";

const EMPTY_CHART_DATA: LegacyCategoryData[] = [
  { label: "No activities", value: 100, color: "#475569" },
];

const DEMO_CATEGORIES: LegacyCategoryData[] = [
  { label: "Work", value: 46, color: "#3b82f6" },
  { label: "Health", value: 31, color: "#10b981" },
  { label: "Relationships", value: 23, color: "#f59e0b" },
];

const DEMO_ACTIVITIES: Activity[] = [
  { id: "demo-1", title: "Deep-work architecture sprint", category: "Work", time: "9:00 AM", icon: "💼" },
  { id: "demo-2", title: "45-minute gym strength session", category: "Health", time: "12:30 PM", icon: "🏃" },
  { id: "demo-3", title: "Client roadmap sync", category: "Work", time: "2:00 PM", icon: "💼" },
  { id: "demo-4", title: "Call with family", category: "Relationships", time: "8:15 PM", icon: "👨‍👩‍👧" },
];

type AudioOverviewStats = {
  totalCount: number;
  todayCount: number;
  todayDurationSeconds: number;
  transcriptsCount: number;
};

type AudioOverviewItem = {
  messageId: string;
  transcription: string;
  modified: string | null;
};

function formatDurationLabel(seconds: number): string {
  if (seconds <= 0) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainderSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainderSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainderMinutes = minutes % 60;
  return `${hours}h ${remainderMinutes}m`;
}

export default function NonDeveloperTodayOverview({
  audioStats,
  audioItems,
}: {
  audioStats?: AudioOverviewStats;
  audioItems?: AudioOverviewItem[];
}) {
  const { isDemoMode } = useDemoMode();
  const todayDateString = new Date().toISOString().slice(0, 10);
  const { categories, activities } = isDemoMode
    ? { categories: DEMO_CATEGORIES, activities: DEMO_ACTIVITIES }
    : getTodayOverviewFromLogs(todayDateString);
  const hasLogData = activities.length > 0;
  const todayAudioActivities: Activity[] = (audioItems ?? [])
    .filter((item) => {
      if (!item.modified) return false;
      const date = new Date(item.modified);
      if (Number.isNaN(date.getTime())) return false;
      return date.toISOString().slice(0, 10) === todayDateString;
    })
    .sort((a, b) => {
      const aMs = a.modified ? new Date(a.modified).getTime() : 0;
      const bMs = b.modified ? new Date(b.modified).getTime() : 0;
      return bMs - aMs;
    })
    .slice(0, 3)
    .map((item) => {
      const date = item.modified ? new Date(item.modified) : null;
      const title = item.transcription.trim()
        ? item.transcription.trim().slice(0, 72)
        : `Voice note ${item.messageId.slice(0, 8)}`;
      return {
        id: `audio-${item.messageId}`,
        title: title.length >= 72 ? `${title}...` : title,
        category: "Health" as const,
        time: date && !Number.isNaN(date.getTime())
          ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
          : "Unknown time",
        icon: "🎤",
      };
    });
  const hasAudioFallback = !hasLogData && todayAudioActivities.length > 0;
  const hasData = hasLogData || hasAudioFallback;
  const displayCategories: LegacyCategoryData[] = hasLogData
    ? categories
    : hasAudioFallback
      ? [{ label: "Voice Notes", value: 100, color: "#06b6d4" }]
      : EMPTY_CHART_DATA;
  const displayActivities = hasLogData ? activities : todayAudioActivities;
  const dateForLink = todayDateString;
  const displayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl mb-8 animate-fade-in-up-1">
      <div className="px-6 py-5 border-b border-slate-800/50 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Today&apos;s Overview</h2>
          <p className="text-sm text-slate-400 mt-1">{displayDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 tracking-wide">
            Today
          </span>
          <Link
            href={`/logs?date=${dateForLink}&from=dashboard`}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/70 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:bg-slate-700/80 transition-colors"
          >
            View All Logs
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
      </div>

      {audioStats && (
        <div className="px-6 py-3 border-b border-slate-800/40 bg-slate-950/30">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-cyan-300">
              Voice notes today: {audioStats.todayCount}
            </span>
            <span className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-indigo-300">
              Audio time today: {formatDurationLabel(audioStats.todayDurationSeconds)}
            </span>
            <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
              Transcripts ready: {audioStats.transcriptsCount}/{audioStats.totalCount}
            </span>
          </div>
        </div>
      )}

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-5">Time Distribution</p>
          <LegacyDonutChart
            data={displayCategories}
            getCategoryHref={hasLogData ? (label) => `/logs?category=${encodeURIComponent(label.toLowerCase())}&from=dashboard` : undefined}
          />
        </div>

        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-5">Today&apos;s Activities</p>
          {hasData ? (
            <ActivityList
              activities={displayActivities}
              getActivityHref={(activity) =>
                hasLogData
                  ? `/logs?date=${dateForLink}&highlight=${encodeURIComponent(activity.title)}&category=${encodeURIComponent(
                    activity.category.toLowerCase(),
                  )}&from=dashboard`
                  : "/dashboard#audio-metadata-section"
              }
            />
          ) : (
            <p className="text-sm text-slate-500 py-6 text-center">No activities logged for today.</p>
          )}
        </div>
      </div>
    </div>
  );
}
