"use client";
import { createContext, useContext, useEffect, ReactNode } from "react";

type Theme = "dark";

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme: Theme = "dark";

  useEffect(() => {
    // Always apply dark theme
    document.documentElement.classList.add("dark");
  }, []);

  const value = {
    theme,
    isDarkMode: true,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
