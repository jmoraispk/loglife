/**
 * Derives dashboard and stats data from test-logs.json.
 * Used by: Dashboard (TodayOverview, HabitHeatmap, GoalsSection, ActivityLogList), Stats page.
 */

import testLogsData from "./test-logs.json";

// ─── Log entry shape (matches app/components/logs/mockData.ts LogEntry) ─────
type LogCategory = "Work" | "Health" | "Relationships" | "Other";
interface LogEntryLike {
  id: string;
  time: string;
  text: string;
  categories: LogCategory[];
  type: string;
  date?: string;
  timestamp?: string;
  importance?: string;
}

const RAW_LOGS: LogEntryLike[] = Array.isArray(testLogsData) ? (testLogsData as LogEntryLike[]) : [];

const CATEGORY_COLORS: Record<string, string> = {
  Work: "#3b82f6",
  Health: "#10b981",
  Relationships: "#f59e0b",
  Other: "#64748b",
};

const CATEGORY_ICONS: Record<string, string> = {
  Work: "💼",
  Health: "🏃",
  Relationships: "👨‍👩‍👧",
  Other: "📌",
};

function getPrimaryCategory(categories: string[]): "Work" | "Health" | "Relationships" {
  const main = categories.find((c) => c !== "Other") ?? categories[0];
  return main === "Work" || main === "Health" || main === "Relationships" ? main : "Work";
}

