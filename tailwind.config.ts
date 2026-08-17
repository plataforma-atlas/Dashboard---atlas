import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Todos apuntan a variables CSS que cada cliente sobreescribe en runtime
        // (ver lib/clients.ts y components/ThemeSwitch.tsx). Nombres alineados
        // 1:1 con DESIGN.md -> colors.*
        background: "var(--color-background, #1A1A1A)",
        surface: "var(--color-surface, #221F1A)",
        "surface-high": "var(--color-surface-high, #2A2620)",
        outline: "var(--color-outline, #3A3428)",
        primary: "var(--color-primary, #C9A96E)",
        secondary: "var(--color-secondary, #D4C5A0)",
        "on-surface": "var(--color-on-surface, #F5F0E8)",
        "on-surface-variant": "var(--color-on-surface-variant, #B0A48C)",
        "on-surface-faint": "var(--color-on-surface-faint, #7A715E)",
        // Colores de SISTEMA — fijos, no cambian con el cliente (DESIGN.md regla 7)
        error: "#F04438",
        "error-container": "rgba(240, 68, 56, 0.1)",
        "outline-error": "rgba(240, 68, 56, 0.4)",
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
