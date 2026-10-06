"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Clapperboard, Database, LayoutDashboard, LifeBuoy, Link2, LogOut, Megaphone, UserCog, UserPlus, Users, X } from "lucide-react";
import ThemeModeToggle from "@/components/ThemeModeToggle";
import SidebarCollapseButton from "@/components/SidebarCollapseButton";
import { useSidebarCollapse } from "@/components/useSidebarCollapse";
import { useThemeMode } from "@/components/ThemeModeProvider";
import V3ClientSwitcher from "@/components/v3/V3ClientSwitcher";
import { useAcceso } from "@/components/v3/useAcceso";

type Session = { authenticated: boolean; role?: "admin" | "client"; clientes?: string[] };
type Cliente = { id: string; name: string };

export default function V3Sidebar({
  mobileOpen = false,
  onCloseMobile,
}: {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ clienteId?: string }>();
  const clienteIdActual = typeof params?.clienteId === "string" ? params.clienteId : undefined;
  const searchParams = useSearchParams();
  const dashboardIdParam = searchParams.get("dashboard");
  const dashboardQuery = dashboardIdParam ? `?dashboard=${dashboardIdParam}` : "";

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
  const acceso = useAcceso(clienteIdActual);
  const puedeCambiarCliente = clientes.length > 1;

  // Cada link de acá abajo es un <a> normal (navegación real, no SPA), así
  // que el layout no se desmonta entre páginas del mismo /v3/* — sin esto el
  // panel mobile quedaría abierto después de tocar un link.
  useEffect(() => {
    onCloseMobile?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Backdrop mobile — solo existe cuando el panel está abierto, toca afuera para cerrar. */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/60" onClick={onCloseMobile} aria-hidden="true" />
      )}
      <aside
        className={`bg-surface border-r border-outline w-[240px] fixed inset-y-0 left-0 z-40 h-screen p-4 flex flex-col gap-4 overflow-y-auto overflow-x-hidden transition-transform duration-200 md:transition-[width,background-color,border-color] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:w-[var(--sidebar-w,240px)] md:p-5`}
      >
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
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Cerrar menú"
            className="press md:hidden w-8 h-8 rounded-lg bg-surface-high grid place-items-center text-on-surface-variant shrink-0"
          >
            <X size={16} strokeWidth={2} />
          </button>
          <div className="hidden md:block">
            <SidebarCollapseButton collapsed={collapsed} onToggle={toggleCollapsed} />
          </div>
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


      <nav className="flex flex-col gap-1">
        {(() => {
          const dashboardActive = clienteIdActual ? pathname === `/v3/${clienteIdActual}` : true;
          return (
            <a
              href={clienteIdActual ? `/v3/${clienteIdActual}${dashboardQuery}` : "/v3"}
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
            href={`/v3/${clienteIdActual}/anuncios${dashboardQuery}`}
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
            href={`/v3/${clienteIdActual}/analisis${dashboardQuery}`}
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

        {clienteIdActual && (
          <a
            href={`/v3/${clienteIdActual}/base-datos${dashboardQuery}`}
            title="Base de datos"
            className={`press flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm min-w-0 transition-colors duration-150 ${
              pathname === `/v3/${clienteIdActual}/base-datos`
                ? "bg-surface-high text-on-surface"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high"
            } ${collapsed ? "md:justify-center" : ""}`}
          >
            <span className="w-6 h-6 rounded-lg bg-primary/20 text-primary grid place-items-center shrink-0">
              <Users size={13} strokeWidth={2} />
            </span>
            <span className={`truncate ${collapsed ? "md:hidden" : ""}`}>Base de datos</span>
          </a>
        )}
      </nav>

      {/* Configuraciones — conexiones y lo que se agregue a futuro (ej. integración con Claude) va acá abajo, separado del contenido principal. */}
      {clienteIdActual && (
        <nav className="flex flex-col gap-1 pt-4 border-t border-outline">
          {!acceso.soloLectura && (
          <a
            href={`/v3/${clienteIdActual}/conexiones`}
            title="Conexiones"
            className={`press flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm min-w-0 transition-colors duration-150 ${
              pathname === `/v3/${clienteIdActual}/conexiones`
                ? "bg-surface-high text-on-surface"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high"
            } ${collapsed ? "md:justify-center" : ""}`}
          >
            <span className="w-6 h-6 rounded-lg bg-primary/20 text-primary grid place-items-center shrink-0">
              <Database size={13} strokeWidth={2} />
            </span>
            <span className={`truncate ${collapsed ? "md:hidden" : ""}`}>Conexiones</span>
          </a>
          )}
          {!acceso.soloLectura && (
          <a
            href={`/v3/${clienteIdActual}/webhooks${dashboardQuery}`}
            title="Webhooks"
            className={`press flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm min-w-0 transition-colors duration-150 ${
              pathname === `/v3/${clienteIdActual}/webhooks`
                ? "bg-surface-high text-on-surface"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high"
            } ${collapsed ? "md:justify-center" : ""}`}
          >
            <span className="w-6 h-6 rounded-lg bg-primary/20 text-primary grid place-items-center shrink-0">
              <Link2 size={13} strokeWidth={2} />
            </span>
            <span className={`truncate ${collapsed ? "md:hidden" : ""}`}>Webhooks</span>
          </a>
          )}
          <a
            href={`/v3/${clienteIdActual}/equipo`}
            title="Equipo"
            className={`press flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm min-w-0 transition-colors duration-150 ${
              pathname === `/v3/${clienteIdActual}/equipo`
                ? "bg-surface-high text-on-surface"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high"
            } ${collapsed ? "md:justify-center" : ""}`}
          >
            <span className="w-6 h-6 rounded-lg bg-primary/20 text-primary grid place-items-center shrink-0">
              <UserPlus size={13} strokeWidth={2} />
            </span>
            <span className={`truncate ${collapsed ? "md:hidden" : ""}`}>Equipo</span>
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
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/soporte"
            title="Soporte"
            aria-label="Soporte"
            className="press w-9 h-9 rounded-lg bg-surface-high hover:bg-outline grid place-items-center text-on-surface-variant hover:text-on-surface transition-colors duration-150"
          >
            <LifeBuoy size={16} strokeWidth={2} />
          </a>
          {isAdmin && (
            <a
              href="/v3/usuarios"
              title="Usuarios"
              aria-label="Usuarios"
              className={`press w-9 h-9 rounded-lg grid place-items-center transition-colors duration-150 ${
                pathname === "/v3/usuarios"
                  ? "bg-surface-high text-on-surface"
                  : "bg-surface-high hover:bg-outline text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <UserCog size={16} strokeWidth={2} />
            </a>
          )}
          <button
            onClick={handleLogout}
            title="Salir"
          aria-label="Salir"
          className="press w-9 h-9 rounded-lg bg-surface-high hover:bg-outline grid place-items-center text-on-surface-variant hover:text-on-surface transition-colors duration-150 shrink-0"
        >
          <LogOut size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
