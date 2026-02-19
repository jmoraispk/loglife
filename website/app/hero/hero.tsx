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
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Your Life,</span>{" "}
              <span className="text-emerald-500">Captured.</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-slate-300 leading-relaxed animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Nobody can tell you what they did last Tuesday. It&apos;s not a memory issue&mdash;it&apos;s a capture issue. LogLife turns your daily conversations into a timeline of your life.
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
                <p className="text-sm text-white font-medium">&quot;Ran 5K this morning&quot;</p>
              </div>
              
              <div className="absolute left-12 bottom-20 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-lg">
                <div className="text-xs text-slate-400 mb-1">Weekly Highlights</div>
                <div className="text-lg font-bold text-emerald-400">3 of 5</div>
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title: "No app to download",
      description: "LogLife lives where you already chat. WhatsApp, Telegram, or plain SMS. No new app, no new habit to build."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
      title: "Just talk",
      description: "Send a voice note about your day. Or type a few words. AI handles the rest — transcription, tagging, organizing. Zero friction."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      title: "Your highlights, every week",
      description: "Every day, week, month, quarter, and year, LogLife surfaces your 3–5 most important moments. A timeline of what actually mattered."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "Private by default",
      description: "Open source. Self-hostable. We designed it so we can't see your data. Export everything, delete anytime, no questions asked."
    }
  ];

  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            A simpler way to <span className="text-emerald-500">know yourself</span>
          </h2>
          <p className="text-xl text-slate-400">Four ideas that make LogLife different</p>
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
      title: "Talk to LogLife",
      description: "Send a voice note or text about your day through your favorite chat app. A short reflection at the end of the day is all you need.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )
    },
    {
      number: "2",
      title: "AI captures everything",
      description: "LogLife transcribes, tags, and organizes. No buttons, no mood ratings, no structured input. Just your words.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      number: "3",
      title: "Your highlights emerge",
      description: "AI surfaces the 3\u20135 most important things from your day, week, month, quarter, and year.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    },
    {
      number: "4",
      title: "Explore your dashboard",
      description: "Visualize patterns, track habits, and see your progress over time. Chat is the input; the dashboard is the output.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      number: "5",
      title: "Ask anything",
      description: "Query your life data in plain language: \u2018How many on-time bedtimes last week?\u2019 \u2018What were my top 3 achievements this month?\u2019",
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
          <p className="text-xl text-slate-400">Capture your life in five simple steps</p>
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
            The <span className="text-emerald-500">old way</span> vs. LogLife
          </h2>
          <p className="text-xl text-slate-400">Scattered notes and forgotten goals — or one place that actually gets you</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Before */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-slate-400 mb-6 flex items-center gap-2">
              <span className="text-emerald-400">✗</span> Without LogLife
            </h3>
            <ul className="space-y-4">
              {[
                "Can't remember what you did last Tuesday",
                "Resolutions that don't survive January",
                "Thoughts in 10 different apps, none connected",
                "Voice memos you never listen to again",
                "No idea if you're actually improving",
                "Journaling that feels like homework"
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
                "Your whole week, reconstructed from one conversation",
                "Weekly highlights that keep your goals alive",
                "Everything in one place, linked by AI",
                "Voice notes transcribed, tagged, searchable",
                "Charts and patterns that show real progress",
                "Just talk. That's the whole journal."
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

// Quotes Section
function Quotes() {
  const quotes = [
    {
      text: "You do not rise to the level of your goals. You fall to the level of your systems.",
      author: "James Clear",
      tagline: "LogLife is the system."
    },
    {
      text: "The unexamined life is not worth living.",
      author: "Socrates",
      tagline: "We think he'd have liked voice notes."
    },
    {
      text: "Every action you take is a vote for the type of person you wish to become.",
      author: "James Clear",
      tagline: "LogLife helps you count the votes."
    }
  ];

  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="space-y-12">
          {quotes.map((quote, index) => (
            <div 
              key={index} 
              className="relative pl-8 border-l-2 border-emerald-500/40"
            >
              <p className="text-2xl lg:text-3xl font-light text-white/90 italic leading-relaxed mb-4">
                &ldquo;{quote.text}&rdquo;
              </p>
              <p className="text-sm text-slate-500 mb-2">— {quote.author}</p>
              <p className="text-sm text-slate-400 font-medium">{quote.tagline}</p>
            </div>
          ))}
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
      <Quotes />
    </main>
  );
}
