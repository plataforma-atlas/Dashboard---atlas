"use client";

import { useEffect } from "react";
import { ClientTheme } from "@/lib/clients";

const VAR_MAP: Record<keyof ClientTheme, string> = {
  background: "--color-background",
  surface: "--color-surface",
  surfaceHigh: "--color-surface-high",
  outline: "--color-outline",
  primary: "--color-primary",
  secondary: "--color-secondary",
  onSurface: "--color-on-surface",
  onSurfaceVariant: "--color-on-surface-variant",
  onSurfaceFaint: "--color-on-surface-faint",
};

export default function ThemeSwitch({ theme }: { theme: ClientTheme }) {
  useEffect(() => {
    const root = document.documentElement;
    (Object.keys(theme) as (keyof ClientTheme)[]).forEach((key) => {
      root.style.setProperty(VAR_MAP[key], theme[key]);
    });
  }, [theme]);

  return null;
}
