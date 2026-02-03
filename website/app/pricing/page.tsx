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

function HelpIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
            <span className="text-[10px] uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
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
            Pricing that <span className="text-emerald-400">adapts</span> to you
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Start completely free with our open-source self-hosted version, 
            or let us handle the infrastructure for you.
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
                <h2 className="text-2xl font-bold text-white mb-2">Hacker / DIY</h2>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">$0</span>
                  <span className="text-slate-500 font-medium">/ forever</span>
                </div>
                <p className="text-slate-400 text-sm mt-4 leading-relaxed">
                  Full control. You host it, you manage it. The code is yours.
                </p>
              </div>

              <div className="space-y-4 mb-8 flex-1">
                {[
                  "Open Source codebase",
                  "Self-hosted (Docker)",
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
                href="https://github.com/loglife/loglife" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl border border-slate-700 transition-colors"
              >
                View on GitHub
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN: MANAGED */}
          <div className="lg:col-span-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden">
              {/* Highlight Border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600" />
              
              <div className="p-8 sm:p-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 pb-8 border-b border-slate-800">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      Done For You
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                        RECOMMENDED
                      </span>
                    </h2>
                    <p className="text-slate-400 mt-2">Modular pricing. Pick exactly what you need.</p>
                  </div>
                  <div className="text-right mt-4 sm:mt-0 hidden sm:block">
                    <p className="text-sm text-slate-500">Starting from</p>
                    <p className="text-3xl font-bold text-emerald-400">$3<span className="text-lg text-slate-500 font-normal">/mo</span></p>
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
                        price="$2 once"
                        action={
                          <Switch 
                            options={["DIY", "Assisted"]} 
                            selected={hostType}
                            onChange={(v) => setHostType(v as any)}
                          />
                        }
                      />
                      <PricingItem 
                        title="Cloud Hosting"
                        description="Isolated instance managed by us"
                        price="$8 / mo"
                        action={
                          <Switch 
                            options={["Shared", "Isolated"]} 
                            selected={cloudType}
                            onChange={(v) => setCloudType(v as any)}
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
                        title="AI Brains"
                        description="LLM processing power"
                        price={aiBrainType === "Fixed" ? "$11 / mo" : "Metered"}
                        action={
                          <Switch 
                            options={["Usage", "Fixed"]} 
                            selected={aiBrainType}
                            onChange={(v) => setAiBrainType(v as any)}
                          />
                        }
                      />
                      <PricingItem 
                        title="AI Memory"
                        description="Long-term vector storage"
                        price={aiMemType === "Fixed" ? "Included" : "$0.01 / msg"}
                        action={
                          <Switch 
                            options={["Usage", "Fixed"]} 
                            selected={aiMemType}
                            onChange={(v) => setAiMemType(v as any)}
                          />
                        }
                      />
                      {/* Third party note */}
                      <div className="px-4 py-2 text-xs text-slate-500 italic text-right">
                        * Other providers (AssemblyAI, Twilio) billed at cost
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
                        price="$3 / mo"
                        isOptional
                        action={
                          <button 
                            onClick={() => setSupportEnabled(!supportEnabled)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none cursor-pointer ${supportEnabled ? 'bg-emerald-600' : 'bg-slate-700'}`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${supportEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                        }
                      />
                      <PricingItem 
                        title="Advanced Metrics"
                        description="Deep insights dashboard"
                        price="$5 / mo"
                        isOptional
                        action={
                          <button 
                            onClick={() => setMetricsEnabled(!metricsEnabled)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none cursor-pointer ${metricsEnabled ? 'bg-emerald-600' : 'bg-slate-700'}`}
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
                    <p className="text-slate-400 text-sm">Ready to get started?</p>
                    <p className="text-emerald-400 text-sm">We handle the tech, you handle the life.</p>
                  </div>
                  <a 
                    href="/sign-in?plan=managed"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-105"
                  >
                    Build My Assistant
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                </div>

              </div>
            </div>
          </div>
        </div>
        
        {/* FAQ or Trust Indicators */}
        <div className="mt-20 text-center animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <p className="text-slate-500 text-sm">
            Secure · Private · Encrypted · Cancel Anytime
          </p>
        </div>

      </div>
    </main>
  );
}
