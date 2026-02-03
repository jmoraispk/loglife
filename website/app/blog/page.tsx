"use client";
import React from "react";
import Link from "next/link";

// Mock Data for Blog Posts
const BLOG_POSTS = [
  {
    slug: "power-of-voice-logging",
    title: "The Power of Voice Logging: Why Speaking is Better Than Typing",
    excerpt: "Discover how audio-first journaling can reduce friction, capture more nuance, and help you maintain a consistent habit.",
    date: "Oct 12, 2025",
    readTime: "5 min read",
    category: "Productivity",
    image: "/blog/voice-logging.jpg" // Placeholder, we'll use a gradient fallback
  },
  {
    slug: "tracking-habits-ai",
    title: "How AI Finds Patterns in Your Daily Habits",
    excerpt: "We analyzed 10,000 logs to see how AI detects correlations between sleep, caffeine, and productivity levels.",
    date: "Sep 28, 2025",
    readTime: "7 min read",
    category: "Data Science",
    image: "/blog/ai-patterns.jpg"
  },
  {
    slug: "whatsapp-journaling",
    title: "Why WhatsApp is the Perfect Journaling App",
    excerpt: "You don't need another app. Learn why meeting you where you already are is the secret to habit retention.",
    date: "Sep 15, 2025",
    readTime: "4 min read",
    category: "Lifestyle",
    image: "/blog/whatsapp.jpg"
  },
  {
    slug: "privacy-first-ai",
    title: "Building a Private AI: Our Architecture",
    excerpt: "A deep dive into how we secure your personal data while still providing powerful AI insights.",
    date: "Aug 30, 2025",
    readTime: "8 min read",
    category: "Engineering",
    image: "/blog/privacy.jpg"
  }
];

export default function BlogPage() {
  return (
    <main className="min-h-screen pt-32 pb-24 px-6 lg:px-8">
      <div className="relative z-10 mx-auto max-w-6xl">
        
        {/* Header */}
        <div className="text-center mb-20 animate-slide-up">
          <h1 className="text-4xl lg:text-6xl font-bold text-white tracking-tight mb-6">
            LogLife <span className="text-emerald-400">Blog</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Insights on habit formation, personal data, and building the future of 
            private AI assistants.
          </p>
        </div>

        {/* Featured Post (First one) */}
        <div className="mb-16 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <Link href={`/blog/${BLOG_POSTS[0].slug}`} className="group block relative bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl overflow-hidden hover:border-emerald-500/50 transition-all duration-300">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="h-64 md:h-auto bg-gradient-to-br from-emerald-900/40 to-slate-900 relative overflow-hidden">
                {/* Fallback pattern since we don't have real images yet */}
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500 via-slate-900 to-black"></div>
                <div className="absolute inset-0 flex items-center justify-center text-emerald-700/20">
                    <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-3 text-sm mb-4">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                    {BLOG_POSTS[0].category}
                  </span>
                  <span className="text-slate-500">{BLOG_POSTS[0].date}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-500">{BLOG_POSTS[0].readTime}</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4 group-hover:text-emerald-400 transition-colors">
                  {BLOG_POSTS[0].title}
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed mb-6">
                  {BLOG_POSTS[0].excerpt}
                </p>
                <div className="text-emerald-400 font-medium flex items-center group-hover:translate-x-2 transition-transform">
                  Read Article 
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          {BLOG_POSTS.slice(1).map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex flex-col bg-slate-900/30 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 hover:bg-slate-800/50 transition-all duration-300">
              <div className="h-48 bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden">
                 <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-700 via-slate-900 to-black"></div>
                 {/* Visual placeholder */}
                 <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl opacity-5 select-none text-white font-serif italic">
                        {post.title.charAt(0)}
                    </span>
                 </div>
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center justify-between text-xs mb-3">
                   <span className="text-emerald-400 font-medium">{post.category}</span>
                   <span className="text-slate-500">{post.readTime}</span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                
                <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
                  {post.excerpt}
                </p>
                
                <div className="pt-4 border-t border-slate-800 mt-auto flex items-center justify-between">
                   <span className="text-xs text-slate-500">{post.date}</span>
                   <span className="text-xs font-semibold text-emerald-400/80 group-hover:text-emerald-400">Read more →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="mt-24 p-8 md:p-12 rounded-3xl bg-emerald-900/10 border border-emerald-500/20 text-center animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <h3 className="text-2xl font-bold text-white mb-4">Subscribe to our newsletter</h3>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            Get the latest updates on LogLife features and articles about personal data science directly to your inbox.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="you@example.com" 
              className="px-4 py-3 rounded-xl bg-slate-950/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-full"
            />
            <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors whitespace-nowrap shadow-lg shadow-emerald-900/20 cursor-pointer">
              Subscribe
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}
