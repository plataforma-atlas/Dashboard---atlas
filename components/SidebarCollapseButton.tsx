"use client";

export default function SidebarCollapseButton({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      title={collapsed ? "Expandir menú" : "Colapsar menú"}
      aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
      className="press hidden md:grid w-9 h-9 rounded-lg bg-white/10 hover:bg-white/15 place-items-center text-white/70 hover:text-white transition-colors duration-150 shrink-0"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <line x1="9" y1="4" x2="9" y2="20" />
      </svg>
    </button>
  );
}
