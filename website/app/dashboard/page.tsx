"use client";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </main>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <main className="min-h-screen pt-20 pb-12 px-4 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">
              Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress}
            </p>
          </div>
          
          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center ring-2 ring-slate-700 hover:ring-slate-600 transition-all cursor-pointer"
            >
              {user.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt={user.fullName || "User"}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-white">
                  {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0]?.toUpperCase()}
                </span>
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800/50 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-800/50">
                  <p className="text-sm font-medium text-white truncate">{user.fullName || "User"}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {user.emailAddresses[0]?.emailAddress}
                  </p>
                </div>
                
                <div className="p-1.5">
                  <Link
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Account settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Journal Entries</p>
                <p className="text-2xl font-semibold text-white mt-1">0</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">No entries yet</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Current Streak</p>
                <p className="text-2xl font-semibold text-white mt-1">0 days</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Start journaling to build your streak</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Highlights</p>
                <p className="text-2xl font-semibold text-white mt-1">0</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">This week</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Days Active</p>
                <p className="text-2xl font-semibold text-white mt-1">--</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">No data yet</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Journal Section */}
          <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800/50 rounded-xl">
            <div className="px-5 py-4 border-b border-slate-800/50 flex items-center justify-between">
              <h2 className="text-sm font-medium text-white">Your Journal</h2>
              <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-all cursor-pointer">
                + New Entry
              </button>
            </div>
            <div className="p-5">
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-400 mb-1">Your story starts here</p>
                <p className="text-xs text-slate-500">Send a voice note or message to begin</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl">
            <div className="px-5 py-4 border-b border-slate-800/50">
              <h2 className="text-sm font-medium text-white">Quick Actions</h2>
            </div>
            <div className="p-3">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all cursor-pointer text-left">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-300">New Entry</p>
                  <p className="text-xs text-slate-500">Record a thought or moment</p>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all cursor-pointer text-left">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-300">Timeline</p>
                  <p className="text-xs text-slate-500">See your highlights</p>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all cursor-pointer text-left">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-300">Insights</p>
                  <p className="text-xs text-slate-500">Explore patterns</p>
                </div>
              </button>

              <a href="https://docs.loglife.co/" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all cursor-pointer text-left">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-300">Docs</p>
                  <p className="text-xs text-slate-500">Learn how LogLife works</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-6 bg-slate-900/50 border border-slate-800/50 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-800/50">
            <h2 className="text-sm font-medium text-white">Recent Activity</h2>
          </div>
          <div className="p-5">
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">No recent activity</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
