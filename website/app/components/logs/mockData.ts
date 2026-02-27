export type LogCategory = "Work" | "Health" | "Relationships" | "Other";
export type LogType = "Life Log" | "Ignored";
export type LogsView = "daily" | "recent";
export type RecentCountOption = 10 | 20 | 50 | 100;

export interface LogEntry {
  id: string;
  time: string;
  text: string;
  categories: LogCategory[];
  type: LogType;
  date?: string;
  timestamp?: string;
  tags?: string[];
  importance?: string;
}

export interface ClassificationExample {
  id: string;
  rawMessage: string;
  extractedCategories: LogCategory[];
  notes: string;
}

export const CATEGORY_STYLES: Record<LogCategory, string> = {
  Work: "bg-blue-500/15 text-blue-300 border border-blue-500/25",
  Health: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25",
  Relationships: "bg-amber-500/15 text-amber-300 border border-amber-500/25",
  Other: "bg-slate-500/20 text-slate-300 border border-slate-500/25",
};

export const LOG_TYPE_STYLES: Record<LogType, string> = {
  "Life Log": "bg-violet-500/15 text-violet-300 border border-violet-500/25",
  Ignored: "bg-rose-500/15 text-rose-300 border border-rose-500/25",
};

export const LOGS_PAGE_SIZE = 25;
export const RECENT_COUNT_OPTIONS: RecentCountOption[] = [10, 20, 50, 100];

export interface DailyDateOption {
  value: string;
  label: string;
}

export const MOCK_LOGS: LogEntry[] = [
  {
    id: "log-1",
    time: "06:45",
    text: "Morning workout",
    categories: ["Health"],
    type: "Life Log",
  },
  {
    id: "log-2",
    time: "08:30",
    text: "Focused sprint for quarterly planning",
    categories: ["Work"],
    type: "Life Log",
  },
  {
    id: "log-3",
    time: "09:05",
    text: "What's the weather today?",
    categories: ["Other"],
    type: "Ignored",
  },
  {
    id: "log-4",
    time: "12:20",
    text: "Lunch with my sister",
    categories: ["Relationships", "Health"],
    type: "Life Log",
  },
  {
    id: "log-5",
    time: "15:10",
    text: "Reminder to pay electricity bill",
    categories: ["Other"],
    type: "Ignored",
  },
  {
    id: "log-6",
    time: "19:40",
    text: "Evening walk and podcast",
    categories: ["Health"],
    type: "Life Log",
  },
];

export const MOCK_CLASSIFICATION_EXAMPLES: ClassificationExample[] = [
  {
    id: "example-1",
    rawMessage: "Had standup, then did deep work, and called mom in the evening",
    extractedCategories: ["Work", "Relationships"],
    notes: "Multiple high-signal actions were grouped as meaningful life activity.",
  },
  {
    id: "example-2",
    rawMessage: "Can you check if it will rain tomorrow?",
    extractedCategories: ["Other"],
    notes: "Utility query with low journaling value, marked as non-log.",
  },
  {
    id: "example-3",
    rawMessage: "Gym session before breakfast and a 20-minute walk after dinner",
    extractedCategories: ["Health"],
    notes: "Repeated behavior with clear wellbeing relevance, stored as life log.",
  },
];
