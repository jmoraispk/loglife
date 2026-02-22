"use client";
import React, { useEffect, useRef, useCallback } from "react";
import Link from "next/link";

function CheckIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

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

function AnimatedComparison() {
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
      // --- Phase 1: Self-Hosted (left side types out fully, ~8s) ---
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
          // Phase 1 done → pause → start Phase 2
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

      // --- Phase 2: Hosted (right side, starts after left finishes) ---
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
            // Phase 2 done → pause → show punchline
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

export default function PricingPage() {


  return (
    <main className="min-h-screen pt-32 pb-24 px-6 lg:px-8">
      <div className="relative z-10 mx-auto max-w-6xl">

        {/* Header */}
        <div className="text-center mb-16 space-y-4 animate-slide-up">
          <h1 className="text-4xl lg:text-6xl font-bold text-white tracking-tighter">
            Start for free. Scale when you&apos;re ready.
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Early access is free with no card needed. When we launch paid plans, self-hosting stays free forever.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-2 gap-6 items-start max-w-4xl mx-auto mb-24 animate-slide-up" style={{ animationDelay: "0.1s" }}>

          {/* Self-Hosted (Free) */}
          <div className="relative bg-slate-950/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 flex flex-col hover:border-slate-700 transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-800/10 to-transparent rounded-3xl pointer-events-none" />

            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Self-Hosted</h2>
              <p className="text-sm text-slate-500 mb-4">For hackers &amp; power users</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-slate-500 font-medium">/ forever</span>
              </div>
            </div>

            <div className="space-y-4 mb-8 flex-1">
              {[
                "Open source",
                "BYO API keys",
                "Own your data 100%",
                "Community support",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-slate-300">
                  <CheckIcon className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
              <div className="flex items-start gap-3 text-slate-400">
                <svg className="w-5 h-5 text-red-400/70 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-sm">Manual updates</span>
              </div>
            </div>

            <a
              href="https://github.com/jmoraispk/loglife"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl border border-slate-700 transition-colors"
            >
              View on GitHub
            </a>
          </div>

          {/* Hosted */}
          <div className="relative bg-slate-900/60 backdrop-blur-xl border-2 border-emerald-500/40 rounded-3xl overflow-hidden flex flex-col hover:border-emerald-500/60 transition-all duration-300 group shadow-lg shadow-emerald-500/10">
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600" />

            <div className="p-8 flex flex-col flex-1">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 uppercase tracking-wider">
                    Free during early access
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">Hosted</h2>
                <p className="text-sm text-slate-500 mb-4">For most users</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-emerald-400">Free</span>
                  <span className="text-slate-600 font-medium line-through">$29/mo</span>
                </div>
              </div>

              <div className="space-y-4 mb-8 flex-1">
                <div className="flex items-start gap-3 text-slate-300">
                  <CheckIcon className="w-5 h-5 mt-0.5 shrink-0 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Hosted private instance</span>
                </div>
                {[
                  "Included API usage",
                  "Dashboard access",
                  "Health telemetry integrations",
                  "No Maintenance, Always on",
                  "Automatic Updates of Latest Features",
                  "Priority Email Support",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-slate-300">
                    <CheckIcon className="w-5 h-5 mt-0.5 shrink-0 text-emerald-500/70" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/signup"
                className="w-full inline-flex items-center justify-center px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all transform hover:scale-105 cursor-pointer"
              >
                Free Early Access
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <p className="text-xs text-slate-500 text-center mt-2">No card needed.</p>
            </div>
          </div>
        </div>

        {/* Animated Time Comparison */}
        <AnimatedComparison />

        {/* How We Bill */}
        <div className="mb-24 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <div className="text-center mb-12">
            <span className="text-emerald-400 tracking-widest text-sm font-semibold uppercase">How We Bill</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mt-3 mb-4">
              Transparent, fair, and designed to keep you in control.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
                title: "Subscription Covers",
                description: "Web hosting, development, monitoring, alerts, audit logs, and support. All infrastructure costs included.",
              },
              {
                icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
                title: "Itemized Usage",
                description: "Monthly receipts show usage by provider\u2014tokens, minutes, calls\u2014plus our subscription fee. No surprises.",
              },
              {
                icon: "M6 18L18 6M6 6l12 12",
                title: "Clear Cancellation",
                description: "Cancel any time. No lock-in, no hidden fees. All data automatically deleted 30 days after cancellation.",
              },
              {
                icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
                title: "Inactivity Nudges",
                description: "No usage for a while? We\u2019ll warn you, then auto-cancel the subscription if the service isn\u2019t being used.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 hover:border-teal-500/30 transition-all duration-200"
              >
                <div className="text-teal-400 mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Section */}
        <div className="mb-24 animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <div className="text-center mb-12">
            <span className="text-emerald-400 tracking-widest text-sm font-semibold uppercase">Privacy</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mt-3 mb-4">
              Your data, your rules.
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Different deployment options, same commitment to transparency.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Private Deploy */}
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Private Deploy</h3>
                  <p className="text-sm text-slate-500">Self-hosted on your infrastructure</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                  <p className="text-slate-300 leading-relaxed">
                    Day 1 includes a <span className="text-white font-medium">self-host / local-first option</span> (or user-controlled cloud), and the project is <span className="text-white font-medium">100% open source</span> (code + docs + website + dashboard).
                  </p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                  <p className="text-slate-300 leading-relaxed">
                    We are <span className="text-white font-medium">not able to see, store, or modify your data</span>. All processing happens in your environment.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm text-teal-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Maximum privacy guarantee</span>
              </div>
            </div>

            {/* Hosted */}
            <div className="bg-slate-900/60 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Hosted</h3>
                  <p className="text-sm text-slate-500">Managed by LogLife</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                  <p className="text-slate-300 leading-relaxed">
                    We don&apos;t sell or <span className="text-white font-medium">train models on your data</span>. We do not access private data&mdash;but since we operate the server, theoretical access exists. For zero-access guarantees, self-host.
                  </p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                  <p className="text-slate-300 leading-relaxed">
                    Users can <span className="text-white font-medium">export/delete/reset data anytime</span>. All data is deleted 30 days after a subscription is canceled.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm text-emerald-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>No access by design &amp; no model training on user data</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Footer */}
        <div className="text-center animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <div className="bg-gradient-to-br from-emerald-500/10 to-slate-900/50 border border-emerald-500/20 rounded-3xl p-12">
            <h3 className="text-3xl font-bold tracking-tighter text-white mb-4">Ready to try it?</h3>
            <p className="text-lg text-slate-400 mb-8">No card needed.</p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-[0_0_24px_rgba(16,185,129,0.3)] transition-all transform hover:scale-105 cursor-pointer"
            >
              Free Early Access
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm">
            Powered by LogLife &middot; Open Source &middot; Your Data, Your Rules
          </p>
        </div>

      </div>
    </main>
  );
}
