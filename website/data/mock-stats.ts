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

const DAY_COUNT = 180;
const START_DATE = new Date("2025-09-01T00:00:00Z");

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function pseudoNoise(index: number, seed: number): number {
  return Math.sin(index * 0.37 + seed) * 0.5 + Math.cos(index * 0.17 + seed * 2.1) * 0.5;
}

export const mockDailyStats: StatsPoint[] = Array.from({ length: DAY_COUNT }, (_, i) => {
  const date = new Date(START_DATE);
  date.setUTCDate(START_DATE.getUTCDate() + i);

  const weeklyWave = Math.sin((2 * Math.PI * i) / 7) * 14;
  const monthlyWave = Math.sin((2 * Math.PI * i) / 30) * 26;
  const trend = i * 0.42;
  const baseline = 210 + trend + weeklyWave + monthlyWave;
  const total = Math.round(clamp(baseline + pseudoNoise(i, 3.4) * 18, 120, 420));

  const workRatio = clamp(0.47 + Math.sin(i / 13) * 0.07 + pseudoNoise(i, 1.2) * 0.03, 0.32, 0.62);
  const healthRatio = clamp(0.24 + Math.cos(i / 11) * 0.05 + pseudoNoise(i, 2.1) * 0.02, 0.16, 0.38);
  const relationshipsRatio = clamp(1 - workRatio - healthRatio, 0.12, 0.36);

  let work = Math.round(total * workRatio);
  let health = Math.round(total * healthRatio);
  let relationships = Math.round(total * relationshipsRatio);

  const diff = total - (work + health + relationships);
  work += diff;

  return {
    date: formatDate(date),
    total,
    work,
    health,
    relationships,
  };
});

export const mockSessionLengths: number[] = Array.from({ length: 1200 }, (_, i) => {
  const base = 18 + (i % 7) * 2 + pseudoNoise(i, 5.7) * 11;
  const occasionalLongSession = i % 37 === 0 ? 20 + (i % 50) : 0;
  return Math.round(clamp(base + occasionalLongSession, 5, 95));
});

const EVENT_TEXT: Record<TopEvent["category"], string[]> = {
  Work: [
    "High-focus writing sprint completed",
    "Strategy planning block exceeded target",
    "Context switching spike detected",
    "Late-night review session impacted recovery",
  ],
  Health: [
    "Workout streak milestone reached",
    "Sleep quality dip after travel day",
    "Hydration target exceeded for 5 days",
    "Morning run consistency improved",
  ],
  Relationships: [
    "Quality time trend increased this week",
    "Long call with family boosted mood score",
    "Skipped social check-ins on busy days",
    "Weekend gathering generated positive momentum",
  ],
};

const CATEGORIES: TopEvent["category"][] = ["Work", "Health", "Relationships"];
const IMPORTANCE: TopEvent["importance"][] = ["Low", "Medium", "High", "Critical"];

export const mockTopEvents: TopEvent[] = Array.from({ length: 14 }, (_, i) => {
  const dayOffset = DAY_COUNT - 3 - i * 5;
  const date = new Date(START_DATE);
  date.setUTCDate(START_DATE.getUTCDate() + dayOffset);
  const category = CATEGORIES[i % CATEGORIES.length];
  const textOptions = EVENT_TEXT[category];

  return {
    id: `evt-${1000 + i}`,
    date: formatDate(date),
    time: `${String((8 + (i * 3) % 12)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
    text: textOptions[i % textOptions.length],
    category,
    importance: IMPORTANCE[(i + (category === "Work" ? 1 : 0)) % IMPORTANCE.length],
  };
});

export const RANGE_OPTIONS = [7, 30, 90, 180] as const;
export type DateRange = (typeof RANGE_OPTIONS)[number];
