"use client";
import React from "react";

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
            or let LogLife handle the infrastructure for you.
          </p>
        </div>

        {/* 2-Column Pricing Grid */}
        <div className="grid lg:grid-cols-2 gap-6 items-start max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>

          {/* Column 1: Self-Hosted (Free) */}
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
                "Self-hosted (Docker)",
                "Own your data 100%",
                "Community support",
                "Clone from LogLife repo",
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

          {/* Column 2: Hosted ($19/mo) -- MOST POPULAR */}
          <div className="relative bg-slate-900/60 backdrop-blur-xl border-2 border-emerald-500/40 rounded-3xl overflow-hidden flex flex-col hover:border-emerald-500/60 transition-all duration-300 group shadow-lg shadow-emerald-500/10">
            {/* Top gradient bar */}
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
                    Most Popular
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">Hosted</h2>
                <p className="text-sm text-slate-500 mb-4">For most users</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-emerald-400">$19</span>
                  <span className="text-slate-500 font-medium">/ mo</span>
                </div>
              </div>

              <div className="space-y-4 mb-8 flex-1">
                {[
                  "Everything in Self-Hosted, plus:",
                  "Hosted private instance",
                  "No content logging",
                  "API usage included (up to limit)",
                  "Dashboard access",
                  "Life telemetry integrations",
                  "Smart reminders",
                  "AI highlights (D/W/M/Q/Y)",
                  "Access controls & audit logs",
                  "Email support",
                  "Auto-cancel on inactivity",
                ].map((item, index) => (
                  <div key={item} className="flex items-start gap-3 text-slate-300">
                    <CheckIcon className={`w-5 h-5 mt-0.5 shrink-0 ${index === 0 ? "text-emerald-400" : "text-emerald-500/70"}`} />
                    <span className={`text-sm ${index === 0 ? "font-medium text-emerald-400" : ""}`}>{item}</span>
                  </div>
                ))}
              </div>

              <a 
                href="/signup"
                className="w-full inline-flex items-center justify-center px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-105"
              >
                Start Your Log
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
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
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "No API Markup",
                description: "We don\u2019t resell API keys or add margin on model usage. You pay providers directly at their rates."
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                ),
                title: "Itemized Usage",
                description: "Monthly receipts show usage by provider\u2014tokens, minutes, calls\u2014plus our subscription fee. No surprises."
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                ),
                title: "Keys & Data Control",
                description: "BYO keys stay in your environment. For Hosted, keys can be yours or ours\u2014rotate anytime."
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ),
                title: "No Content Logging",
                description: "We don\u2019t store message content in logs by default. Opt in explicitly only if you need debugging."
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ),
                title: "Clear Cancellation",
                description: "Cancel any time. No lock-in, no hidden fees. All data automatically deleted 30 days after cancellation."
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                ),
                title: "Inactivity Nudges",
                description: "No usage for a while? We\u2019ll warn you, then auto-cancel the subscription if the service isn\u2019t being used. We only want you paying if you\u2019re getting value."
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                ),
                title: "Always Your Data",
                description: "Host anywhere. Export or delete with one click. We can\u2019t see or change your message content."
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                ),
                title: "Subscription Covers",
                description: "Web hosting, development, monitoring, alerts, audit logs, and support. All infrastructure costs included."
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
        <div className="mt-24 animate-slide-up" style={{ animationDelay: "0.4s" }}>
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
                    We don&apos;t sell data. We design it so we <span className="text-white font-medium">don&apos;t have access to it by design</span>. However, in theory, since we operate the server, we could access it. But we don&apos;t. We only care about usage metadata.
                  </p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                  <p className="text-slate-300 leading-relaxed">
                    Users can <span className="text-white font-medium">export/delete/reset anytime</span>. All data is automatically deleted 30 days after a subscription is canceled. It&apos;s possible to delete all data without deleting the account (called a brain reset).
                  </p>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm text-emerald-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>Goal: &ldquo;no access by design&rdquo; &amp; no model training on user data</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Footer */}
        <div className="mt-24 text-center animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <div className="bg-gradient-to-br from-emerald-500/10 to-slate-900/50 border border-emerald-500/20 rounded-3xl p-12">
            <h3 className="text-3xl font-bold text-white mb-4">Ready to start capturing your life?</h3>
            <p className="text-emerald-400 text-lg mb-8">We handle the infrastructure. You focus on what matters.</p>
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

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm">
            Powered by LogLife &middot; Open Source &middot; Your Data, Your Control
          </p>
        </div>

      </div>
    </main>
  );
}
