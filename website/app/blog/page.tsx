"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import postsData from "./posts.json";

// Convert posts object to array and sort by date (newest first)
const BLOG_POSTS = Object.values(postsData).sort((a, b) => {
  const dateA = new Date(a.date);
  const dateB = new Date(b.date);
  return dateB.getTime() - dateA.getTime();
});

// Extract unique categories
const CATEGORIES = ["All", ...Array.from(new Set(BLOG_POSTS.map((post) => post.category)))];

export default function BlogPage() {
  const [activeFilter, setActiveFilter] = useState("All");

  // Filter posts based on active category
  const filteredPosts = useMemo(() => {
    if (activeFilter === "All") return BLOG_POSTS;
    return BLOG_POSTS.filter((post) => post.category === activeFilter);
  }, [activeFilter]);

  // Get featured post (first from filtered list)
  const featuredPost = filteredPosts[0];
  const remainingPosts = filteredPosts.slice(1);

  return (
    <main className="min-h-screen pt-32 pb-24 px-6 lg:px-8">
      <div className="relative z-10 mx-auto max-w-6xl">
        
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="text-4xl lg:text-6xl font-bold text-white tracking-tight mb-6">
            LogLife <span className="text-emerald-500">Blog</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Insights on habits, journaling, and building a better you—one log at a time.
          </p>
        </div>

        {/* Premium Filter Section */}
        <div className="mb-16 animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {/* Filter Pills Container */}
            <div className="relative flex items-center p-1.5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 shadow-2xl shadow-black/20">
              {/* Animated Background Glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveFilter(category)}
                  className={`
                    relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ease-out cursor-pointer
                    ${activeFilter === category
                      ? "text-white bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg shadow-emerald-500/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }
                  `}
                >
                  {/* Active indicator glow */}
                  {activeFilter === category && (
                    <span className="absolute inset-0 rounded-xl bg-emerald-500/20 blur-md -z-10" />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {category === "All" && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    )}
                    {category === "Product" && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    )}
                    {category === "Tutorial" && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    )}
                    {category === "Philosophy" && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    )}
                    {category}
                  </span>
                </button>
              ))}
            </div>

            {/* Post Count Badge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/40 border border-slate-800/60 text-sm">
              <span className="text-slate-500">Showing</span>
              <span className="text-white font-semibold">{filteredPosts.length}</span>
              <span className="text-slate-500">{filteredPosts.length === 1 ? "article" : "articles"}</span>
            </div>
          </div>
        </div>

        {/* Featured Post (First one) */}
        {featuredPost && (
        <div className="mb-16 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <Link href={`/blog/${featuredPost.slug}`} className="group block relative bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl overflow-hidden hover:border-emerald-500/50 transition-all duration-300">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="h-64 md:h-80 bg-gradient-to-br from-emerald-900/40 to-slate-900 relative overflow-hidden">
                {featuredPost.image ? (
                  <Image
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500 via-slate-900 to-black"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-emerald-700/20">
                      <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </>
                )}
              </div>
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-3 text-sm mb-4">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                    {featuredPost.category}
                  </span>
                  <span className="text-slate-500">{featuredPost.date}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-500">{featuredPost.readTime}</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4 group-hover:text-emerald-400 transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed mb-6">
                  {featuredPost.excerpt}
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
        )}

        {/* Recent Posts Grid */}
        {remainingPosts.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          {remainingPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex flex-col bg-slate-900/30 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 hover:bg-slate-800/50 transition-all duration-300">
              <div className="h-48 bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden">
                {post.image ? (
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-700 via-slate-900 to-black"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-6xl opacity-5 select-none text-white font-serif italic">
                        {post.title.charAt(0)}
                      </span>
                    </div>
                  </>
                )}
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
        )}

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-20 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-900/60 border border-slate-800 mb-6">
              <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No articles found</h3>
            <p className="text-slate-400 mb-6">There are no articles in the {activeFilter} category yet.</p>
            <button
              onClick={() => setActiveFilter("All")}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors cursor-pointer"
            >
              View all articles
            </button>
          </div>
        )}

        {/* Newsletter Signup */}
        <div className="mt-24 p-8 md:p-12 rounded-3xl bg-emerald-900/10 border border-emerald-500/20 text-center animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <h3 className="text-2xl font-bold text-white mb-4">Subscribe to our newsletter</h3>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            Get the latest updates on LogLife features, habit tips, and articles about journaling and growth.
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
