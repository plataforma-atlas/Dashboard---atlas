export default function ThemeModeToggle({ mode, onToggle }: { mode: "light" | "dark"; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface border border-outline rounded-full px-3 py-1.5 transition"
    >
      <span>{mode === "dark" ? "🌙" : "☀️"}</span>
      <span>{mode === "dark" ? "Oscuro" : "Claro"}</span>
    </button>
  );
}
