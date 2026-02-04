"use client";
import React from "react";

// Channel data with setup requirements
const channels = [
  { name: "WebChat", icon: "💬", status: "ready", description: "Built-in chat interface, works immediately" },
  { name: "WhatsApp", icon: "📱", status: "setup", description: "Via Baileys, requires QR code pairing" },
  { name: "Telegram", icon: "✈️", status: "setup", description: "Requires bot token from BotFather" },
  { name: "Discord", icon: "🎮", status: "setup", description: "Requires Discord bot token" },
  { name: "Slack", icon: "💼", status: "setup", description: "Requires Slack app + bot tokens" },
  { name: "Signal", icon: "🔒", status: "setup", description: "Requires signal-cli setup" },
  { name: "iMessage", icon: "🍎", status: "setup", description: "macOS only, requires Messages app" },
  { name: "Google Chat", icon: "📧", status: "setup", description: "Requires Google Workspace setup" },
  { name: "MS Teams", icon: "🏢", status: "setup", description: "Requires Teams app + Bot Framework" },
  { name: "Matrix", icon: "🔷", status: "setup", description: "Open protocol, requires homeserver" },
];

// Skills data
const skills = [
  { name: "GitHub", category: "Development", description: "Manage repos, PRs, issues" },
  { name: "Gmail", category: "Communication", description: "Read, send, and manage emails" },
  { name: "Calendar", category: "Productivity", description: "Schedule and manage events" },
  { name: "Weather", category: "Utility", description: "Get weather forecasts" },
  { name: "Coding Agent", category: "Development", description: "Write and edit code" },
  { name: "Browser", category: "Utility", description: "Browse the web, take screenshots" },
  { name: "Notes", category: "Productivity", description: "Apple Notes, Obsidian, Notion" },
  { name: "Reminders", category: "Productivity", description: "Apple Reminders, Things" },
];

// Platform features
const platformFeatures = [
  {
    title: "Voice & Speech",
    description: "Voice Wake, Talk Mode, and TTS for hands-free interaction",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    title: "Browser Control",
    description: "Automated web browsing with screenshots and actions",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
  },
  {
    title: "Cron & Automation",
    description: "Scheduled tasks, webhooks, and Gmail triggers",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Multi-Platform",
    description: "macOS app, iOS node, Android node for device actions",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Canvas & UI",
    description: "Live visual workspace controlled by your agent",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    title: "Multi-Agent",
    description: "Route channels to different agents, coordinate work",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

function ChannelBadge({ status }: { status: string }) {
  if (status === "ready") {
    return (
      <span className="px-2 py-0.5 text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full">
        Ready
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 text-xs font-medium bg-slate-700/50 text-slate-400 border border-slate-600/50 rounded-full">
      Setup required
    </span>
  );
}

export default function FeaturesPage() {
  return (
    <main className="min-h-screen pt-32 pb-24 px-6 lg:px-8">
      <div className="relative z-10 mx-auto max-w-6xl">
        
        {/* Header */}
        <div className="text-center mb-20 animate-slide-up">
          <h1 className="text-4xl lg:text-6xl font-bold text-white tracking-tight mb-6">
            Powered by <span className="text-red-500">OpenClaw</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            AutoClaw deploys and manages OpenClaw—a powerful personal AI assistant with 
            20+ channels, 50+ skills, and multi-platform support.
          </p>
        </div>

        {/* Channels Section */}
        <section className="mb-24 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Channels</h2>
              <p className="text-slate-400">Chat with your agent from anywhere</p>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                <span className="text-slate-400">Works out of the box</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                <span className="text-slate-400">Requires setup</span>
              </div>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {channels.map((channel) => (
              <div 
                key={channel.name}
                className={`bg-slate-900/40 backdrop-blur-md border rounded-xl p-4 transition-all duration-200 hover:scale-105 ${
                  channel.status === "ready" 
                    ? "border-teal-500/30 hover:border-teal-500/50" 
                    : "border-slate-700/50 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{channel.icon}</span>
                  <ChannelBadge status={channel.status} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{channel.name}</h3>
                <p className="text-xs text-slate-500">{channel.description}</p>
              </div>
            ))}
          </div>
          
          <p className="mt-6 text-sm text-slate-500 text-center">
            + Zalo, BlueBubbles, Nostr, Mattermost, Nextcloud Talk, and more via OpenClaw extensions
          </p>
        </section>

        {/* Skills Section */}
        <section className="mb-24 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-white">Skills</h2>
              <span className="px-2.5 py-1 text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                All vetted for security
              </span>
            </div>
            <p className="text-slate-400">Curated integrations reviewed by our team—no unverified community code</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {skills.map((skill) => (
              <div 
                key={skill.name}
                className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-5 hover:border-red-500/30 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">{skill.name}</h3>
                  <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">{skill.category}</span>
                </div>
                <p className="text-sm text-slate-400">{skill.description}</p>
              </div>
            ))}
          </div>
          
          <p className="mt-6 text-sm text-slate-500 text-center">
            50+ skills available including 1Password, Spotify, Trello, Sonos, Hue lights, and more
          </p>
        </section>

        {/* Platform Features */}
        <section className="mb-24 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Platform Features</h2>
            <p className="text-slate-400">Everything OpenClaw offers, deployed by AutoClaw</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformFeatures.map((feature, index) => (
              <div 
                key={index}
                className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 hover:border-red-500/30 transition-all duration-200"
              >
                <div className="text-red-400 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What AutoClaw Adds */}
        <section className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <div className="bg-gradient-to-br from-red-500/10 to-slate-900/50 border border-red-500/20 rounded-3xl p-8 md:p-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-2">What AutoClaw Adds</h2>
              <p className="text-slate-400">On top of OpenClaw's features</p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { title: "One-Click Deploy", description: "No SSH, no server setup. We handle everything.", icon: "M5 13l4 4L19 7" },
                { title: "Vetted Skills", description: "Every skill reviewed for security. No unverified code.", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
                { title: "Cost Dashboard", description: "Track API usage across all providers in one place.", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
                { title: "Managed Updates", description: "We keep your OpenClaw instance up to date.", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
                { title: "Support", description: "Direct access to our team when you need help.", icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.description}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-10 text-center">
              <a 
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all transform hover:scale-105"
              >
                Deploy Now
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
