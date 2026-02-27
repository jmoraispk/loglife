import { TAGS, type TagNode } from "@/data/mock/tags";

export interface Tag {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
}

export type TimelineItemType = "session" | "milestone" | "note";

export interface TimelineItem {
  id: string;
  date: string;
  time: string;
  type: TimelineItemType;
  text: string;
  tagIds: string[];
  value?: { km?: number; hours?: number };
}

export interface Goal {
  id: string;
  name: string;
  description: string;
  category: "Work" | "Health" | "Relationships";
  tagIds: string[];
  startDate: string;
  targetDate: string;
  progressPercent: number;
  streak: number;
  why: string;
  timeline: TimelineItem[];
}

export interface GoalsWithTagsState {
  taxonomy: TagNode[];
  goals: Goal[];
}

export const GOALS_TAGS_STORAGE_KEY = "loglife.goals-taxonomy.v1";

export const MOCK_GOALS_WITH_TAGS: Goal[] = [
  {
    id: "goal_health_consistency",
    name: "Train 4x per week",
    description: "Build physical consistency with simple weekly targets.",
    category: "Health",
    tagIds: ["health", "gym", "running"],
    startDate: "2026-01-02",
    targetDate: "2026-06-30",
    progressPercent: 48,
    streak: 6,
    why: "Strong body, better energy, and better mood.",
    timeline: [
      {
        id: "thc_1",
        date: "2026-02-26",
        time: "07:15",
        type: "session",
        text: "Push workout + short cooldown run",
        tagIds: ["gym", "running"],
        value: { hours: 1.2 },
      },
      {
        id: "thc_2",
        date: "2026-02-24",
        time: "06:50",
        type: "session",
        text: "Easy 5km run before work",
        tagIds: ["running"],
        value: { km: 5 },
      },
      {
        id: "thc_3",
        date: "2026-02-21",
        time: "18:10",
        type: "milestone",
        text: "Completed 20th gym session",
        tagIds: ["gym", "health"],
      },
      {
        id: "thc_4",
        date: "2026-02-20",
        time: "20:30",
        type: "note",
        text: "Sleep quality better after evening mobility",
        tagIds: ["health"],
      },
    ],
  },
  {
    id: "goal_deep_work",
    name: "Protect deep-work blocks",
    description: "Create uninterrupted blocks for high-leverage tasks.",
    category: "Work",
    tagIds: ["work", "deep_work", "meetings"],
    startDate: "2026-01-10",
    targetDate: "2026-12-31",
    progressPercent: 63,
    streak: 11,
    why: "Make meaningful progress every week.",
    timeline: [
      {
        id: "gdw_1",
        date: "2026-02-26",
        time: "09:00",
        type: "session",
        text: "2.5h focused architecture draft",
        tagIds: ["deep_work", "work"],
        value: { hours: 2.5 },
      },
      {
        id: "gdw_2",
        date: "2026-02-25",
        time: "14:00",
        type: "note",
        text: "Meetings compressed to protect afternoon focus",
        tagIds: ["meetings", "work"],
      },
      {
        id: "gdw_3",
        date: "2026-02-23",
        time: "17:20",
        type: "milestone",
        text: "50 deep-work hours reached this month",
        tagIds: ["deep_work"],
      },
      {
        id: "gdw_4",
        date: "2026-02-22",
        time: "08:40",
        type: "session",
        text: "Feature planning sprint",
        tagIds: ["deep_work", "meetings"],
        value: { hours: 1.6 },
      },
    ],
  },
  {
    id: "goal_relationships",
    name: "Stay close with family and friends",
    description: "Maintain consistent, meaningful connection touchpoints.",
    category: "Relationships",
    tagIds: ["relationships", "family", "friends"],
    startDate: "2026-01-08",
    targetDate: "2026-12-31",
    progressPercent: 56,
    streak: 5,
    why: "Relationships are long-term compounding assets.",
    timeline: [
      {
        id: "gr_1",
        date: "2026-02-26",
        time: "20:10",
        type: "session",
        text: "Dinner catch-up with close friend",
        tagIds: ["friends", "relationships"],
      },
      {
        id: "gr_2",
        date: "2026-02-24",
        time: "21:00",
        type: "session",
        text: "Weekly family call",
        tagIds: ["family"],
      },
      {
        id: "gr_3",
        date: "2026-02-22",
        time: "18:30",
        type: "note",
        text: "Sent birthday reminders for cousins",
        tagIds: ["family", "relationships"],
      },
      {
        id: "gr_4",
        date: "2026-02-18",
        time: "19:15",
        type: "milestone",
        text: "10 meaningful social touchpoints this month",
        tagIds: ["friends", "family"],
      },
    ],
  },
];

export const INITIAL_GOALS_WITH_TAGS_STATE: GoalsWithTagsState = {
  taxonomy: TAGS,
  goals: MOCK_GOALS_WITH_TAGS,
};
