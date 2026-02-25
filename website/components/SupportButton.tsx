"use client";

import { useEffect, useRef, useState } from "react";
import SupportModal from "./SupportModal";

export default function SupportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!isOpen && wasOpenRef.current) {
      triggerRef.current?.focus();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open support and feedback modal"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`fixed bottom-6 right-6 z-[65] inline-flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-emerald-400/60 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-[0_8px_30px_-4px_rgba(16,185,129,0.45)] transition duration-300 hover:scale-110 hover:shadow-[0_8px_40px_-4px_rgba(16,185,129,0.6)] focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-slate-900 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7 drop-shadow-sm"
          aria-hidden="true"
        >
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>

      <SupportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
