"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import ThemeSwitch from "@/components/ThemeSwitch";
import { agencyTheme, ClientTheme, toLightTheme } from "@/lib/clients";

type ThemeModeContextValue = {
  mode: "light" | "dark";
  toggleMode: () => void;
  /** Cambia el tema activo (marca del cliente seleccionado, o el de agencia por defecto
   * en páginas sin cliente — login, admin, checkin). El modo claro/oscuro se le aplica
   * automáticamente, sin que quien llama tenga que preocuparse por eso. */
  setActiveTheme: (theme: ClientTheme) => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

const STORAGE_KEY = "atlas-theme-mode";

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<"light" | "dark">("dark");
  const [activeTheme, setActiveTheme] = useState<ClientTheme>(agencyTheme);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (saved === "light" || saved === "dark") setMode(saved);
  }, []);

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ mode, toggleMode, setActiveTheme }),
    [mode, toggleMode]
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeSwitch theme={mode === "light" ? toLightTheme(activeTheme) : activeTheme} />
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error("useThemeMode debe usarse dentro de ThemeModeProvider");
  return ctx;
}
