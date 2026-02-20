"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useWhatsAppWidget } from "../contexts/WhatsAppWidgetContext";

function CheckIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

const SETUP_STEPS = [
  "Configure API keys",
  "Provision server",
  "Set up storage",
  "Deploy application",
  "Verify & monitor",
];

function AnimatedComparison() {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [selfHostedCompleted, setSelfHostedCompleted] = useState<boolean[]>(new Array(SETUP_STEPS.length).fill(false));
  const [hostedCompleted, setHostedCompleted] = useState<boolean[]>(new Array(SETUP_STEPS.length).fill(false));
  const [selfHostedTime, setSelfHostedTime] = useState(0);
  const [hostedTime, setHostedTime] = useState(0);
  const [selfHostedDone, setSelfHostedDone] = useState(false);
  const [hostedDone, setHostedDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); obs.unobserve(el); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const selfHostedTarget = 9000;
  const hostedTarget = 300;

  const formatTime = useCallback((ms: number, isSelfHosted: boolean) => {
    if (isSelfHosted) {
      const totalMinutes = Math.floor((ms / selfHostedTarget) * 150);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}h ${String(minutes).padStart(2, "0")}m`;
    }
    const totalSeconds = Math.floor((ms / hostedTarget) * 300);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  }, []);

  useEffect(() => {
    if (!started) return;

    const stepDelay = selfHostedTarget / SETUP_STEPS.length;
    const timers: ReturnType<typeof setTimeout>[] = [];

    SETUP_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setSelfHostedCompleted(prev => { const next = [...prev]; next[i] = true; return next; });
      }, stepDelay * (i + 1)));
    });

    timers.push(setTimeout(() => setSelfHostedDone(true), selfHostedTarget));

    return () => timers.forEach(clearTimeout);
  }, [started, selfHostedTarget]);

  useEffect(() => {
    if (!started) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    SETUP_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setHostedCompleted(prev => { const next = [...prev]; next[i] = true; return next; });
      }, 80 * (i + 1)));
    });

    timers.push(setTimeout(() => setHostedDone(true), hostedTarget));

    return () => timers.forEach(clearTimeout);
  }, [started, hostedTarget]);

  useEffect(() => {
    if (!started || selfHostedDone) return;
    const interval = setInterval(() => {
      setSelfHostedTime(prev => {
        if (prev >= selfHostedTarget) { clearInterval(interval); return selfHostedTarget; }
        return prev + 50;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [started, selfHostedDone, selfHostedTarget]);

  useEffect(() => {
    if (!started || hostedDone) return;
    const interval = setInterval(() => {
      setHostedTime(prev => {
        if (prev >= hostedTarget) { clearInterval(interval); return hostedTarget; }
        return prev + 50;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [started, hostedDone, hostedTarget]);

  return (
    <div ref={ref} className="mb-24 animate-slide-up" style={{ animationDelay: "0.2s" }}>
      <div className="text-center mb-12">
        <span className="text-emerald-400 tracking-widest text-sm font-semibold uppercase">The Difference</span>
        <h2 className="text-3xl lg:text-4xl font-bold text-white mt-3 mb-4">
          Same product. Two paths.
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Self-Hosted panel */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Self-Hosted</h3>
            </div>
          </div>

          <div className="text-center my-6">
            <span className={`text-3xl font-mono font-bold transition-colors duration-300 ${selfHostedDone ? "text-slate-300" : "text-slate-500"}`}>
              {started ? formatTime(selfHostedTime, true) : "0h 00m"}
            </span>
          </div>

          <div className="space-y-3">
            {SETUP_STEPS.map((step, i) => (
              <div key={step} className={`flex items-center gap-3 transition-all duration-500 ${selfHostedCompleted[i] ? "opacity-100" : "opacity-30"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${selfHostedCompleted[i] ? "bg-slate-600" : "border border-slate-700"}`}>
                  {selfHostedCompleted[i] && (
                    <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-slate-400">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hosted panel */}
        <div className="bg-slate-900/60 backdrop-blur-md border-2 border-emerald-500/40 rounded-2xl p-8 shadow-lg shadow-emerald-500/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Hosted</h3>
            </div>
          </div>

          <div className="text-center my-6">
            <span className={`text-3xl font-mono font-bold transition-colors duration-300 ${hostedDone ? "text-emerald-400" : "text-emerald-600"}`}>
              {started ? formatTime(hostedTime, false) : "0m 00s"}
            </span>
          </div>

          <div className="space-y-3">
            {SETUP_STEPS.map((step, i) => (
              <div key={step} className={`flex items-center gap-3 transition-all duration-300 ${hostedCompleted[i] ? "opacity-100" : "opacity-30"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${hostedCompleted[i] ? "bg-emerald-500/30" : "border border-emerald-500/20"}`}>
                  {hostedCompleted[i] && (
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-slate-200">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-center text-slate-500 text-sm mt-8">
        Same product. Same features. Different setup time.
      </p>
    </div>
  );
}

export default function PricingPage() {
  const { openWidget } = useWhatsAppWidget();

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
                {[
                  "Everything below, plus we handle the infrastructure:",
                  "Hosted private instance",
                  "API usage included (up to limit)",
                  "Dashboard access",
                  "Health telemetry integrations",
                  "Smart reminders",
                  "AI highlights (D/W/M/Q/Y)",
                  "Email support",
                ].map((item, index) => (
                  <div key={item} className="flex items-start gap-3 text-slate-300">
                    <CheckIcon className={`w-5 h-5 mt-0.5 shrink-0 ${index === 0 ? "text-emerald-400" : "text-emerald-500/70"}`} />
                    <span className={`text-sm ${index === 0 ? "font-medium text-emerald-400" : ""}`}>{item}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={openWidget}
                className="w-full inline-flex items-center justify-center px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all transform hover:scale-105 cursor-pointer"
              >
                Free Early Access
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
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
            <button
              onClick={openWidget}
              className="inline-flex items-center justify-center px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-[0_0_24px_rgba(16,185,129,0.3)] transition-all transform hover:scale-105 cursor-pointer"
            >
              Free Early Access
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
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
