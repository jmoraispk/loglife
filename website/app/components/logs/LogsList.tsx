import LogItem from "./LogItem";
import { LogEntry } from "./mockData";

interface LogsListProps {
  logs: LogEntry[];
  highlightedLogText?: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function LogsList({
  logs,
  highlightedLogText,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
}: LogsListProps) {
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <section className="space-y-3 flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Logs Explorer</p>
        <p className="text-xs text-slate-500">
          {totalCount} message{totalCount !== 1 ? "s" : ""}
          {totalPages > 1 ? ` · Page ${currentPage} of ${totalPages}` : ""}
        </p>
      </div>

      <div
        className="logs-explorer-scroll min-h-0 overflow-y-auto rounded-xl border border-slate-800/60 bg-slate-900/30 max-h-[min(60vh,28rem)]"
        data-scrollbar="theme"
      >
        <div className="space-y-3 p-1">
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
      </div>

      {totalPages > 1 && (
        <div className="pt-2 flex items-center justify-between sm:justify-end sm:gap-4 text-sm shrink-0">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!canPrev}
            className="px-3 py-1.5 rounded-lg border border-slate-700/70 bg-slate-900/70 text-slate-300 hover:bg-slate-800/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &lt; Prev
          </button>
          <span className="text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!canNext}
            className="px-3 py-1.5 rounded-lg border border-slate-700/70 bg-slate-900/70 text-slate-300 hover:bg-slate-800/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next &gt;
          </button>
        </div>
      )}
    </section>
  );
}
