export default function ThemeModeToggle({ mode, onToggle }: { mode: "light" | "dark"; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="press flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface border border-outline rounded-full px-3 py-1.5 transition-colors duration-150"
    >
      <span>{mode === "dark" ? "🌙" : "☀️"}</span>
      <span>{mode === "dark" ? "Oscuro" : "Claro"}</span>
    </button>
  );
}
