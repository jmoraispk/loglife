"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center pt-24 pb-12 px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 animate-slide-up">
        
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-block relative w-12 h-12 mb-6 hover:opacity-80 transition-opacity">
            <Image
                src="/icon-small.svg"
                alt="AutoClaw"
                fill
                className="object-contain"
            />
          </Link>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Deploy your AI agent
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Get started with AutoClaw in minutes
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first-name" className="block text-sm font-medium text-slate-300 mb-2">
                  First name
                </label>
                <input
                  id="first-name"
                  name="first-name"
                  type="text"
                  required
                  className="w-full rounded-xl bg-slate-950/50 border border-slate-700 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all placeholder-slate-500"
                  placeholder="John"
                />
              </div>
              <div>
                <label htmlFor="last-name" className="block text-sm font-medium text-slate-300 mb-2">
                  Last name
                </label>
                <input
                  id="last-name"
                  name="last-name"
                  type="text"
                  required
                  className="w-full rounded-xl bg-slate-950/50 border border-slate-700 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all placeholder-slate-500"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-xl bg-slate-950/50 border border-slate-700 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all placeholder-slate-500"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="w-full rounded-xl bg-slate-950/50 border border-slate-700 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all placeholder-slate-500"
                placeholder="••••••••"
              />
              <p className="mt-2 text-xs text-slate-500">
                Must be at least 8 characters
              </p>
            </div>

            <div className="flex items-start">
              <div className="flex h-5 items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-red-600 focus:ring-red-600 focus:ring-offset-slate-900"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-slate-400">
                  I agree to the <a href="#" className="font-medium text-red-400 hover:text-red-300">Terms</a> and <a href="#" className="font-medium text-red-400 hover:text-red-300">Privacy Policy</a>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-slate-900 transition-all shadow-lg shadow-red-500/20 cursor-pointer"
            >
              Create Account
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-900/40 text-slate-500 bg-opacity-0 backdrop-blur-xl bg-clip-text">
                  Or sign up with
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-sm font-medium cursor-pointer">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.79-1.677-4.184-2.702-6.735-2.702-5.522 0-10 4.478-10 10s4.478 10 10 10c8.365 0 10-6.624 10-10.239h-10.239z"/>
                </svg>
                Google
              </button>
              <button className="flex items-center justify-center w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-sm font-medium cursor-pointer">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                   <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                GitHub
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-red-400 hover:text-red-300 hover:underline transition-all">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
