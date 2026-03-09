"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export function useDeveloperSettingsAccess() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const developerSettingsEnabled = Boolean(
    (user?.unsafeMetadata as Record<string, unknown> | undefined)?.developerSettingsEnabled
  );
  const isBlocked = isLoaded && !!user && !developerSettingsEnabled;

  useEffect(() => {
    if (isBlocked) {
      router.replace("/dashboard");
    }
  }, [isBlocked, router]);

  return {
    isCheckingAccess: !isLoaded,
    isBlocked,
    developerSettingsEnabled,
  };
}
