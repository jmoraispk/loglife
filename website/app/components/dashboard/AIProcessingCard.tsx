"use client";

import { useEffect, useState } from "react";

// ─── Mock processing steps (cycles on a timer) ────────────────────────────────

const PROCESSING_STEPS = [
  "Identifying activity mentions...",
  "Classifying by category...",
  "Extracting duration metrics...",
  "Building structured output...",
];

const CONCEPT_TAGS = [
  { label: "Health",        style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { label: "Work",          style: "bg-blue-500/10 text-blue-400 border-blue-500/20"         },
  { label: "Relationships", style: "bg-amber-500/10 text-amber-400 border-amber-500/20"      },
];

// ─── AIProcessingCard ─────────────────────────────────────────────────────────

export default function AIProcessingCard() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % PROCESSING_STEPS.length), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex-1 flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
      {/* Step label */}
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-violet-900/50 border border-violet-700/40 text-[10px] font-bold text-violet-400 flex items-center justify-center flex-shrink-0 select-none">
          2
        </span>
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
          AI Extraction
        </span>
      </div>

      {/* Card */}
      <div
        className="flex-1 bg-violet-950/20 border border-violet-800/25 rounded-2xl p-5
          flex flex-col items-center justify-center gap-5"
      >
        {/* Brain / AI icon */}
        <div className="w-11 h-11 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-violet-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z"
            />
          </svg>
        </div>

        {/* Pulsing indicator dots */}
        <div className="flex items-center gap-2">
          {[0, 150, 300].map((delay, i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>

        {/* Cycling step message */}
        <p className="shimmer-text text-xs font-mono text-center px-2 min-h-[18px]">
          {PROCESSING_STEPS[step]}
        </p>

        {/* Extracted concept tags */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {CONCEPT_TAGS.map(({ label, style }) => (
            <span
              key={label}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${style}`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
