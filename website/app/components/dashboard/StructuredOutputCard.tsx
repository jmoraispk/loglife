"use client";

import { useMemo, useState } from "react";
import DashboardPreview from "./DashboardPreview";

type StructuredOutputCardProps = {
  activeMappingStep: number;
  allowDeveloperView?: boolean;
};

const MOCK_JSON = `{
  "activities": [
    { "text": "Morning gym", "category": "Health" },
    { "text": "5h deep work", "category": "Work", "duration": "5h" },
    { "text": "Dinner with parents", "category": "Relationships" }
  ],
  "summary": { "health": 30, "work": 50, "relationships": 20 }
}`;

export default function StructuredOutputCard({
  activeMappingStep,
  allowDeveloperView = true,
}: StructuredOutputCardProps) {
  const [viewMode, setViewMode] = useState<"user" | "developer">("user");

  const stepTitle = useMemo(
    () => {
      if (!allowDeveloperView) return "Dashboard Update";
      return viewMode === "user" ? "Dashboard Update" : "Structured Output";
    },
    [allowDeveloperView, viewMode],
  );

  return (
    <div className="flex-1 flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: "0.55s" }}>
      {/* Step label */}
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-emerald-900/50 border border-emerald-700/40 text-[10px] font-bold text-emerald-400 flex items-center justify-center flex-shrink-0 select-none">
          3
        </span>
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
          {stepTitle}
        </span>
      </div>

      {/* Card */}
      <div className="flex-1 bg-slate-950/70 border border-emerald-900/25 rounded-2xl p-5 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <p className="text-xs text-slate-400">
            {viewMode === "user" ? "Live Preview" : "Developer View"}
          </p>

          {allowDeveloperView && (
            <div className="inline-flex rounded-lg border border-slate-700/80 bg-slate-900/70 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("user")}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-colors ${
                  viewMode === "user"
                    ? "bg-violet-500/20 text-violet-200"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                User View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("developer")}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-colors ${
                  viewMode === "developer"
                    ? "bg-emerald-500/20 text-emerald-200"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Developer View
              </button>
            </div>
          )}
        </div>

        {viewMode === "user" || !allowDeveloperView ? (
          <DashboardPreview activeMappingStep={activeMappingStep} />
        ) : (
          <pre className="text-[11.5px] font-mono leading-[1.8] text-slate-400 overflow-x-auto flex-1">
            {MOCK_JSON}
          </pre>
        )}
      </div>
    </div>
  );
}
