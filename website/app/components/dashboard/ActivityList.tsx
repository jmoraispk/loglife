export interface Activity {
  id: string;
  title: string;
  category: "Work" | "Health" | "Relationships";
  time: string;
  icon: string;
}

interface ActivityListProps {
  activities: Activity[];
}

const CATEGORY_STYLES: Record<Activity["category"], string> = {
  Work: "bg-blue-500/15 text-blue-300",
  Health: "bg-emerald-500/15 text-emerald-300",
  Relationships: "bg-amber-500/15 text-amber-300",
};

export default function ActivityList({ activities }: ActivityListProps) {
  return (
    <div className="space-y-2">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800/40
            hover:border-slate-700/60 hover:bg-slate-800/30 hover:scale-[1.01] hover:-translate-y-px
            transition-all duration-150 cursor-default"
        >
          <span className="text-base flex-shrink-0 select-none">{activity.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-100 font-medium truncate">{activity.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{activity.time}</p>
          </div>
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-lg flex-shrink-0 ${CATEGORY_STYLES[activity.category]}`}
          >
            {activity.category}
          </span>
        </div>
      ))}
    </div>
  );
}
