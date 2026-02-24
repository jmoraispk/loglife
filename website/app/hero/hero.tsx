"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-emerald-400 tracking-widest text-sm font-semibold uppercase">
      {children}
    </span>
  );
}

function Hero() {
  return (
    <section id="hero" className="relative isolate overflow-hidden pt-16 pb-24 min-h-screen flex items-center dot-grid">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter text-white leading-tight animate-slide-up">
              Effortless tracking,{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600">
                in chat.
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-slate-300 leading-relaxed animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Turns your chat into a life log with habit tracking and wearable
              integration&mdash;AI listens, remembers, and surfaces patterns,
              without coaching you.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-7 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-base font-semibold rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition-all duration-200 transform hover:scale-105 shadow-[0_0_24px_rgba(16,185,129,0.35)] border border-emerald-400/20 cursor-pointer"
              >
                Free Early Access
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center px-7 py-3.5 bg-white/5 backdrop-blur-lg text-slate-200 text-base font-semibold rounded-xl hover:bg-white/10 transition-all duration-200 border border-white/10"
              >
                See How It Works
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>

            <p className="text-sm text-slate-500 animate-slide-up" style={{ animationDelay: "0.25s" }}>
              No card needed.
            </p>

            <div className="space-y-1.5 pt-2 animate-slide-up" style={{ animationDelay: "0.3s" }}>
              {[
                "Built for people who want to remember their life.",
                "Built for people who don\u2019t have time for journaling apps.",
                "Built for people who already talk to their phone.",
              ].map((line) => (
                <p key={line} className="text-sm text-slate-500 italic">{line}</p>
              ))}
            </div>
          </div>

          {/* Chat mock */}
          <div className="relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-slate-300">LogLife</span>
                <span className="ml-auto text-xs text-slate-600">8:15 PM</span>
              </div>

              <div className="p-5 space-y-4">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] bg-emerald-600/90 rounded-2xl rounded-tr-md px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      <span className="text-xs text-emerald-200">Voice note</span>
                    </div>
                    <p className="text-sm text-white">
                      I have a lot of work and I feel like eating some chips.
                    </p>
                  </div>
                </div>

                {/* LogLife response */}
                <div className="flex justify-start">
                  <div className="max-w-[85%] bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-tl-md px-4 py-3">
                    <p className="text-sm text-slate-200 leading-relaxed">
                      I hear you. Let&apos;s slow it down. <span className="text-emerald-400 font-medium">The facts</span>: less sleep last night, you&apos;re hungry and tired.
                      If you get the chips&mdash;how will you feel after? <span className="italic text-emerald-400/80">Whatever you decide, log so we learn from it!</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TheProblem() {
  const { ref, visible } = useInView();

  const cards = [
    {
      title: "Habits without context.",
      description: "Habit trackers give you streaks and checkboxes, but no idea why you fell off. Rigid, binary, guilt-inducing.",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    },
    {
      title: "Biometrics without meaning.",
      description: "Your wearable says you slept 5 hours. But was it the late meeting, the coffee, or the argument? Numbers without context are just noise.",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    },
    {
      title: "Journals that gather dust.",
      description: "You start strong, then life gets busy. Journaling apps feel like homework. By March, you\u2019ve stopped.",
      icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    },
  ];

  return (
    <section ref={ref} className={`relative py-24 reveal ${visible ? "visible" : ""}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <SectionLabel>The Problem</SectionLabel>
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tighter text-white mt-3 mb-4">
            You&apos;re already tracking. It&apos;s just scattered everywhere.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card, i) => (
            <div
              key={i}
              className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 hover:border-slate-600 transition-all duration-200"
            >
              <div className="text-slate-400 mb-5">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.icon} />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{card.title}</h3>
              <p className="text-slate-400 leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Quote() {
  const { ref, visible } = useInView();

  return (
    <section ref={ref} className={`relative py-20 reveal ${visible ? "visible" : ""}`}>
      <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
        <p className="text-3xl lg:text-4xl font-light text-white/90 italic leading-relaxed mb-6">
          &ldquo;You do not rise to the level of your goals. You fall to the level of your systems.&rdquo;
        </p>
        <p className="text-sm text-slate-500 mb-3">&mdash; James Clear</p>
        <p className="text-lg text-emerald-400 font-medium">LogLife is the system.</p>
      </div>
    </section>
  );
}

function TheDifference() {
  const { ref, visible } = useInView();
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      label: "Habit Trackers",
      left: {
        title: "Habit Trackers",
        text: "Good at streaks and records, but rigid, binary, guilt-inducing. No idea why you fell off or what conditions led to consistency.",
      },
      right: {
        title: "LogLife",
        text: "Log habits naturally in chat. AI spots what leads to consistency vs drop-off\u2014no streak pressure. Easy & guilt-free.",
      },
    },
    {
      label: "Health Wearables",
      left: {
        title: "Health Wearables",
        text: "Great at collecting biometrics\u2014sleep, activity, stress\u2014but missing what was actually happening in your life. Numbers without context.",
      },
      right: {
        title: "LogLife",
        text: "Integrates wearable data and adds life context (meeting vs workout vs cooking) so those numbers become interpretable and useful.",
      },
    },
    {
      label: "Digital Journaling",
      left: {
        title: "Digital Journaling",
        text: "Captures thoughts, but tends to be present-focused and disconnected from habits and health signals. Not very actionable.",
      },
      right: {
        title: "LogLife",
        text: "Combines journaling with habit and wearable data. Summaries across past\u2013present\u2013future. Open-source, user-owned data.",
      },
    },
    {
      label: "AI Coaching",
      left: {
        title: "AI Coaching",
        text: "Tries to guide your decisions and tell you what to do. Prescriptive by design.",
      },
      right: {
        title: "LogLife",
        text: "A listener, not a coach. Low-friction capture, reliable memory, pattern recognition\u2014no unsolicited advice.",
      },
    },
  ];

  return (
    <section ref={ref} className={`relative py-24 reveal ${visible ? "visible" : ""}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <SectionLabel>The Difference</SectionLabel>
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tighter text-white mt-3 mb-4">
            One tool to replace four.
          </h2>
        </div>

        {/* Pill tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === i
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_16px_rgba(16,185,129,0.2)]"
                  : "bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:text-slate-200 hover:border-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Comparison card */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <h3 className="text-lg font-semibold text-slate-300">{tabs[activeTab].left.title}</h3>
            </div>
            <p className="text-slate-400 leading-relaxed">{tabs[activeTab].left.text}</p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-8 shadow-lg shadow-emerald-500/10">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h3 className="text-lg font-semibold text-white">{tabs[activeTab].right.title}</h3>
            </div>
            <p className="text-slate-200 leading-relaxed">{tabs[activeTab].right.text}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const { ref, visible } = useInView();

  const steps = [
    {
      number: "1",
      title: "Talk to LogLife",
      description: "Voice note or text. WhatsApp, Telegram, SMS, webchat. A short reflection is all you need.",
      icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z",
    },
    {
      number: "2",
      title: "AI captures and organizes",
      description: "Transcription, tagging, highlighting. Your 3\u20135 highlights emerge daily, weekly, monthly, yearly.",
      icon: "M13 10V3L4 14h7v7l9-11h-7z",
    },
    {
      number: "3",
      title: "Explore your dashboard",
      description: "Patterns, habits, progress. Chat is the input; the dashboard is the output.",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    },
    {
      number: "4",
      title: "Ask anything",
      description: "\u2018How did I sleep this week?\u2019 Your life, queryable in plain language.",
      icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
    },
  ];

  return (
    <section id="how-it-works" ref={ref} className={`relative py-24 reveal ${visible ? "visible" : ""}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <SectionLabel>How It Works</SectionLabel>
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tighter text-white mt-3 mb-4">
            Capture your life in four steps.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, i) => (
            <div
              key={i}
              className="relative bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/60 hover:border-emerald-500/50 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-sm font-bold text-emerald-400">
                  {step.number}
                </span>
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhatYouGet() {
  const { ref, visible } = useInView();

  const cards = [
    {
      title: "Chat-native",
      description: "Lives where you already chat. No new app, no new habit to build.",
      icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    },
    {
      title: "Life context",
      description: "The missing piece. Habits and biometrics mean something when connected to what was actually happening.",
      icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
    },
    {
      title: "A listener, not a coach",
      description: "Captures with low friction, remembers reliably, surfaces patterns\u2014without pushing advice.",
      icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    },
    {
      title: "Wearable integration",
      description: "Oura, Garmin, and more. Your body data + your words = the full picture.",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    },
    {
      title: "Open source",
      description: "Your data, your rules. Export everything, delete anytime, self-host if you want.",
      icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
    },
  ];

  return (
    <section ref={ref} className={`relative py-24 reveal ${visible ? "visible" : ""}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-6">
          <SectionLabel>What You Get</SectionLabel>
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tighter text-white mt-3 mb-4">
            No friction or advice. Just awareness.
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            This is not a therapy app or a productivity coach. This is a listener that remembers everything.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-12">
          {cards.map((card, i) => (
            <div
              key={i}
              className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 hover:border-emerald-500/50 transition-all duration-200 text-center"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.icon} />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{card.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  const { ref, visible } = useInView();

  return (
    <section ref={ref} className={`relative py-24 reveal ${visible ? "visible" : ""}`}>
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="bg-gradient-to-br from-emerald-500/10 to-slate-900/50 border border-emerald-500/20 rounded-3xl p-12 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tighter text-white mb-4">
            You&apos;ve never known yourself this well.
          </h2>
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            Your words. Your data. Your patterns. AI that listens, remembers, and surfaces what matters.
          </p>

          <div className="flex justify-center gap-3 mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] text-sm font-medium">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0088cc]/10 border border-[#0088cc]/30 text-[#0088cc] text-sm font-medium">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              Telegram
            </span>
          </div>

          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-[0_0_24px_rgba(16,185,129,0.3)] transition-all transform hover:scale-105 cursor-pointer"
          >
            Free Early Access
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="text-sm text-slate-500 mt-3">No card needed.</p>

          <div className="mt-6">
            <a
              href="https://github.com/jmoraispk/loglife"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LogLifeHero() {
  return (
    <main className="min-h-screen">
      <Hero />
      <TheProblem />
      <Quote />
      <TheDifference />
      <HowItWorks />
      <WhatYouGet />
      <FinalCTA />
    </main>
  );
}
