"use client";

import Link from "next/link";
import DonutChart, { CategoryData } from "./DonutChart";
import ActivityList from "./ActivityList";
import { getTodayOverviewFromLogs } from "@/data/test-logs-derived";

const EMPTY_CHART_DATA: CategoryData[] = [
  { label: "No activities", value: 100, color: "#475569" },
];

export default function TodayOverview() {
  const todayDateString = new Date().toISOString().slice(0, 10);
  const { categories, activities } = getTodayOverviewFromLogs(todayDateString);
  const hasData = activities.length > 0;
  const displayCategories = hasData ? categories : EMPTY_CHART_DATA;
  const displayActivities = hasData ? activities : [];
  const dateForLink = todayDateString;
  const displayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4 animate-fade-in-up-1">
      {/* Card header */}
      <div className="pb-4 border-b border-slate-800/50 flex items-center justify-between gap-3 flex-wrap">
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
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Card body */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Left: Donut chart */}
        <div className="min-w-0 overflow-hidden">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-5">Time Distribution</p>
          <DonutChart
            data={displayCategories}
            size={236}
            legendBelow
            getCategoryHref={hasData ? (label) => `/logs?category=${encodeURIComponent(label.toLowerCase())}&from=dashboard` : undefined}
          />
        </div>

        {/* Right: Activity list */}
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-5">Today&apos;s Activities</p>
          {hasData ? (
            <ActivityList
              activities={displayActivities}
              getActivityHref={(activity) =>
                `/logs?date=${dateForLink}&highlight=${encodeURIComponent(activity.title)}&category=${encodeURIComponent(
                  activity.category.toLowerCase()
                )}&from=dashboard`
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
