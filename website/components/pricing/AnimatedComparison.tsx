"use client";
import React, { useEffect, useRef, useCallback } from "react";

const oldSteps = [
  "Rent a Private Server",
  "Create 5 API keys",
  "Clone and install OpenClaw",
  "Configure OpenClaw",
  "Clone LogLife and install Plug-in",
  "Launch web dashboard",
];

const newSteps = [
  "Sign up",
  "Start Messaging AI",
  "See Habits in Dashboard",
];

interface ComparisonState {
  oldActive: number[];
  oldDone: number[];
  oldTexts: string[];
  newActive: number[];
  newTexts: string[];
  oldTime: string;
  newTime: string;
  showSummary: boolean;
}

const INITIAL_STATE: ComparisonState = {
  oldActive: [],
  oldDone: [],
  oldTexts: oldSteps.map(() => ""),
  newActive: [],
  newTexts: newSteps.map(() => ""),
  oldTime: "0h 00m",
  newTime: "0m 00s",
  showSummary: false,
};

type ComparisonAction =
  | { type: "RESET" }
  | { type: "OLD_ACTIVATE"; idx: number }
  | { type: "OLD_TYPE"; idx: number; text: string }
  | { type: "OLD_DONE"; idx: number }
  | { type: "OLD_TIME"; value: string }
  | { type: "NEW_ACTIVATE"; idx: number }
  | { type: "NEW_TIME"; value: string }
  | { type: "SHOW_SUMMARY" };

function comparisonReducer(state: ComparisonState, action: ComparisonAction): ComparisonState {
  switch (action.type) {
    case "RESET":
      return {
        oldActive: [],
        oldDone: [],
        oldTexts: oldSteps.map(() => ""),
        newActive: [],
        newTexts: newSteps.map(() => ""),
        oldTime: "0h 00m",
        newTime: "0m 00s",
        showSummary: false,
      };
    case "OLD_ACTIVATE":
      return { ...state, oldActive: [...state.oldActive, action.idx] };
    case "OLD_TYPE": {
      const texts = [...state.oldTexts];
      texts[action.idx] = action.text;
      return { ...state, oldTexts: texts };
    }
    case "OLD_DONE":
      return { ...state, oldDone: [...state.oldDone, action.idx] };
    case "OLD_TIME":
      return { ...state, oldTime: action.value };
    case "NEW_ACTIVATE": {
      const texts = [...state.newTexts];
      texts[action.idx] = newSteps[action.idx];
      return { ...state, newActive: [...state.newActive, action.idx], newTexts: texts };
    }
    case "NEW_TIME":
      return { ...state, newTime: action.value };
    case "SHOW_SUMMARY":
      return { ...state, showSummary: true };
    default:
      return state;
  }
}

function formatOldTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m < 10 ? "0" : ""}${m}m`;
}

function formatNewTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec < 10 ? "0" : ""}${sec}s`;
}

