import { CATEGORY_STYLES, LOG_TYPE_STYLES, LogEntry } from "./mockData";

interface LogItemProps {
  log: LogEntry;
  isHighlighted?: boolean;
}

export default function LogItem({ log, isHighlighted = false }: LogItemProps) {
  return (
    <article
      className={`group rounded-xl px-4 py-3 transition-all hover:bg-slate-900/80 ${
        isHighlighted
          ? "bg-emerald-500/10 border border-emerald-400/40 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]"
          : "bg-slate-900/55 border border-slate-800/60 hover:border-slate-700/80"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="w-14 flex-shrink-0 pt-0.5">
          <p className="text-xs font-mono text-slate-500">{log.time}</p>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-100 leading-relaxed">{log.text}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {log.categories.map((category) => (
              <span key={`${log.id}-${category}`} className={`text-xs font-medium px-2 py-0.5 rounded-md ${CATEGORY_STYLES[category]}`}>
                {category}
              </span>
            ))}
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${LOG_TYPE_STYLES[log.type]}`}>
              {log.type}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
