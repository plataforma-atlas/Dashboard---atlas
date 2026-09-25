"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ChevronDown, Clapperboard, Database, LayoutDashboard, LogOut, Megaphone, Undo2 } from "lucide-react";
import ThemeModeToggle from "@/components/ThemeModeToggle";
import SidebarCollapseButton from "@/components/SidebarCollapseButton";
import { useSidebarCollapse } from "@/components/useSidebarCollapse";
import { useThemeMode } from "@/components/ThemeModeProvider";
import V3ClientSwitcher from "@/components/v3/V3ClientSwitcher";

type Session = { authenticated: boolean; role?: "admin" | "client"; clientes?: string[] };
type Cliente = { id: string; name: string };

export default function V3Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ clienteId?: string }>();
  const clienteIdActual = typeof params?.clienteId === "string" ? params.clienteId : undefined;

  const { collapsed, toggleCollapsed } = useSidebarCollapse();
  const { mode, toggleMode } = useThemeMode();

  const [session, setSession] = useState<Session>({ authenticated: false });
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [switcherAbierto, setSwitcherAbierto] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : { authenticated: false }))
      .then((data: Session) => setSession(data))
      .catch(() => setSession({ authenticated: false }));
  }, []);

  useEffect(() => {
    if (!session.authenticated) return;
    fetch("/api/clientes", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setClientes(data.clientes ?? []))
      .catch(() => setClientes([]));
  }, [session.authenticated]);

  const isAdmin = session.role === "admin";
  const clienteActual = clientes.find((c) => c.id === clienteIdActual);
  const puedeCambiarCliente = isAdmin && clientes.length > 1;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="bg-surface border-r border-outline md:w-[var(--sidebar-w,240px)] md:fixed md:inset-y-0 md:left-0 md:h-screen p-4 md:p-5 flex flex-col gap-4 overflow-y-auto overflow-x-hidden transition-[width,background-color,border-color] duration-200">
      <div
        className={`pb-4 border-b border-outline flex items-center justify-between gap-2.5 ${
          collapsed ? "md:flex-col md:items-center md:gap-2" : ""
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/vermetricas-icon.png" alt="" className="w-9 h-9 rounded-xl shrink-0" />
          <div className={`min-w-0 ${collapsed ? "md:hidden" : ""}`}>
            <div className="text-sm font-semibold text-on-surface flex items-center gap-1.5 min-w-0">
              <span className="truncate">Vermetricas</span>
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-primary bg-surface-high px-1.5 py-0.5 rounded leading-none">
                V3
              </span>
            </div>
            <div className="text-[11px] text-on-surface-faint truncate">Nuevo dashboard</div>
          </div>
        </div>
        <SidebarCollapseButton collapsed={collapsed} onToggle={toggleCollapsed} />
      </div>

      {clienteIdActual && (
        <div className="relative">
          <button
            type="button"
            onClick={() => puedeCambiarCliente && setSwitcherAbierto((v) => !v)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-surface-high text-left transition-colors duration-150 ${
              puedeCambiarCliente ? "press hover:bg-outline cursor-pointer" : "cursor-default"
            } ${collapsed ? "md:justify-center" : ""}`}
          >
            <span className="w-6 h-6 rounded-lg bg-primary/20 text-primary grid place-items-center text-[11px] font-semibold shrink-0">
              {(clienteActual?.name || clienteIdActual).slice(0, 1).toUpperCase()}
            </span>
            <span className={`min-w-0 flex-1 ${collapsed ? "md:hidden" : ""}`}>
              <span className="block text-sm text-on-surface truncate">{clienteActual?.name || clienteIdActual}</span>
            </span>
            {puedeCambiarCliente && (
              <ChevronDown size={14} className={`text-on-surface-variant shrink-0 transition-transform ${switcherAbierto ? "rotate-180" : ""} ${collapsed ? "md:hidden" : ""}`} />
            )}
          </button>
          {switcherAbierto && puedeCambiarCliente && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setSwitcherAbierto(false)} />
              <V3ClientSwitcher clients={clientes} currentId={clienteIdActual} />
            </>
          )}
        </div>
      )}

      <a
        href="/"
        title="Volver a la versión clásica"
        className={`press flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border border-outline text-on-surface-variant hover:text-on-surface hover:bg-surface-high transition-colors duration-150 ${
          collapsed ? "md:justify-center" : ""
        }`}
      >
        <Undo2 size={14} strokeWidth={2} className="shrink-0" />
        <span className={collapsed ? "md:hidden" : ""}>Volver a la versión clásica</span>
      </a>

      <nav className="flex flex-col gap-1">
        {(() => {
          const dashboardActive = clienteIdActual ? pathname === `/v3/${clienteIdActual}` : true;
          return (
            <a
              href={clienteIdActual ? `/v3/${clienteIdActual}` : "/v3"}
              title="Dashboard"
              className={`press flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm min-w-0 transition-colors duration-150 ${
                dashboardActive ? "bg-surface-high text-on-surface" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high"
              } ${collapsed ? "md:justify-center" : ""}`}
            >
              <span className="w-6 h-6 rounded-lg bg-primary/20 text-primary grid place-items-center shrink-0">
                <LayoutDashboard size={13} strokeWidth={2} />
              </span>
              <span className={`truncate ${collapsed ? "md:hidden" : ""}`}>Dashboard</span>
            </a>
          );
        })()}

        {clienteIdActual && (
          <a
            href={`/v3/${clienteIdActual}/anuncios`}
            title="Administrador de Anuncios"
            className={`press flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm min-w-0 transition-colors duration-150 ${
              pathname === `/v3/${clienteIdActual}/anuncios`
                ? "bg-surface-high text-on-surface"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high"
            } ${collapsed ? "md:justify-center" : ""}`}
          >
            <span className="w-6 h-6 rounded-lg bg-primary/20 text-primary grid place-items-center shrink-0">
              <Megaphone size={13} strokeWidth={2} />
            </span>
            <span className={`truncate ${collapsed ? "md:hidden" : ""}`}>Administrador de Anuncios</span>
          </a>
        )}

        {clienteIdActual && (
          <a
            href={`/v3/${clienteIdActual}/analisis`}
            title="Análisis de Anuncios"
            className={`press flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm min-w-0 transition-colors duration-150 ${
              pathname === `/v3/${clienteIdActual}/analisis`
                ? "bg-surface-high text-on-surface"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high"
            } ${collapsed ? "md:justify-center" : ""}`}
          >
            <span className="w-6 h-6 rounded-lg bg-primary/20 text-primary grid place-items-center shrink-0">
              <Clapperboard size={13} strokeWidth={2} />
            </span>
            <span className={`truncate ${collapsed ? "md:hidden" : ""}`}>Análisis de Anuncios</span>
          </a>
        )}
      </nav>

      {/* Configuraciones — conexiones y lo que se agregue a futuro (ej. integración con Claude) va acá abajo, separado del contenido principal. */}
      {clienteIdActual && (
        <nav className="flex flex-col gap-1 pt-4 border-t border-outline">
          <a
            href={`/v3/${clienteIdActual}/conexoes`}
            title="Conexiones"
            className={`press flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm min-w-0 transition-colors duration-150 ${
              pathname === `/v3/${clienteIdActual}/conexoes`
                ? "bg-surface-high text-on-surface"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high"
            } ${collapsed ? "md:justify-center" : ""}`}
          >
            <span className="w-6 h-6 rounded-lg bg-primary/20 text-primary grid place-items-center shrink-0">
              <Database size={13} strokeWidth={2} />
            </span>
            <span className={`truncate ${collapsed ? "md:hidden" : ""}`}>Conexiones</span>
          </a>
        </nav>
      )}

      <div
        className={`mt-auto pt-4 border-t border-outline flex items-center justify-between ${
          collapsed ? "md:flex-col md:items-center md:gap-2" : ""
        }`}
      >
        <div className={collapsed ? "md:hidden" : ""}>
          <ThemeModeToggle mode={mode} onToggle={toggleMode} />
        </div>
        <button
          onClick={handleLogout}
          title="Salir"
          aria-label="Salir"
          className="press w-9 h-9 rounded-lg bg-surface-high hover:bg-outline grid place-items-center text-on-surface-variant hover:text-on-surface transition-colors duration-150 shrink-0"
        >
          <LogOut size={16} strokeWidth={2} />
        </button>
      </div>
    </aside>
  );
}
