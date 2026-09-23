"use client";

import { LayoutDashboard, ArrowLeftRight, Briefcase, Users, UserCog, Workflow, type LucideIcon } from "lucide-react";
import ThemeModeToggle from "@/components/ThemeModeToggle";
import SidebarCollapseButton from "@/components/SidebarCollapseButton";
import { useSidebarCollapse } from "@/components/useSidebarCollapse";
import { useSidePanel } from "@/components/SidePanelProvider";

type NavKey = "dashboard" | "conexiones" | "embudos" | "cartera" | "clientes" | "usuarios";

// "conexiones" y "embudos" no navegan a otra pagina - abren como panel
// flotante encima de la pantalla actual (ver SidePanelProvider).
const NAV_ITEMS: { key: NavKey; href?: string; label: string; Icon: LucideIcon; adminOnly?: boolean }[] = [
  { key: "dashboard", href: "/", label: "Dashboard", Icon: LayoutDashboard },
  { key: "conexiones", label: "Configuración", Icon: ArrowLeftRight },
  { key: "embudos", label: "Embudos", Icon: Workflow },
  { key: "cartera", href: "/admin/cartera", label: "Cartera", Icon: Briefcase, adminOnly: true },
  { key: "clientes", href: "/admin/clientes", label: "Clientes", Icon: Users, adminOnly: true },
  { key: "usuarios", href: "/admin/usuarios", label: "Usuarios", Icon: UserCog, adminOnly: true },
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
}: {
  active: NavKey;
  isAdmin: boolean;
  mode: "light" | "dark";
  onToggleMode: () => void;
  onLogout: () => void;
}) {
  const { collapsed, toggleCollapsed } = useSidebarCollapse();
  const { open, openConfiguracion, openEmbudos } = useSidePanel();

  return (
    <aside className="wcc-no-print bg-surface border-r border-outline md:w-[var(--sidebar-w,240px)] md:fixed md:inset-y-0 md:left-0 md:h-screen p-4 md:p-5 flex flex-col gap-4 overflow-y-auto transition-[width,background-color,border-color] duration-200">
      <div
        className={`pb-4 border-b border-outline flex items-center justify-between gap-2.5 ${
          collapsed ? "md:flex-col md:items-center md:gap-2" : ""
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/vermetricas-icon.png" alt="" className="w-9 h-9 rounded-xl shrink-0" />
          <div className={`min-w-0 ${collapsed ? "md:hidden" : ""}`}>
            <div className="text-sm font-semibold text-on-surface truncate">Vermetricas</div>
            <div className="text-[11px] text-on-surface-faint">Panel de administración</div>
          </div>
        </div>
        <SidebarCollapseButton collapsed={collapsed} onToggle={toggleCollapsed} />
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => {
          const isDrawerItem = item.key === "conexiones" || item.key === "embudos";
          const isCurrentActive = isDrawerItem
            ? open === (item.key === "conexiones" ? "configuracion" : "embudos")
            : active === item.key;
          const className = `press flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm whitespace-nowrap transition-colors duration-150 w-full text-left ${
            collapsed ? "md:justify-center" : ""
          } ${isCurrentActive ? "bg-surface-high text-on-surface" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high"}`;
          const content = (
            <>
              <span className="w-6 h-6 rounded-lg bg-surface-high grid place-items-center shrink-0">
                <item.Icon size={13} strokeWidth={2} />
              </span>
              <span className={collapsed ? "md:hidden" : ""}>{item.label}</span>
            </>
          );

          if (isDrawerItem) {
            return (
              <button
                key={item.key}
                type="button"
                title={item.label}
                onClick={item.key === "conexiones" ? openConfiguracion : openEmbudos}
                className={className}
              >
                {content}
              </button>
            );
          }

          return (
            <a key={item.key} href={item.href} title={item.label} className={className}>
              {content}
            </a>
          );
        })}
      </nav>

      <div
        className={`mt-auto pt-4 border-t border-outline flex items-center justify-between ${
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
          className="press w-9 h-9 rounded-lg bg-surface-high hover:bg-outline grid place-items-center text-on-surface-variant hover:text-on-surface transition-colors duration-150 shrink-0"
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
