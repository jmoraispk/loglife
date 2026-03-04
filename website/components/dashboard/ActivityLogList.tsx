import ActivityItem, { ActivityLog } from "./ActivityItem";

// ─── Mock data ────────────────────────────────────────────────────────────────

export const MOCK_LOGS: ActivityLog[] = [
  { id: "1",  time: "07:00", text: "Morning workout at the gym",           category: "Health"        },
  { id: "2",  time: "08:15", text: "Journaled thoughts for 15 minutes",    category: "Health"        },
  { id: "3",  time: "09:30", text: "Team standup meeting",                 category: "Work"          },
  { id: "4",  time: "10:00", text: "Deep work on project proposal",        category: "Work"          },
  { id: "5",  time: "12:30", text: "Lunch break — took a walk outside",    category: "Health"        },
  { id: "6",  time: "13:15", text: "Called mum to check in",               category: "Relationships" },
  { id: "7",  time: "14:00", text: "Project review with the team",         category: "Work"          },
  { id: "8",  time: "17:30", text: "Dinner with family at home",           category: "Relationships" },
  { id: "9",  time: "19:00", text: "Evening run — 5 km",                   category: "Health"        },
  { id: "10", time: "21:00", text: "Read before bed",                      category: "Health"        },
];

// ─── ActivityLogList ──────────────────────────────────────────────────────────

interface ActivityLogListProps {
  logs?: ActivityLog[];
}

export default function ActivityLogList({ logs = MOCK_LOGS }: ActivityLogListProps) {
  const categoryCount = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.category] = (acc[l.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Today&apos;s Log</p>
        <div className="flex items-center gap-3">
          {Object.entries(categoryCount).map(([cat, count]) => (
            <span key={cat} className="text-[11px] font-medium text-slate-500">
              {count} {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Scrollable timeline */}
      <div className="max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
        {logs.map((log, i) => (
          <ActivityItem
            key={log.id}
            log={log}
            isLast={i === logs.length - 1}
            isLatest={i === logs.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
