"use client";
import React from "react";

// --- Components ---

function CheckIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function PricingPage() {
  return (
    <main className="min-h-screen pt-32 pb-24 px-6 lg:px-8">

      <div className="relative z-10 mx-auto max-w-6xl">
        
        {/* Header */}
        <div className="text-center mb-16 space-y-4 animate-slide-up">
          <h1 className="text-4xl lg:text-6xl font-bold text-white tracking-tight">
            Pricing that <span className="text-emerald-500">adapts</span> to you
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Start with our open-source self-hosted version, 
            or let LogLife handle everything so you can focus on journaling.
          </p>
        </div>

        {/* 3-Tier Pricing Grid */}
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* TIER 1: FREE / Self-Hosted */}
          <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="relative h-full bg-slate-950/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 flex flex-col hover:border-slate-700 transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-b from-slate-800/10 to-transparent rounded-3xl pointer-events-none" />
              
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Self-Hosted</h2>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">Free</span>
                  <span className="text-slate-500 font-medium">/ forever</span>
                </div>
                <p className="text-slate-400 text-sm mt-4 leading-relaxed">
                  Full control. You host LogLife yourself. Open source, bring your own keys.
                </p>
              </div>

              <div className="space-y-4 mb-8 flex-1">
                {[
                  "LogLife open source",
                  "Self-hosted (Docker/Node)",
                  "Own your data 100%",
                  "Bring your own API keys",
                  "Community support",
                  "All core features included"
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
          </div>

          {/* TIER 2: HOSTED / $19/mo */}
          <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="relative h-full bg-slate-900/60 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-8 flex flex-col shadow-lg shadow-emerald-500/10 transition-all duration-300 group">
              {/* Highlight Border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 rounded-t-3xl" />
              
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                    MOST POPULAR
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Hosted</h2>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">$19</span>
                  <span className="text-slate-500 font-medium">/ month</span>
                </div>
                <p className="text-slate-400 text-sm mt-4 leading-relaxed">
                  We handle the infrastructure. Private by default, included API usage, dashboard access.
                </p>
              </div>

              <div className="space-y-4 mb-8 flex-1">
                {[
                  "Hosted private instance",
                  "Private by default — no content logging",
                  "Included API usage (up to fair use)",
                  "Full dashboard access",
                  "All integrations included",
                  "Email support",
                  "Automatic updates"
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-slate-300">
                    <CheckIcon className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>

              <a 
                href="/signup"
                className="w-full inline-flex items-center justify-center px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-105"
              >
                Start Journaling
              </a>
            </div>
          </div>

          {/* TIER 3: UNLIMITED / $49/mo */}
          <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <div className="relative h-full bg-slate-950/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 flex flex-col hover:border-slate-700 transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-b from-slate-800/10 to-transparent rounded-3xl pointer-events-none" />
              
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Unlimited</h2>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">$49</span>
                  <span className="text-slate-500 font-medium">/ month</span>
                </div>
                <p className="text-slate-400 text-sm mt-4 leading-relaxed">
                  Unlimited API usage, priority support, and everything in Hosted.
                </p>
              </div>

              <div className="space-y-4 mb-8 flex-1">
                {[
                  "Everything in Hosted",
                  "Unlimited API usage",
                  "Priority support",
                  "Early access to new features",
                  "Custom AI personality tuning",
                  "Advanced analytics & exports",
                  "Dedicated infrastructure"
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-slate-300">
                    <CheckIcon className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>

              <a 
                href="/signup"
                className="w-full inline-flex items-center justify-center px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl border border-slate-700 transition-colors"
              >
                Get Unlimited
              </a>
            </div>
          </div>
        </div>
        
        {/* Billing Principles Section */}
        <div className="mt-24 animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              How we <span className="text-teal-400">bill</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Transparent, fair, and designed to keep you in control.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "No API Markup",
                description: "We don't resell API keys or add margin on model usage. You pay providers directly at their rates."
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                ),
                title: "Itemized Usage",
                description: "Monthly receipts show usage by provider — tokens, minutes, calls — plus our subscription fee. No surprises."
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ),
                title: "Clear Cancellation",
                description: "Cancel any time. No lock-in, no hidden fees. Data auto-deleted 30 days after cancellation."
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                ),
                title: "Auto-Cancel on Inactivity",
                description: "Not using LogLife? We'll warn you, then auto-cancel your subscription. You never pay for nothing."
              },
            ].map((item, index) => (
              <div 
                key={index}
                className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 hover:border-teal-500/30 transition-all duration-200"
              >
                <div className="text-teal-400 mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Section */}
        <div className="mt-24 animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Your <span className="text-emerald-500">privacy</span>, by design
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Different deployment options, same commitment to your privacy.
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
                  <p className="text-sm text-slate-500">Self-hosted or your infrastructure</p>
                </div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                <p className="text-slate-300 leading-relaxed">
                  We are <span className="text-white font-medium">not able to see, store, or modify</span> your journal content. All processing happens in your environment; we only receive aggregate usage metrics.
                </p>
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
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                <p className="text-slate-300 leading-relaxed">
                  We <span className="text-white font-medium">don&apos;t store or log journal content</span> by default. We don&apos;t sell data. We design it so we don&apos;t have access by design. Users can export, delete, or reset anytime.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm text-emerald-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>No content logging · export/delete anytime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-20 text-center animate-slide-up" style={{ animationDelay: "0.6s" }}>
          <p className="text-slate-500 text-sm">
            Powered by LogLife · Open Source · Your Data, Your Control
          </p>
        </div>

      </div>
    </main>
  );
}
