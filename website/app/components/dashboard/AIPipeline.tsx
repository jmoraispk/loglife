"use client";

import { useEffect, useState } from "react";
import RawInputCard from "./RawInputCard";
import AIProcessingCard from "./AIProcessingCard";
import StructuredOutputCard from "./StructuredOutputCard";

type AIPipelineProps = {
  isActive?: boolean;
  allowDeveloperView?: boolean;
  className?: string;
};

// ─── Arrow between steps (responsive: horizontal on desktop, vertical on mobile)

function FlowArrow() {
  return (
    <>
      {/* Desktop — horizontal */}
      <div className="hidden lg:flex items-center flex-shrink-0 px-1 self-center">
        <div className="flex items-center gap-0.5 text-slate-700">
          <div className="w-6 h-px bg-gradient-to-r from-slate-800 to-slate-700" />
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
      {/* Mobile — vertical */}
      <div className="lg:hidden flex justify-center py-0.5">
        <svg
          className="w-4 h-4 text-slate-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </>
  );
}

// ─── AIPipeline ───────────────────────────────────────────────────────────────

export default function AIPipeline({
  isActive = true,
  allowDeveloperView = true,
  className = "",
}: AIPipelineProps) {
  const [activeMappingStep, setActiveMappingStep] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setActiveMappingStep(0);
      return;
    }

    const id = setInterval(() => {
      setActiveMappingStep((prev) => (prev + 1) % 4);
    }, 1800);

    return () => clearInterval(id);
  }, [isActive]);

  return (
    <div className={`bg-slate-900/60 border border-slate-800/60 rounded-2xl mb-8 animate-fade-in-up ${className}`}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-800/50 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">AI Processing Pipeline</h2>
          <p className="text-sm text-slate-400 mt-1">
            How raw journal input becomes structured dashboard data
          </p>
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-violet-500/10 text-violet-400 text-xs font-semibold border border-violet-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Live Demo
        </span>
      </div>

      {/* 3-step pipeline body */}
      <div className="p-6 flex flex-col lg:flex-row items-stretch gap-3">
        <RawInputCard activeMappingStep={activeMappingStep} />
        <FlowArrow />
        <AIProcessingCard />
        <FlowArrow />
        <StructuredOutputCard
          activeMappingStep={activeMappingStep}
          allowDeveloperView={allowDeveloperView}
        />
      </div>

      {/* Connection footer — links output to dashboard sections */}
      <div className="px-6 py-4 border-t border-slate-800/40 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <span className="text-xs text-slate-400">
            This output powers your dashboard below
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
          <span>
            activities{" "}
            <span className="text-emerald-400 font-semibold">→</span>{" "}
            Activity Logs
          </span>
          <span className="text-slate-700 select-none">·</span>
          <span>
            summary{" "}
            <span className="text-blue-400 font-semibold">→</span>{" "}
            Donut Chart
          </span>
        </div>
      </div>
    </div>
  );
}
