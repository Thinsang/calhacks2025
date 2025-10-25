"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = theme === "dark";
  return (
    <button
      aria-label="Toggle theme"
      className="group relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-border/40 bg-background/50 shadow-soft backdrop-blur-sm transition-all hover:border-border hover:bg-background/80 hover:shadow-md active:scale-95"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {/* Avoid hydration mismatch by rendering a stable icon until mounted */}
      {!mounted ? (
        <div className="h-5 w-5" />
      ) : isDark ? (
        <Sun className="h-5 w-5 text-amber-500 transition-transform group-hover:rotate-12 group-hover:scale-110" />
      ) : (
        <Moon className="h-5 w-5 text-indigo-600 transition-transform group-hover:-rotate-12 group-hover:scale-110" />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}


