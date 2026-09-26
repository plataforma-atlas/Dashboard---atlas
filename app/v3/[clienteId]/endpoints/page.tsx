"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Check, Link2, Plus } from "lucide-react";
import VermetricasLoader from "@/components/VermetricasLoader";
import { V3CaptacionPunto, V3Dashboard, V3EndpointTipo } from "@/lib/v3/types";

const ETIQUETAS_ENDPOINT: Record<"captacion" | V3EndpointTipo, string> = {
  captacion: "Captación",
  encuesta: "Encuesta",
  gracias: "Página de gracias",
  grupos: "Ingreso a grupos (SendFlow)",
  mensaje_recibido: "Mensaje 1a1 recibido",
};

const PATH_ENDPOINT: Record<"captacion" | V3EndpointTipo, string> = {
  captacion: "integraciones/captacion-lead",
  encuesta: "integraciones/embudo-encuesta",
  gracias: "integraciones/embudo-gracias",
  grupos: "integraciones/embudo-grupos",
  mensaje_recibido: "integraciones/embudo-mensaje-recibido",
};

function construirEnlace(path: string, token: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/api/hooks/${path}?token=${token}`;
}

export default function V3EndpointsPage() {
  const params = useParams<{ clienteId: string }>();
  const clienteId = params.clienteId;
  const searchParams = useSearchParams();
  const dashboardIdParam = searchParams.get("dashboard") ?? "";

  const [isAdmin, setIsAdmin] = useState(false);
  const [dashboards, setDashboards] = useState<V3Dashboard[]>([]);
  const [dashboardsLoading, setDashboardsLoading] = useState(true);

  const [puntos, setPuntos] = useState<V3CaptacionPunto[]>([]);
  const [puntosLoading, setPuntosLoading] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [etiquetaNueva, setEtiquetaNueva] = useState("");
  const [creando, setCreando] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : { authenticated: false }))
      .then((data) => setIsAdmin(data?.role === "admin"))
      .catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    if (!clienteId) return;
    setDashboardsLoading(true);
    fetch(`/api/v3/dashboards?cliente_id=${clienteId}`, { cache: "no-store" })
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => setDashboards(ok ? body.dashboards ?? [] : []))
      .catch(() => setDashboards([]))
      .finally(() => setDashboardsLoading(false));
  }, [clienteId]);

  const dashboardActual = dashboards.find((d) => String(d.id) === dashboardIdParam) ?? null;

  async function cargarPuntos() {
    if (!dashboardActual) return;
    setPuntosLoading(true);
    try {
      const res = await fetch(`/api/v3/captacion-puntos?cliente_id=${clienteId}&dashboard_id=${dashboardActual.id}`, { cache: "no-store" });
      const body = await res.json();
      setPuntos(res.ok ? body.puntos ?? [] : []);
    } catch {
      setPuntos([]);
    } finally {
      setPuntosLoading(false);
    }
  }

  useEffect(() => {
    cargarPuntos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardActual?.id]);

  async function crearPunto(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!dashboardActual) return;
    if (!nombreNuevo.trim()) {
      setFormError("Ponele un nombre al punto de captación.");
      return;
    }
    if (!etiquetaNueva.trim()) {
      setFormError("Falta la etiqueta que se le va a poner en Go High Level.");
      return;
    }
    setCreando(true);
    try {
      const res = await fetch("/api/v3/captacion-puntos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, dashboard_id: dashboardActual.id, nombre: nombreNuevo.trim(), etiqueta_ghl: etiquetaNueva.trim() }),
      });
      const nuevo = await res.json();
      if (!res.ok) {
        setFormError(nuevo.error || "No se pudo crear el punto de captación");
        return;
      }
      setNombreNuevo("");
      setEtiquetaNueva("");
      await cargarPuntos();
    } catch {
      setFormError("No se pudo conectar al servidor");
    } finally {
      setCreando(false);
    }
  }

  function copiar(path: string, token: string) {
    const url = construirEnlace(path, token);
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setCopiado(token);
        setTimeout(() => setCopiado((actual) => (actual === token ? null : actual)), 2000);
      })
      .catch(() => {});
  }

  if (dashboardsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <VermetricasLoader />
      </div>
    );
  }

  return (
    <div className="px-4 py-8 md:px-8 max-w-4xl mx-auto flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-[0.14em] text-primary font-mono">Endpoints</span>
        <h1 className="font-display text-2xl text-on-surface font-semibold">Puntos de captación y su embudo</h1>
        <p className="text-sm text-on-surface-variant">
          Cada punto es una landing distinta — copiá sus enlaces y pegalos donde corresponda (tu página, tu encuesta, SendFlow).
        </p>
      </header>

      {!dashboardActual ? (
        <p className="text-[13px] text-on-surface-faint py-8 text-center">
          Elegí un dashboard de tipo Lanzamiento en el selector de arriba para ver sus endpoints.
        </p>
      ) : dashboardActual.tipo !== "lanzamiento" ? (
        <p className="text-[13px] text-on-surface-faint py-8 text-center">Los endpoints son para dashboards de tipo Lanzamiento.</p>
      ) : (
        <>
          {puntosLoading ? (
            <p className="text-[13px] text-on-surface-faint">Cargando…</p>
          ) : puntos.length === 0 ? (
            <p className="text-[13px] text-on-surface-faint">Todavía no hay puntos de captación para {dashboardActual.nombre}.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {puntos.map((punto) => {
                const filas: { tipo: "captacion" | V3EndpointTipo; token: string }[] = [
                  { tipo: "captacion", token: punto.token_captacion },
                  ...punto.endpoints.filter((e) => isAdmin || e.tipo !== "mensaje_recibido"),
                ];
                return (
                  <div key={punto.id} className="rounded-lg border border-outline bg-surface p-4 flex flex-col gap-3">
                    <div>
                      <div className="text-[14px] font-medium text-on-surface">{punto.nombre}</div>
                      <div className="text-[12px] text-on-surface-faint font-mono">Etiqueta GHL: {punto.etiqueta_ghl}</div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {filas.map((fila) => (
                        <div key={fila.tipo} className="flex items-center justify-between gap-3 rounded-md bg-background px-3 py-2">
                          <span className="text-[13px] text-on-surface-variant shrink-0">{ETIQUETAS_ENDPOINT[fila.tipo]}</span>
                          <button
                            type="button"
                            onClick={() => copiar(PATH_ENDPOINT[fila.tipo], fila.token)}
                            className="press flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-md border border-outline hover:border-primary text-on-surface font-medium shrink-0 transition-colors duration-150"
                          >
                            {copiado === fila.token ? (
                              <>
                                <Check size={12} /> Copiado
                              </>
                            ) : (
                              <>
                                <Link2 size={12} /> Copiar
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <form onSubmit={crearPunto} className="rounded-lg border border-outline bg-surface p-4 flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Nombre del punto</label>
              <input
                type="text"
                value={nombreNuevo}
                onChange={(e) => setNombreNuevo(e.target.value)}
                placeholder="Ej. Landing principal"
                className="bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface focus:border-primary outline-none transition-colors duration-150"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Etiqueta para Go High Level</label>
              <input
                type="text"
                value={etiquetaNueva}
                onChange={(e) => setEtiquetaNueva(e.target.value)}
                placeholder="Ej. lanzamiento_octubre_registrado"
                className="bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface font-mono focus:border-primary outline-none transition-colors duration-150"
              />
            </div>
            <button
              type="submit"
              disabled={creando}
              className="press flex items-center gap-1.5 rounded-md bg-primary text-on-primary text-[14px] font-medium px-4 py-2.5 disabled:opacity-50 shrink-0 transition-transform duration-150"
            >
              <Plus size={14} /> {creando ? "Creando…" : "Agregar punto"}
            </button>
          </form>
          {formError && <p className="text-sm text-error">{formError}</p>}
        </>
      )}
    </div>
  );
}
