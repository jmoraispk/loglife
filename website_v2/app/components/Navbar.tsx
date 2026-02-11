"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useWhatsAppWidget } from "../contexts/WhatsAppWidgetContext";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { openWidget } = useWhatsAppWidget();
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
                alt="LogLife"
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
              className="font-medium transition-colors text-slate-300 hover:text-emerald-400"
            >
              Pricing
            </Link>
            <Link
              href="#blog"
              className="font-medium transition-colors text-slate-300 hover:text-emerald-400"
            >
              Blog
            </Link>
          </nav>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={openWidget}
              className="hidden sm:inline-flex items-center px-5 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all cursor-pointer"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 512 512"
              >
                <path d="M156.6 384.9L125.7 354c-8.5-8.5-11.5-20.8-7.7-32.2c3-8.9 7-20.5 11.8-33.8L24 288c-8.6 0-16.6-4.6-20.9-12.1s-4.2-16.7 .2-24.1l52.5-88.5c13-21.9 36.5-35.3 61.9-35.3l82.3 0c2.4-4 4.8-7.7 7.2-11.3C289.1-4.1 411.1-8.1 483.9 5.3c11.6 2.1 20.6 11.2 22.8 22.8c13.4 72.9 9.3 194.8-111.4 276.7c-3.5 2.4-7.3 4.8-11.3 7.2v82.3c0 25.4-13.4 49-35.3 61.9l-88.5 52.5c-7.4 4.4-16.6 4.5-24.1 .2s-12.1-12.2-12.1-20.9V380.8c-14.1 4.9-26.4 8.9-35.7 11.9c-11.2 3.6-23.4 .5-31.8-7.8zM384 168a40 40 0 1 0 0-80 40 40 0 1 0 0 80z" />
              </svg>
              Start your log
            </button>
            <button 
              className="md:hidden p-2 rounded-lg transition-colors duration-200 text-slate-300 hover:text-emerald-400"
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
              className="font-medium transition-colors px-4 py-2 rounded-lg text-slate-300 hover:text-emerald-400 hover:bg-slate-800"
              onClick={() => setIsMenuOpen(false)}
            >
              How it works
            </Link>
            <Link
              href="#pricing"
              className="font-medium transition-colors px-4 py-2 rounded-lg text-slate-300 hover:text-emerald-400 hover:bg-slate-800"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="#blog"
              className="font-medium transition-colors px-4 py-2 rounded-lg text-slate-300 hover:text-emerald-400 hover:bg-slate-800"
              onClick={() => setIsMenuOpen(false)}
            >
              Blog
            </Link>
            <button
              onClick={() => {
                openWidget();
                setIsMenuOpen(false);
              }}
              className="inline-flex items-center justify-center px-5 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all mx-4 cursor-pointer"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 512 512"
              >
                <path d="M156.6 384.9L125.7 354c-8.5-8.5-11.5-20.8-7.7-32.2c3-8.9 7-20.5 11.8-33.8L24 288c-8.6 0-16.6-4.6-20.9-12.1s-4.2-16.7 .2-24.1l52.5-88.5c13-21.9 36.5-35.3 61.9-35.3l82.3 0c2.4-4 4.8-7.7 7.2-11.3C289.1-4.1 411.1-8.1 483.9 5.3c11.6 2.1 20.6 11.2 22.8 22.8c13.4 72.9 9.3 194.8-111.4 276.7c-3.5 2.4-7.3 4.8-11.3 7.2v82.3c0 25.4-13.4 49-35.3 61.9l-88.5 52.5c-7.4 4.4-16.6 4.5-24.1 .2s-12.1-12.2-12.1-20.9V380.8c-14.1 4.9-26.4 8.9-35.7 11.9c-11.2 3.6-23.4 .5-31.8-7.8zM384 168a40 40 0 1 0 0-80 40 40 0 1 0 0 80z" />
              </svg>
              Start your log
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
