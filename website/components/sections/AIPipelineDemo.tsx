"use client";

import { useEffect, useRef, useState } from "react";
import AIPipeline from "../dashboard/AIPipeline";

export default function AIPipelineDemo() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
          } else if (entry.intersectionRatio === 0) {
            setIsInView(false);
          }
        });
      },
      { threshold: 0.25 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="max-w-6xl mx-auto px-6 py-20 animate-slide-up" style={{ animationDelay: "0.35s" }}>
      <div className="text-center mb-10">
        <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">From journal to insights</h2>
        <p className="text-lg text-slate-400 mt-3 max-w-3xl mx-auto">
          Write naturally. We extract, classify, and visualize your habits automatically.
        </p>
      </div>

      <AIPipeline
        isActive={isInView}
        allowDeveloperView={false}
        className="mb-0 scale-[1.02] lg:scale-105 origin-top"
      />
    </section>
  );
}
