import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import WhatsAppWidget from "./components/WhatsAppWidget";

export const metadata: Metadata = {
  title: "LogLife",
  description: "Audio-first, chat-native journaling that helps you notice patterns and act.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="nav">
          <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
            <Link href="/" className="text-slate-900 font-semibold">LogLife</Link>
            <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-700">
              <Link href="/#learn" className="hover:text-emerald-700">How it works</Link>
              <Link href="/guides" className="hover:text-emerald-700">Guides</Link>
              <Link href="/about" className="hover:text-emerald-700">About</Link>
              <Link href="/roadmap" className="hover:text-emerald-700">Roadmap</Link>
              <a href="#start" className="rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50">Start your log</a>
            </nav>
          </div>
        </header>
        {children}
        <WhatsAppWidget />
      </body>
    </html>
  );
}
