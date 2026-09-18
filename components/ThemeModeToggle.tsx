"use client";

import { Moon, Sun } from "lucide-react";

export default function ThemeModeToggle({ mode, onToggle }: { mode: "light" | "dark"; onToggle: () => void }) {
  const isDark = mode === "dark";
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="press relative flex items-center justify-between w-16 h-8 p-1 rounded-full border border-outline bg-surface-high transition-colors duration-200 shrink-0"
    >
      <span
        aria-hidden
        className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-primary shadow-sm transition-transform duration-200 ease-out ${
          isDark ? "translate-x-0" : "translate-x-8"
        }`}
      />
      <span className="relative z-10 grid place-items-center w-6 h-6">
        <Moon size={13} strokeWidth={2} className={isDark ? "text-on-primary" : "text-on-surface-faint"} />
      </span>
      <span className="relative z-10 grid place-items-center w-6 h-6">
        <Sun size={13} strokeWidth={2} className={isDark ? "text-on-surface-faint" : "text-on-primary"} />
      </span>
    </button>
  );
}
