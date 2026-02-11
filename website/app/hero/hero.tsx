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
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Private AI Assistants.</span>{" "}
              <span className="text-emerald-500">Automatic Deployment.</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-slate-300 leading-relaxed animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Audio-first. Chat-native. Your progress visualized.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <a 
                href="/signup" 
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-base font-semibold rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition-all duration-200 transform hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/20"
              >
                Start Your Log
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              
              <a 
                href="#features" 
                className="inline-flex items-center justify-center px-6 py-3 bg-white/5 backdrop-blur-lg text-slate-200 text-base font-semibold rounded-xl hover:bg-white/10 transition-all duration-200 border border-white/10"
              >
                Learn More
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>
            
            {/* Platform badges */}
            <div className="flex flex-wrap gap-3 pt-6 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            </div>
          </div>
          
          {/* Right Column - Illustration */}
          <div className="relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="relative aspect-square rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
              {/* AI Assistant visualization */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent opacity-50" />
              
              {/* Floating cards */}
              <div className="absolute left-8 top-12 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-lg transform -rotate-3 hover:rotate-0 transition-transform">
                <div className="flex items-center gap-2 text-emerald-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span className="text-sm font-medium text-slate-200">Voice logging</span>
                </div>
              </div>
              
              <div className="absolute right-8 top-24 bg-emerald-600/90 backdrop-blur-md rounded-xl p-4 shadow-lg transform rotate-2 hover:rotate-0 transition-transform border border-emerald-500/20">
                <p className="text-sm text-white font-medium">&quot;Slept at 11 PM ✓&quot;</p>
              </div>
              
              <div className="absolute left-12 bottom-20 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-lg">
                <div className="text-xs text-slate-400 mb-1">Progress</div>
                <div className="text-lg font-bold text-emerald-400">87%</div>
              </div>
              
              <div className="absolute right-12 bottom-32 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-lg transform rotate-3 hover:rotate-0 transition-transform">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-200">Patterns found</span>
                </div>
              </div>
              
              {/* Central AI icon */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/50 animate-pulse">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
      title: "Voice & Audio Logging",
      description: "Record thoughts, track progress. Fast, hands-free entries that fit into your busy life."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title: "Multi-Channel Support",
      description: "WhatsApp, Telegram, more coming soon. Journal where you already chat."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "AI-Powered Insights",
      description: "Patterns → Progress. Discover connections between your habits and outcomes."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: "Private & Secure",
      description: "Your data stays yours. Private by default. Export anytime, delete anytime."
    }
  ];

  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Everything you need to <span className="text-emerald-500">grow</span>
          </h2>
          <p className="text-xl text-slate-400">Simple, powerful tools for tracking and reflection</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/60 hover:border-emerald-500/50 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/20"
            >
              <div className="text-emerald-400 mb-4 group-hover:scale-110 transition-transform duration-200">
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
      title: "Add habits",
      description: "Define what to track (e.g., 'Bed by 11pm', '7:00 AM workout').",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )
    },
    {
      number: "2",
      title: "Boost your habit",
      description: "Tell your WHYs, schedule it, and understand triggers & environment.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      number: "3",
      title: "Log by voice or text",
      description: "Reply with a quick voice note or message.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )
    },
    {
      number: "4",
      title: "We surface patterns",
      description: "AI transcribes and tags entries, finding connections in your data.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      number: "5",
      title: "Ask anything",
      description: "Query your data in plain language. See patterns and feel the progress.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      )
    }
  ];

  return (
    <section id="how-it-works" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">How it works</h2>
          <p className="text-xl text-slate-400">Simple steps to better habits</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="relative bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/60 hover:border-emerald-500/50 transition-all duration-300 fade-in-on-scroll"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-emerald-400">Step {step.number}</span>
                <div className="text-emerald-400">{step.icon}</div>
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
            The <span className="text-emerald-500">old way</span> vs LogLife
          </h2>
          <p className="text-xl text-slate-400">Scattered notes and forgotten goals—or one place that gets you</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Before */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-slate-400 mb-6 flex items-center gap-2">
              <span className="text-emerald-400">✗</span> Manual Setup
            </h3>
            <ul className="space-y-4">
              {[
                "Notes in 10 different apps",
                "New Year's resolutions forgotten by February",
                "No link between sleep, mood, and habits",
                "Journaling feels like homework",
                "Hard to see if you're actually improving",
                "Voice memos that never get transcribed",
                "Data locked in silos",
                "No one place to ask: “How did I do?”"
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
          <div className="bg-slate-900/60 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-8 shadow-lg shadow-emerald-500/10">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-emerald-400">✓</span> With LogLife
            </h3>
            <ul className="space-y-4">
              {[
                "One place for habits, voice notes, and chat",
                "Streaks and reminders that keep you consistent",
                "AI surfaces patterns: sleep → mood → workouts",
                "Log in seconds by voice or text",
                "Progress views and simple reports",
                "Transcription and search built in",
                "Your data in one place, export anytime",
                "Ask in plain language: “How many on-time bedtimes last week?”"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-white">
                  <svg className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
export default function LogLifeHero() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <HowItWorks />
      <BeforeAfter />
    </main>
  );
}
