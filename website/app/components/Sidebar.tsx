"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "../contexts/ThemeContext";
import { useWhatsAppWidget } from "../contexts/WhatsAppWidgetContext";

export default function Sidebar() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { openWidget } = useWhatsAppWidget();
  const pathname = usePathname();

  if (pathname?.startsWith("/call")) {
    return null;
  }

  const navItems = [
    { 
      href: "/#hero", 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      label: "Home"
    },
    { 
      href: "/#features", 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      label: "Features"
    },
    { 
      href: "/#how-it-works", 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      label: "How it works"
    },
    { 
      href: "/#testimonials", 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      label: "Testimonials"
    },
  ];

  return (
    <aside className={`fixed left-0 top-0 h-screen w-16 flex flex-col items-center py-4 transition-colors z-50 border-r ${
      isDarkMode 
        ? "bg-slate-900 border-slate-800" 
        : "bg-white border-slate-200"
    }`}>
      {/* Logo at top */}
      <Link href="/#hero" className="mb-8 group">
        <div className="w-6 h-6 flex items-center justify-center group-hover:opacity-80 transition-opacity">
          <Image
            src="/icon-small.svg"
            alt="LogLife"
            width={24}
            height={24}
            className="w-full h-full"
            priority
          />
        </div>
      </Link>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col items-center space-y-2 w-full">
        {navItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className={`w-8 h-8 flex items-center justify-center transition-colors ${
              isDarkMode
                ? "text-slate-400 hover:text-emerald-400"
                : "text-slate-500 hover:text-emerald-600"
            }`}
            title={item.label}
          >
            {item.icon}
          </Link>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center space-y-2 w-full">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`w-8 h-8 flex items-center justify-center transition-colors cursor-pointer ${
            isDarkMode
              ? "text-slate-400 hover:text-emerald-400"
              : "text-slate-500 hover:text-emerald-600"
          }`}
          title="Toggle theme"
        >
          {isDarkMode ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </button>

        {/* Start Log Button */}
        <button
          onClick={openWidget}
          className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-500 transition-colors cursor-pointer"
          title="Start your log"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
