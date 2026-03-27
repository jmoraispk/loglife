"use client";

import { Suspense } from "react";
import LogsPage from "@/components/logs/LogsPage";
import { useUser } from "@clerk/nextjs";
import NonDeveloperVoiceLogsPage from "@/components/logs/NonDeveloperVoiceLogsPage";

export default function LogsRoutePage() {
  const { user, isLoaded } = useUser();
  const developerSettingsEnabled = Boolean(
    (user?.unsafeMetadata as Record<string, unknown> | undefined)?.developerSettingsEnabled
  );
  const whatsappPhone = (user?.unsafeMetadata as Record<string, string> | undefined)?.whatsappPhone || "";

  if (!isLoaded) {
    return <div className="min-h-screen pt-20 flex items-center justify-center text-slate-400">Loading...</div>;
  }

  if (!user) {
    return <div className="min-h-screen pt-20 flex items-center justify-center text-slate-400">Loading...</div>;
  }

  if (!developerSettingsEnabled) {
    return <NonDeveloperVoiceLogsPage phone={whatsappPhone} />;
  }

  return (
    <Suspense fallback={<div className="min-h-screen pt-20 flex items-center justify-center text-slate-400">Loading...</div>}>
      <LogsPage />
    </Suspense>
  );
}
