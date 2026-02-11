"use client";
import React, { useState } from "react";

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-700/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left bg-slate-900/40 hover:bg-slate-900/60 transition-colors cursor-pointer"
      >
        <span className="text-white font-medium pr-4">{question}</span>
        <svg
          className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-6 py-5 bg-slate-900/20 border-t border-slate-700/50">
          <p className="text-slate-400 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function PricingPage() {
  return (
    <main className="min-h-screen pt-32 pb-24 px-6 lg:px-8">
      <div className="relative z-10 mx-auto max-w-6xl">

        {/* Header */}
        <div className="text-center mb-16 space-y-4 animate-slide-up">
          <h1 className="text-4xl lg:text-6xl font-bold text-white tracking-tight">
            Simple, <span className="text-emerald-500">honest</span> pricing
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Start free. Upgrade when you&apos;re ready. Cancel anytime — we&apos;ll even do it for you if you forget.
          </p>
        </div>

        {/* Pricing Columns */}
        <div className="grid lg:grid-cols-3 gap-8 items-start animate-slide-up" style={{ animationDelay: "0.1s" }}>

          {/* Column 1: Self-Hosted */}
          <div className="relative h-full bg-slate-950/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 flex flex-col hover:border-slate-700 transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-800/10 to-transparent rounded-3xl pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Self-Hosted</h2>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-slate-500 font-medium">/ forever</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                For tinkerers and privacy maximalists
              </p>

              <div className="space-y-4 mb-8 flex-1">
                <div className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-slate-300">Open source codebase</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-slate-300">Bring your own API keys</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-slate-300">Self-hosted (Docker)</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-slate-300">Full data ownership</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-slate-300">Community support</span>
                </div>
              </div>

              <a
                href="https://github.com/jmoraispk/loglife"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto w-full inline-flex items-center justify-center px-4 py-3 bg-transparent hover:bg-slate-800 text-white text-sm font-semibold rounded-xl border border-slate-700 hover:border-slate-600 transition-colors"
              >
                View on GitHub
              </a>
            </div>
          </div>

          {/* Column 2: Hosted — MOST POPULAR */}
          <div className="relative h-full bg-slate-900/60 backdrop-blur-xl border border-emerald-500/40 rounded-3xl flex flex-col overflow-hidden hover:border-emerald-500/60 transition-all duration-300 group">
            {/* Top gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600" />
            {/* MOST POPULAR badge */}
            <div className="absolute top-5 right-5">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 uppercase tracking-wider">
                Most Popular
              </span>
            </div>
            <div className="p-8 flex flex-col h-full">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Hosted</h2>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold text-emerald-400">$19</span>
                <span className="text-slate-500 font-medium">/ mo</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                For most people. We handle everything.
              </p>

              <div className="space-y-4 mb-8 flex-1">
                <div className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-slate-300">Everything in Self-Hosted</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-slate-300">Private hosted instance</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-slate-300">API usage included</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-slate-300">Dashboard &amp; analytics</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-slate-300">D/W/M/Q/Y highlights</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-slate-300">Life telemetry integrations</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-slate-300">Smart reminders</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-slate-300">Access controls &amp; audit logs</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-slate-300">Email support</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-slate-300">Auto-cancel on inactivity</span>
                </div>
              </div>

              <a
                href="/signup"
                className="mt-auto w-full inline-flex items-center justify-center px-4 py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-105"
              >
                Start Your Log
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 3: Unlimited */}
          <div className="relative h-full bg-slate-950/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 flex flex-col hover:border-slate-700 transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-800/10 to-transparent rounded-3xl pointer-events-none" />
            <div className="relative flex flex-col h-full">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Unlimited</h2>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold text-white">$49</span>
                <span className="text-slate-500 font-medium">/ mo</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                For power users who want it all
              </p>

              <div className="space-y-4 mb-8 flex-1">
                <div className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-slate-300">Everything in Hosted</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-slate-300">Unlimited API usage</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-slate-300">Priority support</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-slate-300">Advanced analytics</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-slate-300">Custom integrations</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-slate-300">AI supermemory (BYO keys)</span>
                </div>
              </div>

              <a
                href="/signup"
                className="mt-auto w-full inline-flex items-center justify-center px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl border border-slate-700 transition-colors"
              >
                Start Your Log
              </a>
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="mt-24 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Your <span className="text-emerald-500">privacy</span>, by design
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Different deployment options, same commitment to your privacy.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Private Deploy card */}
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Private Deploy</h3>
                  <p className="text-sm text-slate-500">Self-hosted or your infrastructure</p>
                </div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                <p className="text-slate-300 leading-relaxed">
                  Everything runs in your environment. We can&apos;t see, store, or touch your data. 100% open source — code, docs, website, dashboard. The most private option there is.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm text-teal-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Maximum privacy guarantee</span>
              </div>
            </div>

            {/* Hosted card */}
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
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                <p className="text-slate-300 leading-relaxed">
                  We host it, but your data is still yours. We don&apos;t log message content. We don&apos;t sell data. We don&apos;t train models on your conversations. You can export, delete, or reset your data anytime. If you cancel, everything is automatically deleted after 30 days.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm text-emerald-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>Audit logs &amp; access controls included</span>
              </div>
            </div>
          </div>
        </div>

        {/* Billing Principles Section */}
        <div className="mt-24 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              How we <span className="text-teal-400">bill</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Transparent, fair, and designed to keep you in control.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. No API Markup */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 hover:border-teal-500/30 transition-all duration-200">
              <div className="text-teal-400 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No API Markup</h3>
              <p className="text-sm text-slate-400 leading-relaxed">We don&apos;t resell API keys or add margin on model usage. You pay providers directly at their rates.</p>
            </div>

            {/* 2. Itemized Usage */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 hover:border-teal-500/30 transition-all duration-200">
              <div className="text-teal-400 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Itemized Usage</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Monthly receipts show usage by provider — tokens, minutes, calls — plus our subscription fee. No surprises.</p>
            </div>

            {/* 3. Subscription Covers */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 hover:border-teal-500/30 transition-all duration-200">
              <div className="text-teal-400 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Subscription Covers</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Web hosting, development, monitoring, alerts, audit logs, and support. All infrastructure costs included.</p>
            </div>

            {/* 4. Keys & Data Control */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 hover:border-teal-500/30 transition-all duration-200">
              <div className="text-teal-400 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Keys &amp; Data Control</h3>
              <p className="text-sm text-slate-400 leading-relaxed">BYO keys stay in your environment. For Hosted, keys can be yours or ours — rotate anytime.</p>
            </div>

            {/* 5. No Content Logging */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 hover:border-teal-500/30 transition-all duration-200">
              <div className="text-teal-400 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Content Logging</h3>
              <p className="text-sm text-slate-400 leading-relaxed">We don&apos;t store message content in logs by default. Opt in explicitly only if you need debugging.</p>
            </div>

            {/* 6. Clear Cancellation */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 hover:border-teal-500/30 transition-all duration-200">
              <div className="text-teal-400 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Clear Cancellation</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Cancel anytime. All data deleted 30 days after. No hoops, no guilt.</p>
            </div>

            {/* 7. Inactivity Nudges */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 hover:border-teal-500/30 transition-all duration-200">
              <div className="text-teal-400 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Inactivity Nudges</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Not using LogLife? We&apos;ll reach out to downgrade or cancel — so you never pay for something you&apos;re not using.</p>
            </div>

            {/* 8. Always Your Data */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 hover:border-teal-500/30 transition-all duration-200">
              <div className="text-teal-400 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Always Your Data</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Host anywhere. Export or delete with one click. We can&apos;t see or change your message content.</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-24 animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Frequently asked <span className="text-emerald-500">questions</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Everything you need to know before getting started.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            <FAQItem
              question="Do I need to download an app?"
              answer="Nope. LogLife works through WhatsApp, Telegram, and other chat apps. No app to install."
            />
            <FAQItem
              question="How much time does it take?"
              answer="About five minutes a day. A quick voice note or text at the end of your day. That's the whole ritual."
            />
            <FAQItem
              question="What if I stop using it?"
              answer="We'll notice. After a period of inactivity, we'll email you and offer to pause or cancel. We don't want to charge you for something you're not using."
            />
            <FAQItem
              question="Is my data private?"
              answer="Yes. You can self-host for maximum privacy, or use our hosted version where we don't log message content. Everything is open source — you can verify our claims yourself."
            />
            <FAQItem
              question="Can I export my data?"
              answer="Anytime. One click. And if you cancel, all data is automatically deleted after 30 days."
            />
            <FAQItem
              question="What are D/W/M/Q/Y highlights?"
              answer="Every day, week, month, quarter, and year, AI surfaces the 3–5 things that mattered most. It's like a highlight reel of your life, built automatically."
            />
            <FAQItem
              question="Does LogLife give me advice?"
              answer="Not unless you ask. By default, it's a capture system — it listens, organizes, and shows patterns. If you want a nudge or perspective, just ask."
            />
            <FAQItem
              question="What's the difference between Hosted and Unlimited?"
              answer="Hosted includes generous API usage for most people. Unlimited removes the cap entirely and adds priority support. Both include every feature."
            />
          </div>
        </div>

        {/* CTA Footer */}
        <div className="mt-24 text-center animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <div className="bg-gradient-to-br from-emerald-500/10 to-slate-900/50 border border-emerald-500/20 rounded-3xl p-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to start?
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              Your journal is one conversation away.
            </p>
            <a
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-105"
            >
              Start Your Log
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        </div>

      </div>
    </main>
  );
}
