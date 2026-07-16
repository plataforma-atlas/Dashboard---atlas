import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Todos apuntan a variables CSS que cada cliente sobreescribe en runtime
        // (ver lib/clients.ts y components/ThemeSwitch.tsx). Los valores de abajo
        // son solo el fallback antes de hidratar.
        hull: "var(--c-bg, #0B0E14)",
        panel: "var(--c-panel, #12161F)",
        panel2: "var(--c-panel2, #181D29)",
        stroke: "var(--c-stroke, #232838)",
        signal: "var(--c-accent, #F5A623)",
        go: "var(--c-accent2, #34D2A6)",
        ink: "var(--c-text, #E8EAF0)",
        mute: "var(--c-mute, #8892A6)",
        faint: "var(--c-faint, #4B5468)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(245,166,35,0.25), 0 0 24px rgba(245,166,35,0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
