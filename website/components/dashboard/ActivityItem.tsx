// ─── Shared types & config (used by ActivityLogList + ClassificationPanel) ────

export type LogCategory = "Work" | "Health" | "Relationships";

export interface ActivityLog {
  id: string;
  time: string; // "HH:MM"
  text: string;
  category: LogCategory;
}

export const CATEGORY_CONFIG: Record<
  LogCategory,
  { badge: string; color: string; highlight: string }
> = {
  Work: {
    badge: "bg-blue-500/15 text-blue-300",
    color: "#3b82f6",
    highlight: "bg-blue-500/20 text-blue-200 not-italic",
  },
  Health: {
    badge: "bg-emerald-500/15 text-emerald-300",
    color: "#10b981",
    highlight: "bg-emerald-500/20 text-emerald-200 not-italic",
  },
  Relationships: {
    badge: "bg-amber-500/15 text-amber-300",
    color: "#f59e0b",
    highlight: "bg-amber-500/20 text-amber-200 not-italic",
  },
};

// ─── ActivityItem ─────────────────────────────────────────────────────────────

interface ActivityItemProps {
  log: ActivityLog;
  isLast: boolean;
  isLatest: boolean;
}

export default function ActivityItem({ log, isLast, isLatest }: ActivityItemProps) {
  const config = CATEGORY_CONFIG[log.category];

  return (
    <div className="flex items-stretch gap-0">
      {/* Left col: time + connecting line */}
      <div className="flex flex-col items-end w-12 flex-shrink-0">
        <span className="text-[11px] font-mono text-slate-500 leading-none pt-0.5">
          {log.time}
        </span>
        {!isLast && (
          <div className="flex-1 w-px bg-slate-800/50 mt-1.5 mx-auto" />
        )}
      </div>

      {/* Dot */}
      <div className="flex flex-col items-center px-3 flex-shrink-0">
        <div
          className={`w-2 h-2 rounded-full mt-0.5 flex-shrink-0 transition-transform duration-200 ${
            isLatest ? "scale-125" : ""
          }`}
          style={{
            backgroundColor: config.color,
            boxShadow: isLatest ? `0 0 6px ${config.color}88` : "none",
          }}
        />
        {!isLast && <div className="flex-1 w-px bg-slate-800/50 mt-1.5" />}
      </div>

      {/* Content */}
      <div className="flex items-start justify-between gap-3 pb-4 flex-1 min-w-0">
        <p className="text-sm text-slate-200 leading-snug pt-0.5">{log.text}</p>
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-lg flex-shrink-0 mt-0.5 ${config.badge}`}
        >
          {log.category}
        </span>
      </div>
    </div>
  );
}
