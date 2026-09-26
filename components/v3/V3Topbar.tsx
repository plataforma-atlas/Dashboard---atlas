"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { V3Dashboard, V3DashboardTipo } from "@/lib/v3/types";

// Barra global de dashboards (proyectos filtrados por nomenclatura) — vive en
// el layout de la V3 para que el selector esté disponible en cualquier
// pantalla, no solo en Administrador de Anuncios. Hoy solo esa pantalla
// reacciona al dashboard elegido; ver plan en purrfect-humming-backus.md.
export default function V3Topbar() {
  const params = useParams<{ clienteId?: string }>();
  const clienteId = typeof params?.clienteId === "string" ? params.clienteId : undefined;
  const router = useRouter();
  const searchParams = useSearchParams();
  const dashboardIdParam = searchParams.get("dashboard") ?? "";

  const [dashboards, setDashboards] = useState<V3Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [formAbierto, setFormAbierto] = useState(false);
  const [tipoNuevo, setTipoNuevo] = useState<V3DashboardTipo>("lanzamiento");
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [nomenclaturaNueva, setNomenclaturaNueva] = useState("");
  const [creando, setCreando] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function cargarDashboards() {
    if (!clienteId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v3/dashboards?cliente_id=${clienteId}`, { cache: "no-store" });
      const body = await res.json();
      setDashboards(res.ok ? body.dashboards ?? [] : []);
    } catch {
      setDashboards([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarDashboards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  if (!clienteId) return null;

  function seleccionarDashboard(id: string) {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("dashboard", id);
    else url.searchParams.delete("dashboard");
    router.push(url.pathname + url.search);
  }

  async function crearDashboard(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!nombreNuevo.trim()) {
      setFormError("Ponele un nombre al dashboard.");
      return;
    }
    setCreando(true);
    try {
      const res = await fetch("/api/v3/dashboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, nombre: nombreNuevo.trim(), nomenclatura_filtro: nomenclaturaNueva.trim(), tipo: tipoNuevo }),
      });
      const nuevo = await res.json();
      if (!res.ok) {
        setFormError(nuevo.error || "No se pudo crear el dashboard");
        return;
      }
      setNombreNuevo("");
      setNomenclaturaNueva("");
      setTipoNuevo("lanzamiento");
      setFormAbierto(false);
      await cargarDashboards();
      seleccionarDashboard(String(nuevo.id));
    } catch {
      setFormError("No se pudo conectar al servidor");
    } finally {
      setCreando(false);
    }
  }

  return (
    <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur border-b border-outline">
      <div className="px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.1em] text-on-surface-faint hidden sm:inline">Dashboard</span>
          {!loading && (
            <select
              value={dashboardIdParam}
              onChange={(e) => seleccionarDashboard(e.target.value)}
              className="bg-surface-high border border-outline rounded-md px-3 py-1.5 text-[13px] text-on-surface outline-none focus:border-primary transition-colors duration-150"
            >
              <option value="">Todas las campañas</option>
              {dashboards.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.tipo === "webinar" ? "Webinar" : "Lanzamiento"} · {d.nombre}
                </option>
              ))}
            </select>
          )}
        </div>
        <button
          type="button"
          onClick={() => setFormAbierto((v) => !v)}
          className="press flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-md border border-outline hover:border-primary text-on-surface font-medium transition-colors duration-150"
        >
          <Plus size={14} /> Crear nuevo
        </button>
      </div>

      {formAbierto && (
        <form
          onSubmit={crearDashboard}
          className="animate-fade-in-up px-4 md:px-8 pb-4 flex flex-col sm:flex-row sm:items-end gap-3"
        >
          <div className="flex flex-col gap-1.5 shrink-0">
            <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Tipo</label>
            <div className="flex items-center gap-1.5">
              {(["lanzamiento", "webinar"] as const).map((opcion) => (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => setTipoNuevo(opcion)}
                  className={`press text-[13px] px-3 py-2 rounded-md border font-medium transition-colors duration-150 ${
                    tipoNuevo === opcion
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-outline text-on-surface-variant hover:border-primary hover:text-on-surface"
                  }`}
                >
                  {opcion === "webinar" ? "Webinar" : "Lanzamiento"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Nombre del dashboard</label>
            <input
              type="text"
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              placeholder="Ej. Lanzamiento Agosto"
              className="bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface focus:border-primary outline-none transition-colors duration-150"
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Nomenclatura de campaña (opcional)</label>
            <input
              type="text"
              value={nomenclaturaNueva}
              onChange={(e) => setNomenclaturaNueva(e.target.value)}
              placeholder="Ej. LAN0826"
              className="bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface font-mono focus:border-primary outline-none transition-colors duration-150"
            />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="submit"
              disabled={creando}
              className="press rounded-md bg-primary text-on-primary text-[14px] font-medium px-4 py-2 disabled:opacity-50 transition-transform duration-150"
            >
              {creando ? "Creando…" : "Crear"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormAbierto(false);
                setFormError(null);
              }}
              className="press text-[14px] text-on-surface-variant hover:text-on-surface transition-colors duration-150"
            >
              Cancelar
            </button>
          </div>
          {formError && <p className="text-sm text-error basis-full">{formError}</p>}
        </form>
      )}
    </div>
  );
}
