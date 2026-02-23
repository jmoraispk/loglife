"use client";

import DonutChart, { CategoryData } from "./DonutChart";
import ActivityList, { Activity } from "./ActivityList";

const MOCK_CATEGORIES: CategoryData[] = [
  { label: "Work", value: 50, color: "#3b82f6" },
  { label: "Health", value: 30, color: "#10b981" },
  { label: "Relationships", value: 20, color: "#f59e0b" },
];

const MOCK_ACTIVITIES: Activity[] = [
  { id: "1", title: "Morning workout", category: "Health", time: "7:00 AM", icon: "🏋️" },
  { id: "2", title: "Team standup", category: "Work", time: "9:30 AM", icon: "💼" },
  { id: "3", title: "Deep work session", category: "Work", time: "10:00 AM", icon: "💻" },
  { id: "4", title: "Lunch with family", category: "Relationships", time: "1:00 PM", icon: "👨‍👩‍👧" },
  { id: "5", title: "Project review", category: "Work", time: "3:00 PM", icon: "📊" },
  { id: "6", title: "Evening run", category: "Health", time: "6:30 PM", icon: "🏃" },
];

export default function TodayOverview() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl mb-8 animate-fade-in-up-1">
      {/* Card header */}
      <div className="px-6 py-5 border-b border-slate-800/50 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Today&apos;s Overview</h2>
          <p className="text-sm text-slate-400 mt-1">{today}</p>
        </div>
        <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 tracking-wide">
          Today
        </span>
      </div>

      {/* Card body */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: Donut chart */}
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-5">Time Distribution</p>
          <DonutChart data={MOCK_CATEGORIES} />
        </div>

        {/* Right: Activity list */}
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-5">Today&apos;s Activities</p>
          <ActivityList activities={MOCK_ACTIVITIES} />
        </div>
      </div>
    </div>
  );
}
