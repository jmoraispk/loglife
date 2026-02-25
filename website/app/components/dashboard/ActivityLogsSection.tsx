import ClassificationPanel from "./ClassificationPanel";
import ActivityLogList from "./ActivityLogList";

// ─── Pipeline step ────────────────────────────────────────────────────────────

function PipelineStep({
  icon,
  label,
  isLast = false,
}: {
  icon: React.ReactNode;
  label: string;
  isLast?: boolean;
}) {
  return (
    <>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-slate-500">{icon}</span>
        <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">{label}</span>
      </div>
      {!isLast && (
        <svg
          className="w-3 h-3 text-slate-700 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      )}
    </>
  );
}

// ─── ActivityLogsSection ──────────────────────────────────────────────────────

export default function ActivityLogsSection() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4 animate-fade-in-up-4 min-h-[260px] lg:min-h-[300px]">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800/50 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Activity Logs</h2>
          <p className="text-sm text-slate-400 mt-1">How your messages become insights</p>
        </div>
        <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20 tracking-wide">
          Today
        </span>
      </div>

      {/* Pipeline indicator */}
      <div className="pb-3 border-b border-slate-800/30 bg-slate-950/20 flex items-center gap-2 flex-wrap overflow-hidden">
        <PipelineStep
          icon={
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          }
          label="WhatsApp message"
        />
        <PipelineStep
          icon={
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          label="AI classifies intent"
        />
        <PipelineStep
          icon={
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          }
          label="Categorized log entry"
        />
        <PipelineStep
          icon={
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          label="Dashboard insights"
          isLast
        />
      </div>

      {/* Body: 2-column — Classification | Log timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClassificationPanel />
        <ActivityLogList />
      </div>
    </div>
  );
}