function formatTimeForDisplay(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (h === 0) return `12:${String(m).padStart(2, "0")} AM`;
  if (h === 12) return `12:${String(m).padStart(2, "0")} PM`;
  return `${h > 12 ? h - 12 : h}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

// ─── Stats types (match @/data/mock-stats) ─────────────────────────────────
export type StatsPoint = {
  date: string;
  total: number;
  work: number;
  health: number;
  relationships: number;
};

export type TopEvent = {
  id: string;
  date: string;
  time: string;
  text: string;
  category: "Work" | "Health" | "Relationships";
  importance: "Low" | "Medium" | "High" | "Critical";
};

export const RANGE_OPTIONS = [7, 30, 90, 180] as const;
export type DateRange = (typeof RANGE_OPTIONS)[number];

// ─── Daily stats: group by date, count by category ─────────────────────────
export function getDailyStatsFromLogs(): StatsPoint[] {
  const byDate = new Map<
    string,
  { total: number; work: number; health: number; relationships: number }
  >();

  for (const log of RAW_LOGS) {
    const date = log.date ?? (log.timestamp ? log.timestamp.slice(0, 10) : "");
    if (!date) continue;

    let row = byDate.get(date);
    if (!row) {
      row = { total: 0, work: 0, health: 0, relationships: 0 };
      byDate.set(date, row);
    }
    row.total += 1;
    for (const c of log.categories) {
      if (c === "Work") row.work += 1;
      else if (c === "Health") row.health += 1;
      else if (c === "Relationships") row.relationships += 1;
    }
  }

  const entries = Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return [];

  const minDate = entries[0][0];
  const maxDate = entries[entries.length - 1][0];
  const map = new Map(entries);
  const result: StatsPoint[] = [];
  const curr = new Date(minDate + "T12:00:00");
  const end = new Date(maxDate + "T12:00:00");
  while (curr <= end) {
    const d = curr.toISOString().slice(0, 10);
    const row = map.get(d) ?? { total: 0, work: 0, health: 0, relationships: 0 };
    result.push({ date: d, ...row });
    curr.setUTCDate(curr.getUTCDate() + 1);
  }
  return result;
}

// ─── Top events: logs with importance, or last N with default importance ────
export function getTopEventsFromLogs(limit = 20): TopEvent[] {
  const withImportance = RAW_LOGS.filter((l) => l.importance != null) as (LogEntryLike & { importance: string })[];
  const importanceMap = (s: string): TopEvent["importance"] =>
    s === "Low" || s === "Medium" || s === "High" || s === "Critical" ? s : "Medium";

  if (withImportance.length >= limit) {
    return withImportance
      .sort((a, b) => (b.timestamp ?? b.date ?? "").localeCompare(a.timestamp ?? a.date ?? ""))
      .slice(0, limit)
      .map((l) => ({
        id: l.id,
        date: l.date ?? (l.timestamp ? l.timestamp.slice(0, 10) : ""),
        time: l.time,
        text: l.text,
        category: getPrimaryCategory(l.categories) as TopEvent["category"],
        importance: importanceMap(l.importance),
      }));
  }

  const sorted = [...RAW_LOGS].sort((a, b) =>
    (b.timestamp ?? b.date ?? "").localeCompare(a.timestamp ?? a.date ?? "")
  );
  return sorted.slice(0, limit).map((l) => ({
    id: l.id,
    date: l.date ?? (l.timestamp ? l.timestamp.slice(0, 10) : ""),
    time: l.time,
    text: l.text,
    category: getPrimaryCategory(l.categories) as TopEvent["category"],
    importance: importanceMap(l.importance ?? "Medium"),
  }));
}

// ─── Session lengths: derive from daily counts (fake minutes per "session") ──
export function getSessionLengthsFromLogs(approxSamplesPerDay = 6): number[] {
  const daily = getDailyStatsFromLogs();
  const out: number[] = [];
  for (const row of daily) {
    for (let i = 0; i < approxSamplesPerDay; i++) {
      const base = 10 + (i % 5) * 3 + (row.total % 7);
      out.push(Math.min(95, Math.max(5, base + (row.total % 10))));
    }
  }
  return out;
}

// ─── Today overview: category distribution + activity list for a date ───────
export type CategoryData = { label: string; value: number; color: string };
export type Activity = {
  id: string;
  title: string;
  category: "Work" | "Health" | "Relationships";
  time: string;
  icon: string;
};

export function getTodayOverviewFromLogs(
  date?: string
): { categories: CategoryData[]; activities: Activity[]; selectedDate: string } {
  const targetDate =
    date ??
    (RAW_LOGS.length > 0
      ? RAW_LOGS.map((l) => l.date ?? (l.timestamp ? l.timestamp.slice(0, 10) : "")).filter(Boolean).sort().reverse()[0]
      : new Date().toISOString().slice(0, 10));

  const dayLogs = RAW_LOGS.filter((l) => (l.date ?? (l.timestamp ? l.timestamp.slice(0, 10) : "")) === targetDate);
  const counts = { Work: 0, Health: 0, Relationships: 0, Other: 0 };
  for (const log of dayLogs) {
    for (const c of log.categories) {
      if (c in counts) (counts as Record<string, number>)[c]++;
    }
  }
  const total = counts.Work + counts.Health + counts.Relationships + counts.Other || 1;
  const categories: CategoryData[] = [
    { label: "Work", value: Math.round((counts.Work / total) * 100), color: CATEGORY_COLORS.Work },
    { label: "Health", value: Math.round((counts.Health / total) * 100), color: CATEGORY_COLORS.Health },
    {
      label: "Relationships",
      value: Math.round((counts.Relationships / total) * 100),
      color: CATEGORY_COLORS.Relationships,
    },
  ].filter((d) => d.value > 0);
  if (categories.length === 0) {
    categories.push({ label: "Work", value: 34, color: CATEGORY_COLORS.Work });
    categories.push({ label: "Health", value: 33, color: CATEGORY_COLORS.Health });
    categories.push({ label: "Relationships", value: 33, color: CATEGORY_COLORS.Relationships });
  }

  const activities: Activity[] = dayLogs
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 15)
    .map((l) => ({
      id: l.id,
      title: l.text,
      category: getPrimaryCategory(l.categories),
      time: formatTimeForDisplay(l.time),
      icon: CATEGORY_ICONS[getPrimaryCategory(l.categories)] ?? "📌",
    }));

  return { categories, activities, selectedDate: targetDate };
}

// ─── Habit heatmap: date -> value (0–100) from log count per day ───────────
export type HabitDay = { date: string; value: number };

export function getHabitHeatmapFromLogs(month?: string): HabitDay[] {
  const byDate = new Map<string, number>();
  for (const log of RAW_LOGS) {
    const d = log.date ?? (log.timestamp ? log.timestamp.slice(0, 10) : "");
    if (d) byDate.set(d, (byDate.get(d) ?? 0) + 1);
  }
  const [year, monthNum] = (month ?? new Date().toISOString().slice(0, 7)).split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const maxCount = Math.max(1, ...byDate.values());
  const out: HabitDay[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const count = byDate.get(dateStr) ?? 0;
    out.push({ date: dateStr, value: Math.min(100, Math.round((count / maxCount) * 100)) });
  }
  return out;
}

// ─── Goals: category-based goals with streak/completion from logs ───────────
export type Goal = {
  id: string;
  name: string;
  category: "Work" | "Health" | "Relationships";
  streak: number;
  completionRate: number;
  frequency: string;
  icon: string;
  recentDays: boolean[];
};

export function getGoalsFromLogs(): Goal[] {
  const dates = new Set<string>();
  const byDateCategory = new Map<string, Set<string>>();
  for (const log of RAW_LOGS) {
    const d = log.date ?? (log.timestamp ? log.timestamp.slice(0, 10) : "");
    if (!d) continue;
    dates.add(d);
    const key = d;
    if (!byDateCategory.has(key)) byDateCategory.set(key, new Set());
    for (const c of log.categories) {
      if (c !== "Other") byDateCategory.get(key)!.add(c);
    }
  }
  const sortedDates = Array.from(dates).sort();

  const categories: Goal["category"][] = ["Work", "Health", "Relationships"];
  const names = { Work: "Log work activities", Health: "Log health & wellness", Relationships: "Log relationships" };
  const icons = { Work: "💼", Health: "🏃", Relationships: "👨‍👩‍👧" };

  const last7Dates = sortedDates.slice(-7);
  return categories.map((cat, i) => {
    const recentDays = last7Dates.map((d) => byDateCategory.get(d)?.has(cat) ?? false);
    const completed = recentDays.filter(Boolean).length;
    let streak = 0;
    for (let j = sortedDates.length - 1; j >= 0; j--) {
      if (byDateCategory.get(sortedDates[j])?.has(cat)) streak++;
      else break;
    }
    return {
      id: `goal-${i + 1}`,
      name: names[cat],
      category: cat,
      streak,
      completionRate: last7Dates.length ? Math.round((completed / last7Dates.length) * 100) : 0,
      frequency: "Daily",
      icon: icons[cat],
      recentDays,
    };
  });
}

// ─── Activity logs for dashboard (timeline): logs for a given date ──────────
export type ActivityLog = { id: string; time: string; text: string; category: "Work" | "Health" | "Relationships" };

export function getActivityLogsForDashboard(date?: string): ActivityLog[] {
  const targetDate =
    date ??
    (RAW_LOGS.length > 0
      ? RAW_LOGS.map((l) => l.date ?? (l.timestamp ? l.timestamp.slice(0, 10) : "")).filter(Boolean).sort().reverse()[0]
      : new Date().toISOString().slice(0, 10));

  return RAW_LOGS.filter((l) => (l.date ?? (l.timestamp ? l.timestamp.slice(0, 10) : "")) === targetDate)
    .sort((a, b) => a.time.localeCompare(b.time))
    .map((l) => ({
      id: l.id,
      time: l.time,
      text: l.text,
      category: getPrimaryCategory(l.categories),
    }));
}
