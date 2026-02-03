"use client";
import React, { useState } from "react";

// --- Components ---

function CheckIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}


// Modern Switch Component
function Switch({ 
  options, 
  selected, 
  onChange 
}: { 
  options: [string, string]; 
  selected: string; 
  onChange: (val: string) => void;
}) {
  return (
    <div className="relative flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700/50 w-fit">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`relative z-10 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer ${
            selected === option 
              ? "text-white bg-slate-700 shadow-sm border border-slate-600/50" 
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

// Pricing Item Row
function PricingItem({
  title,
  description,
  price,
  action,
  isOptional = false,
}: {
  title: string;
  description?: string;
  price: string;
  action: React.ReactNode;
  isOptional?: boolean;
}) {
  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-900/30 border border-transparent hover:border-slate-700/50 hover:bg-slate-900/50 transition-all duration-200 gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-slate-200 font-medium">{title}</span>
          {isOptional && (
            <span className="text-[10px] uppercase tracking-wider text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
              Optional
            </span>
          )}
        </div>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      
      <div className="flex items-center justify-between sm:justify-end gap-6 min-w-[200px]">
        <div className="flex-shrink-0">
          {action}
        </div>
        <div className="text-right min-w-[70px]">
          <span className="block text-sm font-semibold text-white">{price}</span>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  // State for toggles
  const [hostType, setHostType] = useState<"DIY" | "Assisted">("Assisted");
  const [cloudType, setCloudType] = useState<"Isolated" | "Shared">("Isolated");
  const [aiBrainType, setAiBrainType] = useState<"Fixed" | "Usage">("Fixed");
  const [aiMemType, setAiMemType] = useState<"Fixed" | "Usage">("Usage");
  const [supportEnabled, setSupportEnabled] = useState(true);
  const [metricsEnabled, setMetricsEnabled] = useState(true);

  return (
    <main className="min-h-screen pt-32 pb-24 px-6 lg:px-8">

      <div className="relative z-10 mx-auto max-w-6xl">
        
        {/* Header */}
        <div className="text-center mb-16 space-y-4 animate-slide-up">
          <h1 className="text-4xl lg:text-6xl font-bold text-white tracking-tight">
            Pricing that <span className="text-red-500">adapts</span> to you
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Start with our open-source self-hosted version, 
            or let AutoClaw handle the infrastructure for you.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: FREE / DIY */}
          <div className="lg:col-span-4 space-y-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
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
                  <span className="text-4xl font-bold text-white">$0</span>
                  <span className="text-slate-500 font-medium">/ forever</span>
                </div>
                <p className="text-slate-400 text-sm mt-4 leading-relaxed">
                  Full control. You host OpenClaw yourself. The code is open source.
                </p>
              </div>

              <div className="space-y-4 mb-8 flex-1">
                {[
                  "OpenClaw open source",
                  "Self-hosted (Docker/Node)",
                  "Own your data 100%",
                  "Bring your own API keys",
                  "Community support"
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-slate-300">
                    <CheckIcon className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>

              <a 
                href="https://github.com/openclaw/openclaw" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl border border-slate-700 transition-colors"
              >
                View OpenClaw on GitHub
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN: MANAGED */}
          <div className="lg:col-span-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden">
              {/* Highlight Border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-400 to-red-600" />
              
              <div className="p-8 sm:p-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 pb-8 border-b border-slate-800">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      AutoClaw Managed
                      <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold border border-red-500/20">
                        RECOMMENDED
                      </span>
                    </h2>
                    <p className="text-slate-400 mt-2">Modular pricing. Pick exactly what you need.</p>
                  </div>
                  <div className="text-right mt-4 sm:mt-0 hidden sm:block">
                    <p className="text-sm text-slate-500">Starting from</p>
                    <p className="text-3xl font-bold text-red-400">$5<span className="text-lg text-slate-500 font-normal">/mo</span></p>
                  </div>
                </div>

                <div className="space-y-10">
                  
                  {/* Section: Hosting */}
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 ml-1">Hosting & Setup</h3>
                    <div className="space-y-3">
                      <PricingItem 
                        title="Setup Assistance"
                        description="One-time setup fee for your private instance"
                        price="$5 once"
                        action={
                          <Switch 
                            options={["DIY", "Assisted"]} 
                            selected={hostType}
                            onChange={(v) => setHostType(v as "DIY" | "Assisted")}
                          />
                        }
                      />
                      <PricingItem 
                        title="Cloud Hosting"
                        description="Isolated OpenClaw instance managed by us"
                        price="$10 / mo"
                        action={
                          <Switch 
                            options={["Shared", "Isolated"]} 
                            selected={cloudType}
                            onChange={(v) => setCloudType(v as "Isolated" | "Shared")}
                          />
                        }
                      />
                    </div>
                  </section>

                  {/* Section: Intelligence */}
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 ml-1">Intelligence (API)</h3>
                    <div className="space-y-3">
                      <PricingItem 
                        title="AI Models"
                        description="Anthropic, OpenAI, and other LLM providers"
                        price={aiBrainType === "Fixed" ? "$15 / mo" : "Metered"}
                        action={
                          <Switch 
                            options={["Usage", "Fixed"]} 
                            selected={aiBrainType}
                            onChange={(v) => setAiBrainType(v as "Fixed" | "Usage")}
                          />
                        }
                      />
                      <PricingItem 
                        title="AI Memory"
                        description="Long-term vector storage for context"
                        price={aiMemType === "Fixed" ? "Included" : "$0.01 / msg"}
                        action={
                          <Switch 
                            options={["Usage", "Fixed"]} 
                            selected={aiMemType}
                            onChange={(v) => setAiMemType(v as "Fixed" | "Usage")}
                          />
                        }
                      />
                      {/* Third party note */}
                      <div className="px-4 py-2 text-xs text-slate-500 italic text-right">
                        * Third-party APIs (Deepgram, ElevenLabs) billed at cost
                      </div>
                    </div>
                  </section>

                  {/* Section: Services */}
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 ml-1">Services</h3>
                    <div className="space-y-3">
                      <PricingItem 
                        title="Premium Support"
                        description="Direct line to developers"
                        price="$5 / mo"
                        isOptional
                        action={
                          <button 
                            onClick={() => setSupportEnabled(!supportEnabled)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none cursor-pointer ${supportEnabled ? 'bg-red-600' : 'bg-slate-700'}`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${supportEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                        }
                      />
                      <PricingItem 
                        title="Cost Dashboard"
                        description="Unified API cost tracking across all providers"
                        price="$3 / mo"
                        isOptional
                        action={
                          <button 
                            onClick={() => setMetricsEnabled(!metricsEnabled)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none cursor-pointer ${metricsEnabled ? 'bg-red-600' : 'bg-slate-700'}`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${metricsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                        }
                      />
                    </div>
                  </section>

                </div>

                {/* CTA Footer */}
                <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-6">
                  <div className="text-center sm:text-left">
                    <p className="text-slate-400 text-sm">Ready to deploy your AI assistant?</p>
                    <p className="text-red-400 text-sm">We handle the infrastructure, you focus on what matters.</p>
                  </div>
                  <a 
                    href="/signup"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all transform hover:scale-105"
                  >
                    Deploy Now
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                </div>

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
                description: "Monthly receipts show usage by provider—tokens, minutes, calls—plus our subscription fee. No surprises."
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
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                ),
                title: "Keys & Data Control",
                description: "BYO keys stay in your environment. For Hosted, keys can be yours or ours—rotate anytime."
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ),
                title: "No Content Logging",
                description: "We don't store message content in logs by default. Opt in explicitly only if you need debugging."
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ),
                title: "Clear Cancellation",
                description: "Cancel any time. No lock-in, no hidden fees, no hoops to jump through."
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                ),
                title: "Inactivity Nudges",
                description: "No usage for a while? We'll email you to downgrade, pause, or cancel—so you don't pay for nothing."
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                ),
                title: "Always Your Data",
                description: "Host anywhere. Export or delete with one click. We can't see or change your message content."
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
              Your <span className="text-red-500">privacy</span>, by design
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
                  We are <span className="text-white font-medium">not able to see, store, or modify</span> message content between you and your assistant. All processing happens in your environment; we only receive aggregate usage metrics.
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
            <div className="bg-slate-900/60 backdrop-blur-md border border-red-500/20 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Hosted</h3>
                  <p className="text-sm text-slate-500">Managed by AutoClaw</p>
                </div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                <p className="text-slate-300 leading-relaxed">
                  We <span className="text-white font-medium">don't store or log message content</span> by default. Because we operate the infrastructure, you're trusting us operationally; we provide audit logs and strict access controls.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm text-red-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>Audit logs & access controls included</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-20 text-center animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <p className="text-slate-500 text-sm">
            Powered by OpenClaw · Open Source · Your Data, Your Control
          </p>
        </div>

      </div>
    </main>
  );
}
