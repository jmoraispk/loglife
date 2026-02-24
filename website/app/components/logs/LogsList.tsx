import LogItem from "./LogItem";
import { LogEntry } from "./mockData";

interface LogsListProps {
  logs: LogEntry[];
  highlightedLogText?: string | null;
}

export default function LogsList({ logs, highlightedLogText }: LogsListProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Logs Explorer</p>
        <p className="text-xs text-slate-500">{logs.length} messages</p>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <LogItem
            key={log.id}
            log={log}
            isHighlighted={Boolean(
              highlightedLogText &&
                log.text.toLowerCase().includes(highlightedLogText.toLowerCase())
            )}
          />
        ))}
      </div>

      <div className="pt-2 flex items-center justify-between sm:justify-end sm:gap-4 text-sm">
        <button className="px-3 py-1.5 rounded-lg border border-slate-700/70 bg-slate-900/70 text-slate-300 hover:bg-slate-800/80 transition-colors cursor-pointer">
          &lt; Prev
        </button>
        <span className="text-slate-400">Page 1</span>
        <button className="px-3 py-1.5 rounded-lg border border-slate-700/70 bg-slate-900/70 text-slate-300 hover:bg-slate-800/80 transition-colors cursor-pointer">
          Next &gt;
        </button>
      </div>
    </section>
  );
}
