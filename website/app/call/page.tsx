"use client";

import { useEffect, useState, useRef } from "react";
import { useWhatsAppWidget } from "../contexts/WhatsAppWidgetContext";
import { useTheme } from "../contexts/ThemeContext";
import Vapi from "@vapi-ai/web";

export default function CallPage() {
  const { hideWidgetButton, showWidgetButton } = useWhatsAppWidget();
  const { isDarkMode } = useTheme();
  const vapiRef = useRef<Vapi | null>(null);
  const connectingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

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
      setIsConnecting(false);
      // Clear any pending timeout
      if (connectingTimeoutRef.current) {
        clearTimeout(connectingTimeoutRef.current);
        connectingTimeoutRef.current = null;
      }
    });

    vapi.on("call-end", () => {
      console.log("Call ended");
      setIsCallActive(false);
      setIsConnecting(false);
      // Clear any pending timeout
      if (connectingTimeoutRef.current) {
        clearTimeout(connectingTimeoutRef.current);
        connectingTimeoutRef.current = null;
      }
    });

    vapi.on("message", (message) => {
      if (message.type === "transcript") {
        console.log(`${message.role}: ${message.transcript}`);
      }
    });

    vapi.on("error", (error) => {
      console.error("Vapi error:", error);
      setIsConnecting(false);
      // Clear any pending timeout
      if (connectingTimeoutRef.current) {
        clearTimeout(connectingTimeoutRef.current);
        connectingTimeoutRef.current = null;
      }
    });

    return () => {
      // Cleanup: stop call if active
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
      // Clear any pending timeout
      if (connectingTimeoutRef.current) {
        clearTimeout(connectingTimeoutRef.current);
        connectingTimeoutRef.current = null;
      }
    };
  }, []);

  const handleStartCall = () => {
    if (vapiRef.current && !isCallActive && !isConnecting) {
      setIsConnecting(true);
      const assistantOverrides = {
        variableValues: {
          customerName: "Ali"
        }
      };
      vapiRef.current.start(
        "1038c0b6-3be5-4516-95fb-176e3be14b58",
        assistantOverrides
      );
      
      // Fallback timeout: clear connecting state after 10 seconds if call-start doesn't fire
      connectingTimeoutRef.current = setTimeout(() => {
        setIsConnecting(false);
        connectingTimeoutRef.current = null;
      }, 10000);
    }
  };

  const handleEndCall = () => {
    if (vapiRef.current) {
      if (isCallActive || isConnecting) {
        vapiRef.current.stop();
        setIsConnecting(false);
        setIsCallActive(false);
        // Clear any pending timeout
        if (connectingTimeoutRef.current) {
          clearTimeout(connectingTimeoutRef.current);
          connectingTimeoutRef.current = null;
        }
      }
    }
  };

  return (
    <main className={`min-h-screen relative overflow-hidden flex items-center justify-center transition-colors duration-300 ${
      isDarkMode 
        ? "bg-slate-950" 
        : "bg-gradient-to-b from-emerald-50 via-white to-emerald-50"
    }`}>
      {/* Subtle background blob */}
      <div className={`absolute inset-0 w-full h-full -z-10 transition-colors duration-300 ${
        isDarkMode ? "bg-emerald-900/10" : "bg-emerald-100/20"
      }`} />

      <div className="flex flex-col items-center text-center px-6 py-12">
        {/* Minimal heading */}
        <h1 className={`text-2xl sm:text-3xl font-semibold tracking-tight mb-12 transition-colors duration-300 ${
          isDarkMode ? "text-slate-300" : "text-slate-700"
        }`}>
          Talk to your LogLife
        </h1>

        {/* Main CTA Button - Hero Element */}
        <div className="flex flex-col items-center gap-6">
          {isCallActive ? (
            <button
              onClick={handleEndCall}
              className={`group relative inline-flex items-center justify-center gap-4 px-12 py-6 sm:px-16 sm:py-8 rounded-2xl font-semibold text-lg sm:text-xl transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95 cursor-pointer ${
                isDarkMode
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-red-600/50"
                  : "bg-red-500 hover:bg-red-600 text-white shadow-red-500/50"
              }`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="6" width="12" height="12" />
              </svg>
              <span>End Call</span>
              {/* Subtle glow effect */}
              <div className={`absolute inset-0 rounded-2xl blur-xl opacity-50 -z-10 transition-opacity duration-300 ${
                isDarkMode ? "bg-red-500" : "bg-red-400"
              }`} />
            </button>
          ) : isConnecting ? (
            <button
              onClick={handleEndCall}
              className={`group relative inline-flex items-center justify-center gap-4 px-12 py-6 sm:px-16 sm:py-8 rounded-2xl font-semibold text-lg sm:text-xl transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95 cursor-pointer ${
                isDarkMode
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/50"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/50"
              }`}
            >
              <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              <span>Connecting...</span>
              {/* Subtle glow effect */}
              <div className={`absolute inset-0 rounded-2xl blur-xl opacity-50 -z-10 transition-opacity duration-300 ${
                isDarkMode ? "bg-emerald-500" : "bg-emerald-400"
              }`} />
            </button>
          ) : (
            <button
              onClick={handleStartCall}
              className={`group relative inline-flex items-center justify-center gap-4 px-12 py-6 sm:px-16 sm:py-8 rounded-2xl font-semibold text-lg sm:text-xl transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95 cursor-pointer ${
                isDarkMode
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/50"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/50"
              }`}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z"/>
                <path d="M19 10a7 7 0 0 1-14 0"/>
                <path d="M12 19v4"/>
              </svg>
              <span>Start Conversation</span>
              {/* Subtle glow effect */}
              <div className={`absolute inset-0 rounded-2xl blur-xl opacity-50 -z-10 transition-opacity duration-300 ${
                isDarkMode ? "bg-emerald-500" : "bg-emerald-400"
              }`} />
            </button>
          )}
          
          {/* Minimal hint text */}
          {!isCallActive && !isConnecting && (
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? "text-slate-500" : "text-slate-500"
            }`}>
              Just speak naturally to begin
            </p>
          )}
          {isConnecting && (
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? "text-emerald-400" : "text-emerald-600"
            }`}>
              Initiating your conversation...
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
