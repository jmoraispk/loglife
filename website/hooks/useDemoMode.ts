"use client";

import { useCallback, useEffect, useState } from "react";

const DEMO_MODE_STORAGE_KEY = "loglife.dev-demo-mode.v1";
const DEMO_MODE_EVENT = "loglife:demo-mode-changed";

function readDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DEMO_MODE_STORAGE_KEY) === "true";
}

function persistDemoMode(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_MODE_STORAGE_KEY, enabled ? "true" : "false");
  window.dispatchEvent(new CustomEvent<boolean>(DEMO_MODE_EVENT, { detail: enabled }));
}

export function useDemoMode() {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => readDemoMode());

  useEffect(() => {
    const syncFromStorage = () => setIsDemoMode(readDemoMode());
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === DEMO_MODE_STORAGE_KEY) syncFromStorage();
    };
    const onCustom = (event: Event) => {
      const next = (event as CustomEvent<boolean>).detail;
      if (typeof next === "boolean") setIsDemoMode(next);
      else syncFromStorage();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(DEMO_MODE_EVENT, onCustom);
    syncFromStorage();

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(DEMO_MODE_EVENT, onCustom);
    };
  }, []);

  const setDemoMode = useCallback((enabled: boolean) => {
    persistDemoMode(enabled);
    setIsDemoMode(enabled);
  }, []);

  const toggleDemoMode = useCallback(() => {
    setDemoMode(!isDemoMode);
  }, [isDemoMode, setDemoMode]);

  return { isDemoMode, setDemoMode, toggleDemoMode };
}
