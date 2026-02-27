export type GoalCategory = "Work" | "Health" | "Relationships";

export type GoalEventType = "session" | "milestone" | "note";

export type GoalEventValue =
  | { km: number }
  | { hours: number }
  | null;

export interface GoalEvent {
  date: string; // ISO date (yyyy-mm-dd)
  time: string; // 24h time (HH:MM)
  type: GoalEventType;
  text: string;
  value: GoalEventValue;
  tags: string[];
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
  events: GoalEvent[];
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
    events: [
      {
        date: "2026-02-23",
        time: "07:00",
        type: "session",
        text: "Morning workout — legs",
        value: null,
        tags: ["gym", "health"],
      },
      {
        date: "2026-02-21",
        time: "07:00",
        type: "session",
        text: "Cardio run 5km",
        value: { km: 5 },
        tags: ["running", "health"],
      },
      {
        date: "2026-02-18",
        time: "18:00",
        type: "milestone",
        text: "First month completed",
        value: null,
        tags: ["milestone"],
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
    events: [
      {
        date: "2026-02-23",
        time: "09:30",
        type: "session",
        text: "Project proposal deep work",
        value: { hours: 3 },
        tags: ["work", "deep-work"],
      },
      {
        date: "2026-02-20",
        time: "10:00",
        type: "note",
        text: "Refined acceptance criteria",
        value: null,
        tags: ["work"],
      },
    ],
  },
];

export function getGoalById(id: string): Goal | undefined {
  return GOALS.find((goal) => goal.id === id);
}

