"use client";
import AutoClawHero from "./hero/hero";
import Footer from "./components/Footer";

export default function HomePage() {
  return (
    <>
      <div className="bg-slate-800/80 border-b border-slate-700/50 py-2 px-4 text-center text-sm text-slate-300">
        Development has halted! Domain (.dev & .app) + website for sale.{" "}
        <a
          href="https://github.com/jmoraispk/autoclaw/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          className="text-red-400 hover:text-red-300 underline"
        >
          If interested, submit a GitHub issue. 
        </a>
      </div>
      <AutoClawHero />
      <Footer />
    </>
  );
}
