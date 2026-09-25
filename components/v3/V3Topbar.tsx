"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Plus, Link2, X, Check } from "lucide-react";
import { V3CaptacionPunto, V3Dashboard, V3DashboardTipo } from "@/lib/v3/types";

const CAPTACION_LEAD_URL = process.env.NEXT_PUBLIC_CAPTACION_LEAD_URL ?? "";

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

  const [puntosAbierto, setPuntosAbierto] = useState(false);
  const [puntos, setPuntos] = useState<V3CaptacionPunto[]>([]);
  const [puntosLoading, setPuntosLoading] = useState(false);
  const [nombrePuntoNuevo, setNombrePuntoNuevo] = useState("");
  const [etiquetaPuntoNueva, setEtiquetaPuntoNueva] = useState("");
  const [creandoPunto, setCreandoPunto] = useState(false);
  const [puntoFormError, setPuntoFormError] = useState<string | null>(null);
  const [tokenCopiado, setTokenCopiado] = useState<string | null>(null);

  const dashboardSeleccionado = dashboards.find((d) => String(d.id) === dashboardIdParam) || null;

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

  async function cargarPuntos() {
    if (!clienteId || !dashboardSeleccionado) return;
    setPuntosLoading(true);
    try {
      const res = await fetch(`/api/v3/captacion-puntos?cliente_id=${clienteId}&dashboard_id=${dashboardSeleccionado.id}`, { cache: "no-store" });
      const body = await res.json();
      setPuntos(res.ok ? body.puntos ?? [] : []);
    } catch {
      setPuntos([]);
    } finally {
      setPuntosLoading(false);
    }
  }

  useEffect(() => {
    if (puntosAbierto) cargarPuntos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puntosAbierto, dashboardIdParam]);

  async function crearPunto(e: React.FormEvent) {
    e.preventDefault();
    setPuntoFormError(null);
    if (!dashboardSeleccionado) return;
    if (!nombrePuntoNuevo.trim()) {
      setPuntoFormError("Ponele un nombre al punto de captación.");
      return;
    }
    if (!etiquetaPuntoNueva.trim()) {
      setPuntoFormError("Falta la etiqueta que se le va a poner en Go High Level.");
      return;
    }
    setCreandoPunto(true);
    try {
      const res = await fetch("/api/v3/captacion-puntos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: clienteId,
          dashboard_id: dashboardSeleccionado.id,
          nombre: nombrePuntoNuevo.trim(),
          etiqueta_ghl: etiquetaPuntoNueva.trim(),
        }),
      });
      const nuevo = await res.json();
      if (!res.ok) {
        setPuntoFormError(nuevo.error || "No se pudo crear el punto de captación");
        return;
      }
      setNombrePuntoNuevo("");
      setEtiquetaPuntoNueva("");
      await cargarPuntos();
    } catch {
      setPuntoFormError("No se pudo conectar al servidor");
    } finally {
      setCreandoPunto(false);
    }
  }

  function copiarEndpoint(punto: V3CaptacionPunto) {
    const url = `${CAPTACION_LEAD_URL}?token=${punto.token}`;
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setTokenCopiado(punto.token);
        setTimeout(() => setTokenCopiado((actual) => (actual === punto.token ? null : actual)), 2000);
      })
      .catch(() => {});
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
        <div className="flex items-center gap-2">
          {dashboardSeleccionado?.tipo === "lanzamiento" && (
            <button
              type="button"
              onClick={() => {
                setPuntosAbierto((v) => !v);
                setFormAbierto(false);
              }}
              className="press flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-md border border-outline hover:border-primary text-on-surface font-medium transition-colors duration-150"
            >
              <Link2 size={14} /> Puntos de captación
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setFormAbierto((v) => !v);
              setPuntosAbierto(false);
            }}
            className="press flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-md border border-outline hover:border-primary text-on-surface font-medium transition-colors duration-150"
          >
            <Plus size={14} /> Crear nuevo
          </button>
        </div>
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

      {puntosAbierto && dashboardSeleccionado && (
        <div className="animate-fade-in-up px-4 md:px-8 pb-4 flex flex-col gap-3">
          <p className="text-[13px] text-on-surface-variant">
            Cada punto es una landing distinta para <span className="font-medium text-on-surface">{dashboardSeleccionado.nombre}</span> — copiá su
            enlace y pegalo como el webhook de tu página de captación.
          </p>

          {puntosLoading ? (
            <p className="text-[13px] text-on-surface-faint">Cargando…</p>
          ) : puntos.length === 0 ? (
            <p className="text-[13px] text-on-surface-faint">Todavía no hay puntos de captación para este dashboard.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {puntos.map((punto) => (
                <div key={punto.id} className="rounded-lg border border-outline bg-surface p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-on-surface">{punto.nombre}</div>
                    <div className="text-[12px] text-on-surface-faint font-mono truncate">Etiqueta GHL: {punto.etiqueta_ghl}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copiarEndpoint(punto)}
                    className="press flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-md border border-outline hover:border-primary text-on-surface font-medium shrink-0 transition-colors duration-150"
                  >
                    {tokenCopiado === punto.token ? (
                      <>
                        <Check size={14} /> Copiado
                      </>
                    ) : (
                      <>
                        <Link2 size={14} /> Copiar enlace
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={crearPunto} className="flex flex-col sm:flex-row sm:items-end gap-3 pt-1 border-t border-outline">
            <div className="flex flex-col gap-1.5 flex-1 min-w-0 mt-3">
              <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Nombre del punto</label>
              <input
                type="text"
                value={nombrePuntoNuevo}
                onChange={(e) => setNombrePuntoNuevo(e.target.value)}
                placeholder="Ej. Landing principal"
                className="bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface focus:border-primary outline-none transition-colors duration-150"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-0 mt-3">
              <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Etiqueta para Go High Level</label>
              <input
                type="text"
                value={etiquetaPuntoNueva}
                onChange={(e) => setEtiquetaPuntoNueva(e.target.value)}
                placeholder="Ej. lanzamiento_octubre_registrado"
                className="bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface font-mono focus:border-primary outline-none transition-colors duration-150"
              />
            </div>
            <div className="flex items-center gap-3 shrink-0 mt-3">
              <button
                type="submit"
                disabled={creandoPunto}
                className="press rounded-md bg-primary text-on-primary text-[14px] font-medium px-4 py-2 disabled:opacity-50 transition-transform duration-150"
              >
                {creandoPunto ? "Creando…" : "Agregar punto"}
              </button>
              <button
                type="button"
                onClick={() => setPuntosAbierto(false)}
                className="press text-[14px] text-on-surface-variant hover:text-on-surface transition-colors duration-150"
              >
                <X size={16} />
              </button>
            </div>
          </form>
          {puntoFormError && <p className="text-sm text-error">{puntoFormError}</p>}
        </div>
      )}
    </div>
  );
}
