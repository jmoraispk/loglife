"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  if (pathname?.startsWith("/call")) {
    return null;
  }

  const isSignedIn = isLoaded && user;

  // Nav items for signed-out users
  const publicNavItems = [
    { 
      href: "/#hero", 
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      label: "Home"
    },
    { 
      href: "/features", 
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      label: "Features"
    },
    { 
      href: "/pricing", 
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: "Pricing"
    },
    { 
      href: "/blog", 
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
      label: "Blog"
    },
  ];

  // Nav items for signed-in users
  const authNavItems = [
    { 
      href: "/dashboard", 
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
      label: "Dashboard"
    },
    { 
      href: "/account", 
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      label: "Account"
    },
    { 
      href: "/blog", 
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
      label: "Blog"
    },
    { 
      href: "/pricing", 
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: "Pricing"
    },
  ];

  const navItems = isSignedIn ? authNavItems : publicNavItems;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      {/* Top Navigation Bar - visible below lg */}
      <nav className="lg:hidden fixed top-4 left-4 right-4 h-14 flex items-center justify-between px-4 z-50 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
        {/* Logo */}
        <Link href={isSignedIn ? "/dashboard" : "/#hero"} className="flex items-center gap-2">
          <div className="relative w-6 h-6 shrink-0">
            <Image
              src="/icon-small.svg"
              alt="AutoClaw"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-sm font-semibold text-white hidden sm:block">
            AutoClaw
          </span>
        </Link>

        {/* Navigation Items */}
        <div className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`h-9 flex items-center gap-2 px-2 sm:px-3 rounded-lg transition-colors ${
                pathname === item.href 
                  ? "text-red-400 bg-red-500/10" 
                  : "text-slate-400 hover:text-red-400 hover:bg-red-500/10"
              }`}
            >
              {item.icon}
              <span className="text-sm whitespace-nowrap hidden md:block">
                {item.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Sign In / Sign Out */}
        {isSignedIn ? (
          <button 
            onClick={handleSignOut}
            className="h-9 flex items-center gap-2 px-2 sm:px-3 rounded-lg transition-colors text-slate-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm whitespace-nowrap hidden sm:block">
              Sign Out
            </span>
          </button>
        ) : (
          <Link 
            href="/login" 
            className="h-9 flex items-center gap-2 px-2 sm:px-3 rounded-lg transition-colors text-slate-400 hover:text-red-400 hover:bg-red-500/10"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm whitespace-nowrap hidden sm:block">
              Sign In
            </span>
          </Link>
        )}
      </nav>

      {/* Side Navigation Bar - visible at lg and above */}
      <aside className="group hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 w-14 xl:hover:w-40 flex-col items-center py-5 transition-all duration-300 ease-in-out z-50 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
        
        {/* Logo */}
        <div className="mb-8 shrink-0 px-3 w-full flex items-center gap-3">
          <Link href={isSignedIn ? "/dashboard" : "/#hero"} className="flex items-center gap-3">
            <div className="block relative w-6 h-6 shrink-0 opacity-100 transition-opacity">
              <Image
                src="/icon-small.svg"
                alt="AutoClaw"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-sm font-semibold text-white whitespace-nowrap opacity-0 xl:group-hover:opacity-100 transition-opacity duration-300">
              AutoClaw
            </span>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col items-start justify-center space-y-1 w-full px-3">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`w-full h-9 flex items-center gap-3 px-2 rounded-lg transition-colors ${
                pathname === item.href 
                  ? "text-red-400 bg-red-500/10" 
                  : "text-slate-400 hover:text-red-400 hover:bg-red-500/10"
              }`}
            >
              {item.icon}
              <span className="text-sm whitespace-nowrap opacity-0 xl:group-hover:opacity-100 transition-opacity duration-300">
                {item.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Sign In / Sign Out */}
        <div className="mt-8 shrink-0 px-3 w-full">
          {isSignedIn ? (
            <button 
              onClick={handleSignOut}
              className="w-full h-9 flex items-center gap-3 px-2 rounded-lg transition-colors text-slate-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm whitespace-nowrap opacity-0 xl:group-hover:opacity-100 transition-opacity duration-300">
                Sign Out
              </span>
            </button>
          ) : (
            <Link 
              href="/login" 
              className="w-full h-9 flex items-center gap-3 px-2 rounded-lg transition-colors text-slate-400 hover:text-red-400 hover:bg-red-500/10"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm whitespace-nowrap opacity-0 xl:group-hover:opacity-100 transition-opacity duration-300">
                Sign In
              </span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
