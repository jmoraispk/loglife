"use client";
import React from "react";

// Modern Hero Section with Dark Theme
function Hero() {
  return (
    <section id="hero" className="relative isolate overflow-hidden pt-16 pb-24 min-h-screen flex items-center">
      
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white leading-tight animate-slide-up">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Deploy & Run OpenClaw</span>{" "}
              <span className="text-red-500">in minutes.</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-slate-300 leading-relaxed animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Know what it costs. Keep control. Auto deploy, monitor, and single cost center across all the APIs your agent touches.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <a 
                href="/signup" 
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white text-base font-semibold rounded-xl hover:from-red-500 hover:to-red-400 transition-all duration-200 transform hover:scale-105 shadow-[0_0_20px_rgba(239,68,68,0.3)] border border-red-400/20"
              >
                Deploy Now
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              
              <a 
                href="#features" 
                className="inline-flex items-center justify-center px-6 py-3 bg-white/5 backdrop-blur-lg text-slate-200 text-base font-semibold rounded-xl hover:bg-white/10 transition-all duration-200 border border-white/10"
              >
                See How It Works
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>
            
            {/* Tech badges */}
            <div className="flex flex-wrap gap-3 pt-6 animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <span className="px-3 py-1.5 bg-slate-800/60 border border-slate-700/50 rounded-full text-sm text-slate-400">
                Powered by OpenClaw
              </span>
              <span className="px-3 py-1.5 bg-slate-800/60 border border-slate-700/50 rounded-full text-sm text-slate-400">
                Tailscale Networking
              </span>
              <span className="px-3 py-1.5 bg-teal-900/40 border border-teal-700/50 rounded-full text-sm text-teal-400 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Vetted Skills Only
              </span>
            </div>
          </div>
          
          {/* Right Column - Illustration */}
          <div className="relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="relative aspect-square rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
              {/* Gradient overlay */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/10 to-teal-500/10 opacity-50" />
              
              {/* Floating cards */}
              <div className="absolute left-8 top-12 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-lg transform -rotate-3 hover:rotate-0 transition-transform">
                <div className="flex items-center gap-2 text-red-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <span className="text-sm font-medium text-slate-200">One-click deploy</span>
                </div>
              </div>
              
              <div className="absolute right-8 top-24 bg-red-600/90 backdrop-blur-md rounded-xl p-4 shadow-lg transform rotate-2 hover:rotate-0 transition-transform border border-red-500/20">
                <p className="text-sm text-white font-medium">&quot;Gateway running ✓&quot;</p>
              </div>
              
              <div className="absolute left-12 bottom-20 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-lg">
                <div className="text-xs text-slate-400 mb-1">API Costs Today</div>
                <div className="text-lg font-bold text-teal-400">$2.47</div>
              </div>
              
              <div className="absolute right-12 bottom-32 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-lg transform rotate-3 hover:rotate-0 transition-transform">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-200">5 skills active</span>
                </div>
              </div>
              
              {/* Central lobster icon placeholder */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-2xl shadow-red-500/50 animate-pulse">
                  <span className="text-4xl">🦞</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Features Section with Cards
function Features() {
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "One-Click Deploy",
      description: "No SSH, no server rental, no networking hassles. We handle VPS, Tailscale, and Gateway setup for you."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Unified Dashboard",
      description: "Access OpenClaw's native monitoring UI plus centralized API cost tracking across all providers."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      title: "Curated Skills",
      description: "Start with 5-10 essential skills instead of 50+ overwhelming options. Add more as you need them."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      title: "OAuth Integrations",
      description: "Connect Gmail, GitHub, and more with OAuth. No manual API key management required."
    }
  ];

  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Everything you need to <span className="text-red-500">deploy</span>
          </h2>
          <p className="text-xl text-slate-400">Skip the DevOps. Get straight to using your AI assistant.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/60 hover:border-red-500/50 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-red-500/20"
            >
              <div className="text-red-400 mb-4 group-hover:scale-110 transition-transform duration-200">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// How It Works Section with Visual Steps
function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Sign up",
      description: "Create your AutoClaw account. Connect your preferred AI provider (Anthropic, OpenAI).",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      number: "2",
      title: "Deploy",
      description: "Click deploy. We provision a server, install OpenClaw, and configure Tailscale networking.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      number: "3",
      title: "Configure skills",
      description: "Choose from curated skills or add your own. Connect OAuth services like Gmail and GitHub.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      number: "4",
      title: "Chat via WebChat",
      description: "Start talking to your agent immediately through the built-in WebChat interface.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      number: "5",
      title: "Monitor & scale",
      description: "Track API costs, monitor usage, and add more channels as you grow.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  return (
    <section id="how-it-works" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">How it works</h2>
          <p className="text-xl text-slate-400">From zero to running agent in 5 minutes</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="relative bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/60 hover:border-red-500/50 transition-all duration-300 fade-in-on-scroll"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-red-400">Step {step.number}</span>
                <div className="text-red-400">{step.icon}</div>
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

// Before/After Comparison Section
function BeforeAfter() {
  return (
    <section id="comparison" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            The <span className="text-red-500">old way</span> vs AutoClaw
          </h2>
          <p className="text-xl text-slate-400">What you had to do before, and what we handle for you</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Before */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-slate-400 mb-6 flex items-center gap-2">
              <span className="text-red-400">✗</span> Manual Setup
            </h3>
            <ul className="space-y-4">
              {[
                "Rent, configure and manage a VPS",
                "Setup SSH, accounts, dependencies, and networking",
                "Clone and best-effort build OpenClaw",
                "Track API costs manually across providers",
                "Juggle 20+ API keys across providers",
                "Security risks from unmanaged community skills",
                "Brittle updates prone to data-loss",
                "Limited memory bounded by context",
                "Possibly debugging for hours"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-400">
                  <svg className="w-5 h-5 text-slate-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* After */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-red-500/30 rounded-2xl p-8 shadow-lg shadow-red-500/10">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-teal-400">✓</span> With AutoClaw
            </h3>
            <ul className="space-y-4">
              {[
                "Managed cloud hosting with pay-as-you-go pricing",
                "One-click deploy with optimized defaults",
                "Stable and validated OpenClaw setup",
                "Unified cost dashboard",
                "BYO keys or use ours at volume pricing",
                "Install only secure and vetted skills",
                "Zero-surprise upgrades",
                "Supermemory for weeks of context",
                "Ready in minutes"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-white">
                  <svg className="w-5 h-5 text-teal-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}


// Main export component
export default function AutoClawHero() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <HowItWorks />
      <BeforeAfter />
    </main>
  );
}
