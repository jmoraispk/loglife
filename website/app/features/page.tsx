"use client";
import React from "react";

// Channel icons as SVG components
const ChannelIcons = {
  WebChat: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
    </svg>
  ),
  WhatsApp: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  Telegram: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#0088cc">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  ),
  Discord: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#5865F2">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
    </svg>
  ),
  Slack: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>
      <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/>
      <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#2EB67D"/>
      <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#ECB22E"/>
    </svg>
  ),
  Signal: (
    <img src="/logos/signal.png" alt="Signal" className="w-6 h-6 object-contain" />
  ),
  iMessage: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#34C759">
      <path d="M12 2C6.477 2 2 5.813 2 10.5c0 2.61 1.432 4.936 3.666 6.45-.188.606-.502 1.55-1.008 2.573-.092.186-.03.41.143.52a.44.44 0 0 0 .537-.05c1.418-1.285 2.344-1.835 2.926-2.09A11.33 11.33 0 0 0 12 19c5.523 0 10-3.813 10-8.5S17.523 2 12 2z"/>
    </svg>
  ),
  GoogleChat: (
    <img src="/logos/google-chat.png" alt="Google Chat" className="w-6 h-6 object-contain" />
  ),
  MSTeams: (
    <img src="/logos/ms-teams.png" alt="MS Teams" className="w-8 h-8 object-contain" />
  ),
  Matrix: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M.632.55v22.9H2.28V24H0V0h2.28v.55zm7.043 7.26v1.157h.033c.309-.443.683-.784 1.117-1.024.433-.245.936-.365 1.5-.365.54 0 1.033.107 1.481.314.448.208.785.582 1.02 1.108.254-.374.6-.706 1.034-.992.434-.287.95-.43 1.546-.43.453 0 .872.056 1.26.167.388.11.716.286.993.53.276.245.489.559.646.951.152.392.23.863.23 1.417v5.728h-2.349V11.52c0-.286-.01-.559-.032-.812a1.755 1.755 0 0 0-.18-.66 1.106 1.106 0 0 0-.438-.448c-.194-.11-.457-.166-.785-.166-.332 0-.6.064-.803.189a1.38 1.38 0 0 0-.48.499 1.946 1.946 0 0 0-.231.696 5.56 5.56 0 0 0-.06.785v4.768h-2.35v-4.8c0-.254-.004-.503-.018-.752a2.074 2.074 0 0 0-.143-.688 1.052 1.052 0 0 0-.415-.503c-.194-.125-.476-.19-.854-.19-.111 0-.259.024-.439.074-.18.051-.36.143-.53.282-.171.138-.319.33-.439.58-.12.252-.18.57-.18.958v5.04H4.78V7.81zm15.693 15.64V.55H21.72V0H24v24h-2.28v-.55z"/>
    </svg>
  ),
};

// Channel data with setup requirements
const channels = [
  { name: "WebChat", icon: "WebChat", status: "ready", description: "Built-in chat interface, works immediately" },
  { name: "WhatsApp", icon: "WhatsApp", status: "setup", description: "Via Baileys, requires QR code pairing" },
  { name: "Telegram", icon: "Telegram", status: "setup", description: "Requires bot token from BotFather" },
  { name: "Discord", icon: "Discord", status: "setup", description: "Requires Discord bot token" },
  { name: "Slack", icon: "Slack", status: "setup", description: "Requires Slack app + bot tokens" },
  { name: "Signal", icon: "Signal", status: "setup", description: "Requires signal-cli setup" },
  { name: "iMessage", icon: "iMessage", status: "setup", description: "macOS only, requires Messages app" },
  { name: "Google Chat", icon: "GoogleChat", status: "setup", description: "Requires Google Workspace setup" },
  { name: "MS Teams", icon: "MSTeams", status: "setup", description: "Requires Teams app + Bot Framework" },
  { name: "Matrix", icon: "Matrix", status: "setup", description: "Open protocol, requires homeserver" },
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
                  <span className="text-2xl">{ChannelIcons[channel.icon as keyof typeof ChannelIcons]}</span>
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
              <p className="text-slate-400">On top of OpenClaw&apos;s features</p>
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
