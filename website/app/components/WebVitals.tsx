"use client";

import { useEffect } from "react";
import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from "web-vitals";

function sendToAnalytics(metric: Metric) {
  // Log in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value.toFixed(2), metric.rating);
  }

  // TODO: Send to your analytics backend
  // Examples:
  // - Google Analytics: gtag('event', metric.name, { value: metric.value, ... })
  // - Custom endpoint: fetch('/api/vitals', { method: 'POST', body: JSON.stringify(metric) })
  // - Plausible: plausible(metric.name, { props: { value: metric.value } })
}

export function WebVitals() {
  useEffect(() => {
    onCLS(sendToAnalytics);
    onINP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onFCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  }, []);

  return null;
}
