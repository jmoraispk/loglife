"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Sidebar() {
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
      href: "/#how-it-works", 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      label: "How it works"
    },
    { 
      href: "/pricing", 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: "Pricing"
    },
    { 
      href: "/blog", 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
      label: "Blog"
    },
  ];

  return (
    <aside className="hidden md:flex fixed left-4 top-1/2 -translate-y-1/2 w-16 flex-col items-center py-6 transition-all z-50 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
      
      {/* Logo */}
      <div className="mb-10 shrink-0">
        <div className="block relative w-6 h-6 opacity-100 transition-opacity cursor-default">
          <Image
            src="/icon-small.svg"
            alt="LogLife"
            fill
            className="object-contain"
          />
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex flex-col items-center justify-center space-y-4 w-full">
        {navItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className="w-8 h-8 flex items-center justify-center transition-colors text-slate-400 hover:text-emerald-400"
            title={item.label}
          >
            {item.icon}
          </Link>
        ))}
      </nav>

      {/* Login/Signup */}
      <div className="mt-10 shrink-0">
        <Link 
          href="/login" 
          className="w-8 h-8 flex items-center justify-center transition-colors text-slate-400 hover:text-emerald-400"
          title="Sign In"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </Link>
      </div>
    </aside>
  );
}
