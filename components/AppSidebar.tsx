"use client";

import ThemeModeToggle from "@/components/ThemeModeToggle";
import SidebarCollapseButton from "@/components/SidebarCollapseButton";
import { useSidebarCollapse } from "@/components/useSidebarCollapse";

type NavKey = "dashboard" | "conexiones" | "cartera" | "clientes" | "usuarios";

const NAV_ITEMS: { key: NavKey; href: string; label: string; icon: string; adminOnly?: boolean }[] = [
  { key: "dashboard", href: "/", label: "Dashboard", icon: "⌂" },
  { key: "conexiones", href: "/panel/conexiones", label: "Conexiones", icon: "⇄" },
  { key: "cartera", href: "/admin/cartera", label: "Cartera", icon: "▦", adminOnly: true },
  { key: "clientes", href: "/admin/clientes", label: "Clientes", icon: "◎", adminOnly: true },
  { key: "usuarios", href: "/admin/usuarios", label: "Usuarios", icon: "◈", adminOnly: true },
];

// Sidebar fijo genérico para las pantallas que no tienen un cliente propio
// seleccionado (admin/cartera, admin/clientes, admin/usuarios) o que
// cualquier rol puede visitar (panel/conexiones) — mismo look que el
// sidebar del dashboard principal y el Control Center, pero sin el
// selector de cliente/campaña, que no aplica acá.
export default function AppSidebar({
  active,
  isAdmin,
  mode,
  onToggleMode,
  onLogout,
  conexionesHref,
}: {
  active: NavKey;
  isAdmin: boolean;
  mode: "light" | "dark";
  onToggleMode: () => void;
  onLogout: () => void;
  conexionesHref?: string;
}) {
  const { collapsed, toggleCollapsed } = useSidebarCollapse();

  return (
    <aside className="wcc-no-print bg-[#111218] md:w-[var(--sidebar-w,240px)] md:fixed md:inset-y-0 md:left-0 md:h-screen p-4 md:p-5 flex flex-col gap-4 overflow-y-auto transition-[width] duration-200">
      <div
        className={`pb-4 border-b border-white/10 flex items-center justify-between gap-2.5 ${
          collapsed ? "md:flex-col md:items-center md:gap-2" : ""
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/vermetricas-icon.png" alt="" className="w-9 h-9 rounded-xl shrink-0" />
          <div className={`min-w-0 ${collapsed ? "md:hidden" : ""}`}>
            <div className="text-[13px] font-semibold text-white truncate">Vermetricas</div>
            <div className="text-[10px] text-white/50">Panel de administración</div>
          </div>
        </div>
        <SidebarCollapseButton collapsed={collapsed} onToggle={toggleCollapsed} />
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => (
          <a
            key={item.key}
            href={item.key === "conexiones" && conexionesHref ? conexionesHref : item.href}
            title={item.label}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] whitespace-nowrap transition ${
              collapsed ? "md:justify-center" : ""
            } ${active === item.key ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}
          >
            <span className="w-6 h-6 rounded-lg bg-white/10 grid place-items-center text-[11px] shrink-0">{item.icon}</span>
            <span className={collapsed ? "md:hidden" : ""}>{item.label}</span>
          </a>
        ))}
      </nav>

      <div
        className={`mt-auto pt-4 border-t border-white/10 flex items-center justify-between ${
          collapsed ? "md:flex-col md:items-center md:gap-2" : ""
        }`}
      >
        <div className={collapsed ? "md:hidden" : ""}>
          <ThemeModeToggle mode={mode} onToggle={onToggleMode} />
        </div>
        <button
          onClick={onLogout}
          title="Salir"
          aria-label="Salir"
          className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/15 grid place-items-center text-white/70 hover:text-white transition shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
