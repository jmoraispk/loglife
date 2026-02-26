"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ClassificationPanel from "./ClassificationPanel";
import LogsControlBar from "./LogsControlBar";
import LogsList from "./LogsList";
import {
  type DailyDateOption,
  type LogEntry,
  type LogsView,
  type RecentCountOption,
  LOGS_PAGE_SIZE,
  MOCK_LOGS,
} from "./mockData";

// Load test logs from website/data (same shape as LogEntry with optional date/timestamp)
import testLogsData from "@/data/test-logs.json";

const ALL_LOGS: LogEntry[] = Array.isArray(testLogsData)
  ? (testLogsData as LogEntry[])
  : MOCK_LOGS;

function formatCategoryLabel(value: string) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function formatDateLabel(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function LogsListSection({
  filteredLogs,
  highlightedText,
}: {
  filteredLogs: LogEntry[];
  highlightedText: string | null;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / LOGS_PAGE_SIZE));
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const visibleLogs = useMemo(
    () =>
      filteredLogs.slice(
        (pageSafe - 1) * LOGS_PAGE_SIZE,
        pageSafe * LOGS_PAGE_SIZE
      ),
    [filteredLogs, pageSafe]
  );
  return (
    <LogsList
      logs={visibleLogs}
      highlightedLogText={highlightedText}
      totalCount={filteredLogs.length}
      currentPage={pageSafe}
      totalPages={totalPages}
      onPageChange={setPage}
    />
  );
}

export default function LogsPage() {
  const searchParams = useSearchParams();
  const [view, setView] = useState<LogsView>("recent");
  const [selectedRecentCount, setSelectedRecentCount] = useState<RecentCountOption>(50);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const source = searchParams.get("from");
  const urlDate = searchParams.get("date");
  const selectedCategory = searchParams.get("category");
  const highlightedText = searchParams.get("highlight");

  const dailyDateOptions = useMemo((): DailyDateOption[] => {
    const dates = new Set<string>();
    for (const log of ALL_LOGS) {
      const d = log.date ?? (log.timestamp ? log.timestamp.slice(0, 10) : "");
      if (d) dates.add(d);
    }
    return Array.from(dates)
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 60)
      .map((value) => ({ value, label: formatDateLabel(value) }));
  }, []);

  const effectiveFromUrl =
    Boolean(urlDate && dailyDateOptions.some((o) => o.value === urlDate));
  const effectiveView = effectiveFromUrl ? "daily" : view;
  const effectiveSelectedDate = effectiveFromUrl
    ? (urlDate as string)
    : (selectedDate ||
        (view === "daily" ? dailyDateOptions[0]?.value ?? "" : ""));

  const filteredLogs = useMemo(() => {
    let list = ALL_LOGS;

    if (selectedCategory) {
      const cat = formatCategoryLabel(selectedCategory);
      list = list.filter((log) => log.categories.includes(cat as LogEntry["categories"][number]));
    }

    if (effectiveView === "daily") {
      list = list.filter((log) => {
        const d = log.date ?? (log.timestamp ? log.timestamp.slice(0, 10) : "");
        return d === effectiveSelectedDate;
      });
      list = [...list].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    } else {
      list = [...list].sort((a, b) => {
        const ta = a.timestamp ?? a.date ?? a.time ?? "";
        const tb = b.timestamp ?? b.date ?? b.time ?? "";
        return tb.localeCompare(ta);
      });
      list = list.slice(0, selectedRecentCount);
    }

    return list;
  }, [effectiveView, effectiveSelectedDate, selectedRecentCount, selectedCategory]);

  const filterKey = `${effectiveView}-${effectiveSelectedDate}-${selectedRecentCount}-${selectedCategory ?? ""}`;

  const contextBannerText = useMemo(() => {
    if (effectiveSelectedDate && effectiveView === "daily") {
      return `Showing logs for: ${formatDateLabel(effectiveSelectedDate)}`;
    }
    if (selectedCategory) {
      return `Filtered by: ${formatCategoryLabel(selectedCategory)}`;
    }
    return null;
  }, [effectiveSelectedDate, effectiveView, selectedCategory]);

  return (
    <main className="min-h-screen pt-20 pb-12 px-4 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
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
          view={effectiveView}
          dailyDateOptions={dailyDateOptions}
          selectedDate={effectiveSelectedDate}
          selectedRecentCount={selectedRecentCount}
          onViewChange={setView}
          onDateChange={setSelectedDate}
          onRecentCountChange={setSelectedRecentCount}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/45 border border-slate-800/50 rounded-2xl p-4 sm:p-5">
            <ClassificationPanel />
          </div>
          <div className="bg-slate-900/45 border border-slate-800/50 rounded-2xl p-4 sm:p-5">
            <LogsListSection
              key={filterKey}
              filteredLogs={filteredLogs}
              highlightedText={highlightedText}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
