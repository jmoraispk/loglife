"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useWhatsAppWidget } from "../contexts/WhatsAppWidgetContext";
import { useTheme } from "../contexts/ThemeContext";
import Vapi from "@vapi-ai/web";

function IconMic() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z"/>
      <path d="M19 10a7 7 0 0 1-14 0"/>
      <path d="M12 19v4"/>
    </svg>
  );
}

function IconSparkles() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconHistory() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v5h5"/>
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/>
      <path d="M12 7v5l4 2"/>
    </svg>
  );
}

export default function CallPage() {
  const { hideWidgetButton, showWidgetButton } = useWhatsAppWidget();
  const { isDarkMode } = useTheme();
  const vapiRef = useRef<Vapi | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);

  useEffect(() => {
    hideWidgetButton();
    return () => {
      showWidgetButton();
    };
  }, [hideWidgetButton, showWidgetButton]);

  useEffect(() => {
    // Initialize Vapi
    const vapi = new Vapi("fb209f9a-5269-4157-90e7-30198fad3e08");
    vapiRef.current = vapi;

    // Listen for events
    vapi.on("call-start", () => {
      console.log("Call started");
      setIsCallActive(true);
    });

    vapi.on("call-end", () => {
      console.log("Call ended");
      setIsCallActive(false);
    });

    vapi.on("message", (message) => {
      if (message.type === "transcript") {
        console.log(`${message.role}: ${message.transcript}`);
      }
    });

    vapi.on("error", (error) => {
      console.error("Vapi error:", error);
    });

    return () => {
      // Cleanup: stop call if active
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
    };
  }, []);

  const handleStartCall = () => {
    if (vapiRef.current && !isCallActive) {
      const assistantOverrides = {
        variableValues: {
          customerName: "Atif"
        }
      };
      vapiRef.current.start(
        "1038c0b6-3be5-4516-95fb-176e3be14b58",
        assistantOverrides
      );
    }
  };

  const handleEndCall = () => {
    if (vapiRef.current && isCallActive) {
      vapiRef.current.stop();
    }
  };

  return (
    <main className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${
      isDarkMode 
        ? "bg-slate-950" 
        : "bg-gradient-to-b from-emerald-50 via-white to-emerald-50"
    }`}>
      {/* Background blobs */}
      <div className={`absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full blur-3xl -z-10 transition-colors duration-300 ${
        isDarkMode ? "bg-emerald-900/20" : "bg-emerald-100/40"
      }`} />
      <div className={`absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full blur-3xl -z-10 transition-colors duration-300 ${
        isDarkMode ? "bg-emerald-800/20" : "bg-emerald-200/30"
      }`} />

      {/* Back Button Container */}
      <div className="mx-auto max-w-6xl px-6 pt-8">
        <Link 
          href="/"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            isDarkMode 
              ? "text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-800" 
              : "text-slate-600 hover:text-emerald-700 bg-white/50 hover:bg-white"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Home
        </Link>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12 sm:py-20 flex flex-col items-center text-center">
        
        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold mb-8 transition-colors duration-300 ${
          isDarkMode 
            ? "bg-emerald-900/50 text-emerald-200" 
            : "bg-emerald-100 text-emerald-800"
        }`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live Voice Assistant
        </div>

        <h1 className={`text-4xl font-bold tracking-tight sm:text-6xl mb-6 transition-colors duration-300 ${
          isDarkMode ? "text-white" : "text-slate-900"
        }`}>
          Talk to your journal.
        </h1>
        
        <p className={`max-w-2xl text-lg leading-8 mb-12 transition-colors duration-300 ${
          isDarkMode ? "text-slate-400" : "text-slate-600"
        }`}>
          Experience the most natural way to reflect. Just speak to log your day, analyze patterns, or get clarity on what's on your mind.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl text-left">
          {/* Feature 1 */}
          <div className={`backdrop-blur-sm p-6 rounded-2xl transition-all duration-300 ${
            isDarkMode 
              ? "bg-slate-900/60" 
              : "bg-white/60"
          }`}>
            <div className={`mb-4 w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300 ${
              isDarkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-600"
            }`}>
              <IconMic />
            </div>
            <h3 className={`font-semibold mb-2 transition-colors duration-300 ${
              isDarkMode ? "text-slate-200" : "text-slate-900"
            }`}>Log Effortlessly</h3>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? "text-slate-400" : "text-slate-600"
            }`}>Just speak naturally. No typing required. We capture every detail.</p>
          </div>

          {/* Feature 2 */}
          <div className={`backdrop-blur-sm p-6 rounded-2xl transition-all duration-300 ${
            isDarkMode 
              ? "bg-slate-900/60" 
              : "bg-white/60"
          }`}>
            <div className={`mb-4 w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300 ${
              isDarkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-600"
            }`}>
              <IconSparkles />
            </div>
            <h3 className={`font-semibold mb-2 transition-colors duration-300 ${
              isDarkMode ? "text-slate-200" : "text-slate-900"
            }`}>Instant Insight</h3>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? "text-slate-400" : "text-slate-600"
            }`}>Get immediate feedback and uncover patterns in your daily life.</p>
          </div>

          {/* Feature 3 */}
          <div className={`backdrop-blur-sm p-6 rounded-2xl transition-all duration-300 ${
            isDarkMode 
              ? "bg-slate-900/60" 
              : "bg-white/60"
          }`}>
            <div className={`mb-4 w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300 ${
              isDarkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-600"
            }`}>
              <IconHistory />
            </div>
            <h3 className={`font-semibold mb-2 transition-colors duration-300 ${
              isDarkMode ? "text-slate-200" : "text-slate-900"
            }`}>Deep Reflection</h3>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? "text-slate-400" : "text-slate-600"
            }`}>Review your past entries and track your personal growth journey.</p>
          </div>
        </div>

        <div className={`mt-16 p-6 rounded-2xl max-w-2xl w-full text-left relative overflow-hidden transition-colors duration-300 ${
          isDarkMode ? "bg-emerald-950" : "bg-emerald-900"
        }`}>
          <div className="relative z-10">
            <h3 className="text-lg font-semibold text-white mb-2">Ready to try?</h3>
            <p className="text-emerald-200 mb-4">
              Click the button below to start a conversation with your AI companion.
            </p>
            <div className="flex flex-col items-center gap-4 mt-4">
              {!isCallActive ? (
                <button
                  onClick={handleStartCall}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                    isDarkMode
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white"
                  }`}
                >
                  <IconMic />
                  Start Conversation
                </button>
              ) : (
                <button
                  onClick={handleEndCall}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                    isDarkMode
                      ? "bg-red-600 hover:bg-red-500 text-white"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                  End Call
                </button>
              )}
              <div className={`flex items-center gap-2 text-sm font-medium ${
                isDarkMode ? "text-emerald-400" : "text-emerald-300"
              }`}>
                <span>Try saying:</span>
                <span className="bg-emerald-800/50 px-2 py-1 rounded">"Help me reflect on my day"</span>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        </div>

      </div>
    </main>
  );
}
