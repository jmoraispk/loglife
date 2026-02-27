export type TagColor =
  | "green"
  | "emerald"
  | "lime"
  | "purple"
  | "violet"
  | "indigo"
  | "amber"
  | "yellow"
  | "orange"
  | "slate";

export interface TagNode {
  id: string;
  name: string;
  color: TagColor;
  children: TagNode[];
}

export const TAG_COLOR_STYLES: Record<
  TagColor,
  { bg: string; text: string; border: string }
> = {
  green: {
    bg: "bg-green-500/15",
    text: "text-green-300",
    border: "border-green-500/30",
  },
  emerald: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-300",
    border: "border-emerald-500/30",
  },
  lime: {
    bg: "bg-lime-500/15",
    text: "text-lime-300",
    border: "border-lime-500/30",
  },
  purple: {
    bg: "bg-purple-500/15",
    text: "text-purple-300",
    border: "border-purple-500/30",
  },
  violet: {
    bg: "bg-violet-500/15",
    text: "text-violet-300",
    border: "border-violet-500/30",
  },
  indigo: {
    bg: "bg-indigo-500/15",
    text: "text-indigo-300",
    border: "border-indigo-500/30",
  },
  amber: {
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    border: "border-amber-500/30",
  },
  yellow: {
    bg: "bg-yellow-500/15",
    text: "text-yellow-200",
    border: "border-yellow-500/30",
  },
  orange: {
    bg: "bg-orange-500/15",
    text: "text-orange-300",
    border: "border-orange-500/30",
  },
  slate: {
    bg: "bg-slate-700/50",
    text: "text-slate-200",
    border: "border-slate-600/70",
  },
};

export const TAGS: TagNode[] = [
  {
    id: "health",
    name: "Health",
    color: "green",
    children: [
      { id: "gym", name: "Gym", color: "emerald", children: [] },
      { id: "running", name: "Running", color: "lime", children: [] },
    ],
  },
  {
    id: "work",
    name: "Work",
    color: "purple",
    children: [
      { id: "deep_work", name: "Deep work", color: "violet", children: [] },
      { id: "meetings", name: "Meetings", color: "indigo", children: [] },
    ],
  },
  {
    id: "relationships",
    name: "Relationships",
    color: "amber",
    children: [
      { id: "family", name: "Family", color: "yellow", children: [] },
      { id: "friends", name: "Friends", color: "orange", children: [] },
    ],
  },
];
