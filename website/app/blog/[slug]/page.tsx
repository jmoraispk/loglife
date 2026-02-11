import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { promises as fs } from "fs";
import path from "path";
import Markdown from "react-markdown";
import posts from "../posts.json";

type PostMeta = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  image?: string;
};

const postsData: Record<string, PostMeta> = posts;

export function generateStaticParams() {
  return Object.keys(postsData).map((slug) => ({ slug }));
}

async function getPostContent(slug: string): Promise<string | null> {
  try {
    const filePath = path.join(process.cwd(), "app", "blog", "posts", `${slug}.md`);
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch {
    return null;
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = postsData[slug];

  if (!post) {
    notFound();
  }

  const content = await getPostContent(slug);

  if (!content) {
    notFound();
  }

  return (
    <main className="min-h-screen pt-32 pb-24 px-6 lg:px-8">
      <div className="relative z-10 mx-auto max-w-3xl">
        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center text-slate-400 hover:text-emerald-400 transition-colors mb-8"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          Back to Blog
        </Link>

        {/* Article Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 text-sm mb-4">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
              {post.category}
            </span>
            <span className="text-slate-500">{post.date}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-500">{post.readTime}</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight mb-6">
            {post.title}
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed">
            {post.excerpt}
          </p>
          {post.image && (
            <div className="mt-8 relative h-64 md:h-80 rounded-2xl overflow-hidden border border-slate-800">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
        </header>

        {/* Article Content */}
        <article className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-headings:font-bold prose-p:text-slate-300 prose-strong:text-white prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline prose-code:text-emerald-400 prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 prose-li:text-slate-300 prose-ol:text-slate-300 prose-ul:text-slate-300">
          <Markdown
            components={{
              h2: ({ children }) => (
                <h2 className="text-2xl font-bold text-white mt-10 mb-4">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-bold text-white mt-8 mb-3">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="text-slate-300 leading-relaxed my-4">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="my-4 list-disc list-inside space-y-2">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="my-4 list-decimal list-inside space-y-2">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-slate-300">{children}</li>
              ),
              pre: ({ children }) => (
                <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-x-auto my-6">
                  {children}
                </pre>
              ),
              code: ({ children, className }) => {
                // Check if this is an inline code or a code block
                const isInline = !className;
                if (isInline) {
                  return (
                    <code className="text-emerald-400 bg-slate-800 px-1 py-0.5 rounded">
                      {children}
                    </code>
                  );
                }
                return <code className="text-sm text-slate-300">{children}</code>;
              },
            }}
          >
            {content}
          </Markdown>
        </article>

        {/* Horizontal Line */}
        <div className="mt-16 pt-8 border-t border-slate-800"></div>
      </div>
    </main>
  );
}
