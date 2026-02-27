export type GoalCategory = "Work" | "Health" | "Relationships";

export type GoalContribution = "major" | "minor" | "note";

export interface GoalTimeSeriesPoint {
  date: string; // ISO date (yyyy-mm-dd)
  value: number; // 0-100 progress percent
}

export interface GoalMilestone {
  id: string;
  date: string; // ISO date (yyyy-mm-dd)
  title: string;
  isUpcoming: boolean;
}

export interface GoalContributionEvent {
  id: string;
  date: string; // ISO date (yyyy-mm-dd)
  text: string;
  contribution: GoalContribution;
}

export interface Goal {
  id: string;
  name: string;
  description: string;
  category: GoalCategory;
  tags: string[];
  startDate: string;
  targetDate: string;
  progressPercent: number;
  streak: number;
  why: string;
  timeSeries: GoalTimeSeriesPoint[];
  milestones: GoalMilestone[];
  events: GoalContributionEvent[];
}

export const GOALS: Goal[] = [
  {
    id: "g1",
    name: "Go to gym",
    description: "Build strength and consistency",
    category: "Health",
    tags: ["gym", "strength"],
    startDate: "2026-01-02",
    targetDate: "2026-06-01",
    progressPercent: 42,
    streak: 5,
    why: "Stay healthy and build discipline",
    timeSeries: [
      { date: "2026-01-01", value: 10 },
      { date: "2026-01-15", value: 22 },
      { date: "2026-02-01", value: 30 },
      { date: "2026-02-20", value: 50 },
    ],
    milestones: [
      { id: "g1-m1", date: "2026-02-10", title: "10 sessions", isUpcoming: false },
      { id: "g1-m2", date: "2026-03-01", title: "20 sessions", isUpcoming: true },
      { id: "g1-m3", date: "2026-04-01", title: "30 sessions", isUpcoming: true },
    ],
    events: [
      {
        id: "g1-e1",
        date: "2026-02-23",
        text: "Morning workout",
        contribution: "major",
      },
      {
        id: "g1-e2",
        date: "2026-02-22",
        text: "Short run",
        contribution: "minor",
      },
      {
        id: "g1-e3",
        date: "2026-02-18",
        text: "Mobility and recovery notes",
        contribution: "note",
      },
    ],
  },
  {
    id: "g2",
    name: "Deep work habit",
    description: "4 focused hours/day on core project",
    category: "Work",
    tags: ["deep-work", "focus"],
    startDate: "2026-01-10",
    targetDate: "2026-12-31",
    progressPercent: 63,
    streak: 12,
    why: "Protect deep focus time to ship meaningful work",
    timeSeries: [
      { date: "2026-01-10", value: 12 },
      { date: "2026-01-25", value: 28 },
      { date: "2026-02-10", value: 46 },
      { date: "2026-02-25", value: 63 },
    ],
    milestones: [
      { id: "g2-m1", date: "2026-02-01", title: "10 deep-work blocks", isUpcoming: false },
      { id: "g2-m2", date: "2026-03-05", title: "50 focused hours", isUpcoming: true },
    ],
    events: [
      {
        id: "g2-e1",
        date: "2026-02-23",
        text: "Project proposal deep work",
        contribution: "major",
      },
      {
        id: "g2-e2",
        date: "2026-02-20",
        text: "Refined acceptance criteria",
        contribution: "minor",
      },
      {
        id: "g2-e3",
        date: "2026-02-19",
        text: "Late start noted in review",
        contribution: "note",
      },
    ],
  },
  {
    id: "g3",
    name: "Call family weekly",
    description: "Build stronger relationships through consistency",
    category: "Relationships",
    tags: ["family", "relationships"],
    startDate: "2026-01-05",
    targetDate: "2026-12-31",
    progressPercent: 54,
    streak: 4,
    why: "Stay connected with people who matter most",
    timeSeries: [
      { date: "2026-01-05", value: 8 },
      { date: "2026-01-20", value: 22 },
      { date: "2026-02-10", value: 38 },
      { date: "2026-02-25", value: 54 },
    ],
    milestones: [
      { id: "g3-m1", date: "2026-02-15", title: "6 meaningful calls", isUpcoming: false },
      { id: "g3-m2", date: "2026-03-10", title: "10 meaningful calls", isUpcoming: true },
    ],
    events: [
      {
        id: "g3-e1",
        date: "2026-02-24",
        text: "Called parents after work",
        contribution: "major",
      },
      {
        id: "g3-e2",
        date: "2026-02-21",
        text: "Quick check-in with sibling",
        contribution: "minor",
      },
      {
        id: "g3-e3",
        date: "2026-02-17",
        text: "Wrote birthday reminder note",
        contribution: "note",
      },
    ],
  },
];

export function getGoalById(id: string): Goal | undefined {
  return GOALS.find((goal) => goal.id === id);
}

