"use client";

import { useMemo, useState } from "react";
import KPICard from "@/components/stats/KPICard";
import TimeSeriesChart, { type SeriesConfig, type SeriesKey } from "@/components/stats/TimeSeriesChart";
import AreaChart from "@/components/stats/AreaChart";
import DistributionChart, { type HistogramBucket } from "@/components/stats/DistributionChart";
import ChartControls from "@/components/stats/ChartControls";
import {
  mockDailyStats,
  mockSessionLengths,
  mockTopEvents,
  RANGE_OPTIONS,
  type DateRange,
  type TopEvent,
} from "@/data/mock-stats";

const SERIES_CONFIG: SeriesConfig[] = [
  { key: "total", label: "Total", color: "#22d3ee" },
  { key: "work", label: "Work", color: "#60a5fa" },
  { key: "health", label: "Health", color: "#34d399" },
  { key: "relationships", label: "Relationships", color: "#f59e0b" },
];

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function changePercent(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

function buildHistogram(values: number[]): HistogramBucket[] {
  const step = 10;
  const max = 100;
  const buckets: HistogramBucket[] = [];

  for (let start = 0; start < max; start += step) {
    const end = start + step;
    const count = values.filter((value) => value >= start && value < end).length;
    buckets.push({ range: `${start}-${end}`, count });
  }

  return buckets;
}

function formatImportanceColor(importance: TopEvent["importance"]): string {
  if (importance === "Critical") return "bg-rose-500/15 text-rose-300";
  if (importance === "High") return "bg-orange-500/15 text-orange-300";
  if (importance === "Medium") return "bg-amber-500/15 text-amber-300";
  return "bg-slate-700/70 text-slate-300";
}

export default function StatsPage() {
  const [range, setRange] = useState<DateRange>(30);
  const [smoothing, setSmoothing] = useState(true);
  const [hiddenSeries, setHiddenSeries] = useState<Partial<Record<SeriesKey, boolean>>>({});
  const [selectedEvent, setSelectedEvent] = useState<TopEvent | null>(null);

  const filteredData = useMemo(() => mockDailyStats.slice(-range), [range]);
  const previousPeriodData = useMemo(() => mockDailyStats.slice(-range * 2, -range), [range]);

  const visibleSessionLengths = useMemo(() => {
    const approximateSamplesPerDay = 6;
    return mockSessionLengths.slice(-range * approximateSamplesPerDay);
  }, [range]);

  const previousSessionLengths = useMemo(() => {
    const approximateSamplesPerDay = 6;
    return mockSessionLengths.slice(-range * approximateSamplesPerDay * 2, -range * approximateSamplesPerDay);
  }, [range]);

  const histogramData = useMemo(() => buildHistogram(visibleSessionLengths), [visibleSessionLengths]);

  const kpis = useMemo(() => {
    const currentTotals = filteredData.map((d) => d.total);
    const previousTotals = previousPeriodData.map((d) => d.total);

    const avgDaily = average(currentTotals);
    const previousAvgDaily = average(previousTotals);

    const totalActivities = currentTotals.reduce((sum, value) => sum + value, 0);
    const previousTotalActivities = previousTotals.reduce((sum, value) => sum + value, 0);

    const activeDays = filteredData.filter((d) => d.total > 0).length;
    const previousActiveDays = previousPeriodData.filter((d) => d.total > 0).length;

    const medianSession = median(visibleSessionLengths);
    const previousMedianSession = median(previousSessionLengths);

    return {
      avgDaily,
      avgDailyChange: changePercent(avgDaily, previousAvgDaily),
      totalActivities,
      totalActivitiesChange: changePercent(totalActivities, previousTotalActivities),
      activeDays,
      activeDaysChange: changePercent(activeDays, previousActiveDays),
      medianSession,
      medianSessionChange: changePercent(medianSession, previousMedianSession),
    };
  }, [filteredData, previousPeriodData, previousSessionLengths, visibleSessionLengths]);

  const sparklineTotals = useMemo(() => filteredData.slice(-24).map((d) => d.total), [filteredData]);

  const events = useMemo(() => mockTopEvents.filter((event) => event.date >= filteredData[0]?.date), [filteredData]);

  const toggleSeries = (key: SeriesKey) => {
    setHiddenSeries((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const handleExportCsv = () => {
    const visibleSeries = SERIES_CONFIG.filter((series) => !hiddenSeries[series.key]);
    const header = ["date", ...visibleSeries.map((s) => s.key)].join(",");
    const lines = filteredData.map((row) => {
      const values = visibleSeries.map((s) => row[s.key]);
      return [row.date, ...values].join(",");
    });
    const csvContent = [header, ...lines].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `loglife-stats-last-${range}-days.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen px-4 pb-12 pt-20 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Detailed Statistics</h1>
          <p className="mt-1 text-sm text-slate-400">
            In-depth time-series analytics for activity trends, category mix, and standout events.
          </p>
        </header>

        <div className="mb-5">
          <ChartControls
            range={range}
            ranges={RANGE_OPTIONS}
            smoothing={smoothing}
            onRangeChange={setRange}
            onSmoothingChange={setSmoothing}
            onExportCsv={handleExportCsv}
          />
        </div>

        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KPICard
            label="Avg Daily Activity"
            value={kpis.avgDaily.toFixed(1)}
            changePct={kpis.avgDailyChange}
            helperText="Mean total across selected range"
            sparklineValues={sparklineTotals}
          />
          <KPICard
            label="Median Session Length"
            value={`${kpis.medianSession.toFixed(0)} min`}
            changePct={kpis.medianSessionChange}
            helperText="Middle session duration percentile"
            sparklineValues={visibleSessionLengths.slice(-24)}
          />
          <KPICard
            label="Total Activities"
            value={kpis.totalActivities.toLocaleString()}
            changePct={kpis.totalActivitiesChange}
            helperText="Cumulative total for range"
            sparklineValues={filteredData.slice(-24).map((d) => d.work + d.health + d.relationships)}
          />
          <KPICard
            label="Active Days"
            value={`${kpis.activeDays}/${range}`}
            changePct={kpis.activeDaysChange}
            helperText="Days with non-zero tracked totals"
            sparklineValues={filteredData.slice(-24).map((d) => (d.total > 0 ? 1 : 0))}
          />
        </section>

        <section className="mb-6">
          <TimeSeriesChart
            data={filteredData}
            series={SERIES_CONFIG}
            hiddenSeries={hiddenSeries}
            smoothing={smoothing}
            onToggleSeries={toggleSeries}
          />
        </section>

        <section className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <AreaChart data={filteredData} smoothing={smoothing} />
          </div>
          <DistributionChart data={histogramData} />
        </section>

        <section className="animate-fade-in-up rounded-2xl border border-slate-800/70 bg-slate-900/70">
          <div className="flex items-center justify-between border-b border-slate-800/70 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Top Events & Anomalies</h2>
              <p className="mt-0.5 text-xs text-slate-500">Click inspect to open the raw event payload</p>
            </div>
            <span className="text-xs text-slate-500">{events.length} rows</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-950/50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Time</th>
                  <th className="px-4 py-2.5 font-medium">Event</th>
                  <th className="px-4 py-2.5 font-medium">Category</th>
                  <th className="px-4 py-2.5 font-medium">Importance</th>
                  <th className="px-4 py-2.5 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-t border-slate-800/60 text-slate-300">
                    <td className="px-4 py-2.5">{event.date}</td>
                    <td className="px-4 py-2.5">{event.time}</td>
                    <td className="max-w-md truncate px-4 py-2.5 text-slate-100">{event.text}</td>
                    <td className="px-4 py-2.5">{event.category}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-md px-2 py-1 text-xs font-medium ${formatImportanceColor(event.importance)}`}>
                        {event.importance}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="cursor-pointer rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 transition-colors hover:bg-slate-800/70"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {selectedEvent ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-100">Event JSON</h3>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="cursor-pointer rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                >
                  Close
                </button>
              </div>
              <div className="p-4">
                <pre className="max-h-[55vh] overflow-auto rounded-lg bg-slate-950/80 p-4 text-xs leading-5 text-emerald-200">
                  {JSON.stringify(selectedEvent, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