export default function AnimatedComparison() {
  const gridRef = useRef<HTMLDivElement>(null);
  const [state, dispatch] = React.useReducer(comparisonReducer, INITIAL_STATE);
  const runningRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => { clearInterval(id); clearTimeout(id); });
    timersRef.current = [];
  }, []);

  const addTimer = useCallback((id: ReturnType<typeof setTimeout>) => { timersRef.current.push(id); }, []);

  const reset = useCallback(() => {
    clearTimers();
    runningRef.current = false;
    dispatch({ type: "RESET" });
  }, [clearTimers]);

  const run = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    dispatch({ type: "RESET" });

    const start = setTimeout(() => {
      const CHAR_SPEED = 30;
      const STEP_PAUSE = 800;
      const OLD_TARGET = 16200;
      const oldClockDuration = 8000;

      const clockStart = Date.now();
      const oldClock = setInterval(() => {
        const elapsed = Date.now() - clockStart;
        const progress = Math.min(elapsed / oldClockDuration, 1);
        dispatch({ type: "OLD_TIME", value: formatOldTime(Math.floor(progress * OLD_TARGET)) });
        if (progress >= 1) clearInterval(oldClock);
      }, 30);
      addTimer(oldClock);

      function typeOldStep(idx: number) {
        if (idx >= oldSteps.length) {
          addTimer(setTimeout(startHosted, 500));
          return;
        }
        dispatch({ type: "OLD_ACTIVATE", idx });
        const text = oldSteps[idx];
        let ci = 0;
        const iv = setInterval(() => {
          if (ci < text.length) {
            ci++;
            dispatch({ type: "OLD_TYPE", idx, text: text.slice(0, ci) });
          } else {
            clearInterval(iv);
            dispatch({ type: "OLD_DONE", idx });
            addTimer(setTimeout(() => typeOldStep(idx + 1), STEP_PAUSE));
          }
        }, CHAR_SPEED);
        addTimer(iv);
      }
      typeOldStep(0);

      function startHosted() {
        const NEW_STEP_DELAY = 800;
        const NEW_TARGET = 90;
        const newTotalMs = 2500;

        const newClockStart = Date.now();
        const newClock = setInterval(() => {
          const elapsed = Date.now() - newClockStart;
          const progress = Math.min(elapsed / newTotalMs, 1);
          dispatch({ type: "NEW_TIME", value: formatNewTime(Math.floor(progress * NEW_TARGET)) });
          if (progress >= 1) clearInterval(newClock);
        }, 30);
        addTimer(newClock);

        function showNewStep(idx: number) {
          if (idx >= newSteps.length) {
            addTimer(setTimeout(() => dispatch({ type: "SHOW_SUMMARY" }), 500));
            addTimer(
              setTimeout(() => {
                runningRef.current = false;
                run();
              }, 8000)
            );
            return;
          }
          dispatch({ type: "NEW_ACTIVATE", idx });
          addTimer(setTimeout(() => showNewStep(idx + 1), NEW_STEP_DELAY));
        }
        showNewStep(0);
      }
    }, 50);
    addTimer(start);
  }, [addTimer]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !runningRef.current) run();
          else if (!entry.isIntersecting && runningRef.current) reset();
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(grid);
    return () => { observer.unobserve(grid); clearTimers(); };
  }, [run, reset, clearTimers]);

  return (
    <div className="mb-24 animate-slide-up" style={{ animationDelay: "0.2s" }}>
      <style>{`
        @keyframes blink-cursor { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .cursor-blink { animation: blink-cursor 0.8s step-end infinite; }
        .cursor-done { animation: none; opacity: 0.3; }
      `}</style>

      <div className="text-center mb-12">
        <span className="text-emerald-400 tracking-widest text-sm font-semibold uppercase">The Difference</span>
        <h2 className="text-3xl lg:text-4xl font-bold text-white mt-3 mb-4">
          Same product. Two paths.
        </h2>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          See what changes when we handle the infrastructure.
        </p>
      </div>

      <div ref={gridRef} className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">

        {/* Self-Hosted (slow) */}
        <div className="rounded-2xl border border-red-500/15 overflow-hidden bg-[rgba(15,22,41,0.8)]">
          <div className="px-5 py-4 flex items-center gap-3 font-semibold text-[#fca5a5] bg-[rgba(239,68,68,0.08)] border-b border-red-500/15">
            <span>&#9888;</span> Self-Hosted
          </div>

          <div className="mx-4 my-4 rounded-[10px] overflow-hidden bg-[#0d1117] border border-white/[0.06]">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-[#161b22] border-b border-white/[0.06]">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f56" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ffbd2e" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#27c93f" }} />
              <span className="ml-3 px-2.5 py-0.5 rounded-t-md text-[0.7rem] text-[#fca5a5] bg-[rgba(239,68,68,0.12)]">Terminal</span>
            </div>
            <div className="p-4 min-h-[240px] text-[0.82rem] leading-[1.7] text-[#8b949e] flex flex-col gap-2">
              {oldSteps.map((_, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 transition-all duration-300"
                  style={{ opacity: state.oldActive.includes(i) ? 1 : 0, transform: state.oldActive.includes(i) ? "translateY(0)" : "translateY(4px)" }}
                >
                  <span className={`text-red-500 shrink-0 ${state.oldDone.includes(i) ? "cursor-done" : "cursor-blink"}`}>&#9646;</span>
                  <span className="text-[#c9d1d9]">{state.oldTexts[i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-5 py-3 flex items-center gap-2 text-[0.85rem] bg-[rgba(239,68,68,0.05)] border-t border-red-500/10">
            <span className="text-[#8b949e]">Time elapsed:</span>
            <span className="font-semibold text-[#fca5a5]">{state.oldTime}</span>
          </div>
        </div>

        {/* Hosted (fast) */}
        <div className="rounded-2xl border border-emerald-500/25 overflow-hidden bg-[rgba(15,22,41,0.8)] shadow-lg shadow-emerald-500/5">
          <div className="px-5 py-4 flex items-center gap-3 font-semibold text-emerald-400 bg-emerald-500/[0.08] border-b border-emerald-500/15">
            <span>&#9889;</span> Hosted by LogLife
          </div>

          <div className="mx-4 my-4 rounded-[10px] overflow-hidden bg-[#0d1117] border border-white/[0.06]">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-[#161b22] border-b border-white/[0.06]">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f56" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ffbd2e" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#27c93f" }} />
              <span className="ml-3 px-2.5 py-0.5 rounded-t-md text-[0.7rem] text-emerald-400 bg-emerald-500/[0.12]">LogLife</span>
            </div>
            <div className="p-4 min-h-[240px] text-[0.82rem] leading-[1.7] text-[#8b949e] flex flex-col gap-2">
              {newSteps.map((_, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 transition-all duration-300"
                  style={{ opacity: state.newActive.includes(i) ? 1 : 0, transform: state.newActive.includes(i) ? "translateY(0)" : "translateY(4px)" }}
                >
                  <span
                    className="text-green-500 font-bold shrink-0 transition-all duration-200"
                    style={{ opacity: state.newActive.includes(i) ? 1 : 0, transform: state.newActive.includes(i) ? "scale(1)" : "scale(0.5)" }}
                  >&#10003;</span>
                  <span className="text-[#c9d1d9]">{state.newTexts[i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-5 py-3 flex items-center gap-2 text-[0.85rem] bg-emerald-500/[0.05] border-t border-emerald-500/10">
            <span className="text-[#8b949e]">Time elapsed:</span>
            <span className="font-semibold text-emerald-400">{state.newTime}</span>
          </div>
        </div>

      </div>

      <div
        className="text-center mt-10 transition-all duration-600"
        style={{ opacity: state.showSummary ? 1 : 0, transform: state.showSummary ? "translateY(0)" : "translateY(10px)" }}
      >
        <span className="block text-5xl font-extrabold bg-gradient-to-r from-emerald-400 to-purple-500 bg-clip-text text-transparent">
          180x
        </span>
        <span className="block text-lg text-slate-400 mt-1">
          faster setup. Always stable &amp; up-to-date.
        </span>
        <span className="block text-sm text-slate-500 mt-2">
          We handle infrastructure, APIs, and updates. You focus on logging.
        </span>
      </div>
    </div>
  );
}
