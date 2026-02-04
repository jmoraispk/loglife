"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  if (pathname === "/call") {
    return null;
  }

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-50 transition-colors duration-200 bg-slate-900/50 backdrop-blur-md border-b border-slate-800/50">
      <div className="container mx-auto px-12 py-3">
        <div className="flex items-center justify-between">
          <Link href="/#hero" className="flex items-center group">
            <div className="flex items-center overflow-visible transition-transform duration-200 group-hover:scale-[1.02] pt-2.5 py-0.5">
              <Image
                src="/logo_light.svg"
                alt="AutoClaw"
                width={140}
                height={35}
                className="h-10 w-auto transition-opacity duration-200"
                priority
              />
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/pricing"
              className="font-medium transition-colors text-slate-300 hover:text-red-400"
            >
              Pricing
            </Link>
            <Link
              href="/blog"
              className="font-medium transition-colors text-slate-300 hover:text-red-400"
            >
              Blog
            </Link>
          </nav>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link
              href="/signup"
              className="hidden sm:inline-flex items-center px-5 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-500 transition-all"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Deploy Now
            </Link>
            <button 
              className="md:hidden p-2 rounded-lg transition-colors duration-200 text-slate-300 hover:text-red-400 cursor-pointer"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 p-4 flex flex-col space-y-4 shadow-lg animate-in slide-in-from-top-5 duration-200 transition-colors bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
            <Link
              href="/#how-it-works"
              className="font-medium transition-colors px-4 py-2 rounded-lg text-slate-300 hover:text-red-400 hover:bg-slate-800"
              onClick={() => setIsMenuOpen(false)}
            >
              How it works
            </Link>
            <Link
              href="/pricing"
              className="font-medium transition-colors px-4 py-2 rounded-lg text-slate-300 hover:text-red-400 hover:bg-slate-800"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/blog"
              className="font-medium transition-colors px-4 py-2 rounded-lg text-slate-300 hover:text-red-400 hover:bg-slate-800"
              onClick={() => setIsMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-5 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-500 transition-all mx-4"
              onClick={() => setIsMenuOpen(false)}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Deploy Now
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
