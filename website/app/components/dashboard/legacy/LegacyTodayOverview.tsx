"use client";

import Link from "next/link";
import ActivityList, { Activity } from "../ActivityList";
import LegacyDonutChart, { LegacyCategoryData } from "./LegacyDonutChart";
import { getTodayOverviewFromLogs } from "@/data/test-logs-derived";

const FALLBACK_CATEGORIES: LegacyCategoryData[] = [
  { label: "Work", value: 50, color: "#3b82f6" },
  { label: "Health", value: 30, color: "#10b981" },
  { label: "Relationships", value: 20, color: "#f59e0b" },
];

const FALLBACK_ACTIVITIES: Activity[] = [
  { id: "1", title: "Morning workout", category: "Health", time: "7:00 AM", icon: "🏋️" },
  { id: "2", title: "Team standup", category: "Work", time: "9:30 AM", icon: "💼" },
  { id: "3", title: "Deep work session", category: "Work", time: "10:00 AM", icon: "💻" },
  { id: "4", title: "Lunch with family", category: "Relationships", time: "1:00 PM", icon: "👨‍👩‍👧" },
  { id: "5", title: "Project review", category: "Work", time: "3:00 PM", icon: "📊" },
  { id: "6", title: "Evening run", category: "Health", time: "6:30 PM", icon: "🏃" },
];

export default function LegacyTodayOverview() {
  const { categories, activities, selectedDate } = getTodayOverviewFromLogs();
  const useFallback = categories.length === 0 && activities.length === 0;
  const displayCategories: LegacyCategoryData[] = useFallback ? FALLBACK_CATEGORIES : categories;
  const displayActivities = useFallback ? FALLBACK_ACTIVITIES : activities;
  const dateForLink = useFallback ? new Date().toISOString().slice(0, 10) : selectedDate;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl mb-8 animate-fade-in-up-1">
      <div className="px-6 py-5 border-b border-slate-800/50 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Today&apos;s Overview</h2>
          <p className="text-sm text-slate-400 mt-1">{today}</p>
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

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-5">Time Distribution</p>
          <LegacyDonutChart
            data={displayCategories}
            getCategoryHref={(label) => `/logs?category=${encodeURIComponent(label.toLowerCase())}&from=dashboard`}
          />
        </div>

        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-5">Today&apos;s Activities</p>
          <ActivityList
            activities={displayActivities}
            getActivityHref={(activity) =>
              `/logs?date=${dateForLink}&highlight=${encodeURIComponent(activity.title)}&category=${encodeURIComponent(
                activity.category.toLowerCase(),
              )}&from=dashboard`
            }
          />
        </div>
      </div>
    </div>
  );
}
