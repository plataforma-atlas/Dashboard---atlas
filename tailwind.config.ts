import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Identidad única del sistema (ver lib/clients.ts + components/ThemeSwitch.tsx) —
        // ya no varía por cliente. Nombres alineados 1:1 con DESIGN.md -> colors.*
        background: "var(--color-background, #0E1015)",
        surface: "var(--color-surface, #181A22)",
        "surface-high": "var(--color-surface-high, #1F222C)",
        outline: "var(--color-outline, #272A35)",
        primary: "var(--color-primary, #7C7CFB)",
        secondary: "var(--color-secondary, #A5A0FF)",
        "on-surface": "var(--color-on-surface, #F3F4F6)",
        "on-surface-variant": "var(--color-on-surface-variant, #9CA3AF)",
        "on-surface-faint": "var(--color-on-surface-faint, #6B7280)",
        "on-primary": "var(--color-on-primary, #FFFFFF)",
        // Colores de SISTEMA — fijos (DESIGN.md regla 7)
        error: "var(--color-error, #F04438)",
        "error-container": "color-mix(in srgb, var(--color-error, #F04438) 12%, transparent)",
        "outline-error": "color-mix(in srgb, var(--color-error, #F04438) 40%, transparent)",
        success: "var(--color-success, #16834A)",
        "success-container": "color-mix(in srgb, var(--color-success, #16834A) 12%, transparent)",
        "outline-success": "color-mix(in srgb, var(--color-success, #16834A) 40%, transparent)",
        warning: "var(--color-warning, #D97706)",
        "warning-container": "color-mix(in srgb, var(--color-warning, #D97706) 12%, transparent)",
        "outline-warning": "color-mix(in srgb, var(--color-warning, #D97706) 40%, transparent)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
