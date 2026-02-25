"use client";

import { Suspense } from "react";
import LogsPage from "@/app/components/logs/LogsPage";

export default function LogsRoutePage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-20 flex items-center justify-center text-slate-400">Loading...</div>}>
      <LogsPage />
    </Suspense>
  );
}
