"use client";

import { useEffect } from "react";
import { ClientTheme } from "@/lib/clients";

const VAR_MAP: Record<keyof ClientTheme, string> = {
  bg: "--c-bg",
  panel: "--c-panel",
  panel2: "--c-panel2",
  stroke: "--c-stroke",
  accent: "--c-accent",
  accent2: "--c-accent2",
  text: "--c-text",
  mute: "--c-mute",
  faint: "--c-faint",
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
