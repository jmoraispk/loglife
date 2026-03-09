"use client";

import { Suspense } from "react";
import LogsPage from "@/components/logs/LogsPage";
import { useDeveloperSettingsAccess } from "@/hooks/useDeveloperSettingsAccess";

export default function LogsRoutePage() {
  const { isCheckingAccess, isBlocked } = useDeveloperSettingsAccess();

  if (isCheckingAccess || isBlocked) {
    return <div className="min-h-screen pt-20 flex items-center justify-center text-slate-400">Loading...</div>;
  }

  return (
    <Suspense fallback={<div className="min-h-screen pt-20 flex items-center justify-center text-slate-400">Loading...</div>}>
      <LogsPage />
    </Suspense>
  );
}
