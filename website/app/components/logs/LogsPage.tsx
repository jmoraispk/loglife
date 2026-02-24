"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ClassificationPanel from "./ClassificationPanel";
import LogsControlBar from "./LogsControlBar";
import LogsList from "./LogsList";
import { DailyOption, LogsView, MOCK_LOGS, RecentCountOption } from "./mockData";

function formatCategoryLabel(value: string) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export default function LogsPage() {
  const searchParams = useSearchParams();
  const [view, setView] = useState<LogsView>("daily");
  const [selectedDay, setSelectedDay] = useState<DailyOption>("Feb 23");
  const [selectedRecentCount, setSelectedRecentCount] = useState<RecentCountOption>(10);
  const source = searchParams.get("from");
  const selectedDate = searchParams.get("date");
  const selectedCategory = searchParams.get("category");
  const highlightedText = searchParams.get("highlight");

  const visibleLogs = useMemo(() => {
    if (view === "recent") {
      return MOCK_LOGS.slice(0, selectedRecentCount);
    }
    return MOCK_LOGS;
  }, [view, selectedRecentCount]);

  const contextBannerText = useMemo(() => {
    if (selectedDate) {
      return `Showing logs for: ${selectedDate}`;
    }
    if (selectedCategory) {
      return `Filtered by: ${formatCategoryLabel(selectedCategory)}`;
    }
    return null;
  }, [selectedDate, selectedCategory]);

  return (
    <main className="min-h-screen pt-20 pb-12 px-4 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <section>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Link href="/dashboard" className="hover:text-slate-200 transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-slate-200">Logs</span>
          </div>
        </section>

        <section className="space-y-2">
          <h1 className="text-2xl font-semibold text-white">Activity Logs</h1>
          <p className="text-sm text-slate-400">Explore how messages are classified into insights</p>
        </section>

        {contextBannerText && (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-200">
            {contextBannerText}
            {source === "dashboard" ? " (from Dashboard)" : ""}
          </div>
        )}

        <LogsControlBar
          view={view}
          selectedDay={selectedDay}
          selectedRecentCount={selectedRecentCount}
          onViewChange={setView}
          onDayChange={setSelectedDay}
          onRecentCountChange={setSelectedRecentCount}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/45 border border-slate-800/50 rounded-2xl p-4 sm:p-5">
            <ClassificationPanel />
          </div>
          <div className="bg-slate-900/45 border border-slate-800/50 rounded-2xl p-4 sm:p-5">
            <LogsList logs={visibleLogs} highlightedLogText={highlightedText} />
          </div>
        </div>
      </div>
    </main>
  );
}
