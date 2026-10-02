"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Check, Link2, Plus, Save } from "lucide-react";
import VermetricasLoader from "@/components/VermetricasLoader";
import { V3CaptacionPunto, V3Dashboard, V3EndpointTipo } from "@/lib/v3/types";

const ETIQUETAS_ENDPOINT: Record<"captacion" | V3EndpointTipo, string> = {
  captacion: "Captación",
  encuesta: "Encuesta",
  gracias: "Página de gracias",
  grupos: "Ingreso a grupos (SendFlow)",
  mensaje_recibido: "Mensaje 1a1 recibido",
  visita: "Visitas (pixel para \"Páginas de testeo\")",
};

const PATH_ENDPOINT: Record<"captacion" | V3EndpointTipo, string> = {
  captacion: "integraciones/captacion-lead",
  encuesta: "integraciones/embudo-encuesta",
  gracias: "integraciones/embudo-gracias",
  grupos: "integraciones/embudo-grupos",
  mensaje_recibido: "integraciones/embudo-mensaje-recibido",
  visita: "integraciones/captacion-visita",
};

function construirEnlace(path: string, token: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/api/hooks/${path}?token=${token}`;
}

// "Visita" no se pega como URL (va en un form o workflow) sino como un pixel
// de imagen oculto en la página — por eso copia un snippet de HTML listo para
// pegar en vez de la URL pelada, a diferencia de los demás endpoints.
function construirContenidoParaCopiar(tipo: "captacion" | V3EndpointTipo, token: string) {
  const url = construirEnlace(PATH_ENDPOINT[tipo], token);
  if (tipo === "visita") return `<img src="${url}" width="1" height="1" style="display:none" alt="" />`;
  return url;
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

  const [urlClase, setUrlClase] = useState("");
  const [urlReplay, setUrlReplay] = useState("");
  const [guardandoTipo, setGuardandoTipo] = useState<"clase" | "replay" | null>(null);
  const [enlaceError, setEnlaceError] = useState<string | null>(null);
  const [enlaceGuardado, setEnlaceGuardado] = useState<"clase" | "replay" | null>(null);

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

  useEffect(() => {
    setUrlClase(dashboardActual?.url_enlaces?.clase ?? "");
    setUrlReplay(dashboardActual?.url_enlaces?.replay ?? "");
    setEnlaceError(null);
  }, [dashboardActual?.id]);

  async function guardarUrlEnlace(tipo: "clase" | "replay", url: string) {
    if (!dashboardActual) return;
    if (!url.trim()) {
      setEnlaceError("Pegá la URL antes de guardar.");
      return;
    }
    setGuardandoTipo(tipo);
    setEnlaceError(null);
    try {
      const res = await fetch("/api/v3/dashboards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, dashboard_id: dashboardActual.id, tipo, url: url.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEnlaceError(body.error || "No se pudo guardar");
        return;
      }
      setDashboards((actuales) => actuales.map((d) => (d.id === dashboardActual.id ? { ...d, url_enlaces: { ...d.url_enlaces, [tipo]: url.trim() } } : d)));
      setEnlaceGuardado(tipo);
      setTimeout(() => setEnlaceGuardado((actual) => (actual === tipo ? null : actual)), 2000);
    } catch {
      setEnlaceError("No se pudo conectar al servidor");
    } finally {
      setGuardandoTipo(null);
    }
  }

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

  function copiar(tipo: "captacion" | V3EndpointTipo, token: string) {
    const contenido = construirContenidoParaCopiar(tipo, token);
    navigator.clipboard
      ?.writeText(contenido)
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
          <div className="rounded-lg border border-outline bg-surface p-4 flex flex-col gap-3">
            <div>
              <div className="text-[14px] font-medium text-on-surface">Enlace corto — clase y replay</div>
              <div className="text-[12px] text-on-surface-variant">
                Pegá acá la URL real de la clase en vivo y del replay. Vermetricas genera un enlace propio por lead (para saber quién entró) que redirige a esto.
              </div>
            </div>
            {([
              { tipo: "clase" as const, label: "URL de la clase", valor: urlClase, set: setUrlClase },
              { tipo: "replay" as const, label: "URL del replay", valor: urlReplay, set: setUrlReplay },
            ]).map((campo) => (
              <div key={campo.tipo} className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">{campo.label}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={campo.valor}
                    onChange={(e) => campo.set(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 min-w-0 bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface focus:border-primary outline-none transition-colors duration-150"
                  />
                  <button
                    type="button"
                    onClick={() => guardarUrlEnlace(campo.tipo, campo.valor)}
                    disabled={guardandoTipo === campo.tipo}
                    className="press flex items-center gap-1.5 text-[12px] px-3 py-2 rounded-md border border-outline hover:border-primary text-on-surface font-medium shrink-0 transition-colors duration-150 disabled:opacity-50"
                  >
                    {enlaceGuardado === campo.tipo ? (
                      <>
                        <Check size={12} /> Guardado
                      </>
                    ) : (
                      <>
                        <Save size={12} /> {guardandoTipo === campo.tipo ? "Guardando…" : "Guardar"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
            {enlaceError && <p className="text-sm text-error">{enlaceError}</p>}
            {isAdmin && (
              <div className="flex items-center justify-between gap-3 rounded-md bg-background px-3 py-2 mt-1">
                <span className="text-[13px] text-on-surface-variant shrink-0">Webhook para GHL (pedir enlace por lead)</span>
                <button
                  type="button"
                  onClick={() => {
                    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/api/hooks/integraciones/generar-enlace?cliente_id=${clienteId}`;
                    navigator.clipboard?.writeText(url).then(() => {
                      setCopiado("generar-enlace");
                      setTimeout(() => setCopiado((actual) => (actual === "generar-enlace" ? null : actual)), 2000);
                    });
                  }}
                  className="press flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-md border border-outline hover:border-primary text-on-surface font-medium shrink-0 transition-colors duration-150"
                >
                  {copiado === "generar-enlace" ? (
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
            )}
            {isAdmin && (
              <p className="text-[11px] text-on-surface-faint">
                Body: <code className="font-mono">{"{ telefono, correo, tipo: \"clase\" | \"replay\" }"}</code> — responde <code className="font-mono">{"{ url }"}</code> para insertar en el mensaje.
              </p>
            )}
          </div>

          {puntosLoading ? (
            <p className="text-[13px] text-on-surface-faint">Cargando…</p>
          ) : puntos.length === 0 ? (
            <p className="text-[13px] text-on-surface-faint">Todavía no hay puntos de captación para {dashboardActual.nombre}.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {puntos.map((punto) => {
                // "Página de gracias" no tiene forma real de trackearse: el botón de
                // esa página manda directo a entrar al grupo, nunca dispara un ping
                // propio — se deja de ofrecer este endpoint para no entregar un
                // enlace que el cliente no tiene dónde pegar.
                const filas: { tipo: "captacion" | V3EndpointTipo; token: string }[] = [
                  { tipo: "captacion", token: punto.token_captacion },
                  ...punto.endpoints.filter((e) => e.tipo !== "gracias" && (isAdmin || e.tipo !== "mensaje_recibido")),
                ];
                return (
                  <div key={punto.id} className="rounded-lg border border-outline bg-surface p-4 flex flex-col gap-3">
                    <div>
                      <div className="text-[14px] font-medium text-on-surface">{punto.nombre}</div>
                      <div className="text-[12px] text-on-surface-faint font-mono">Etiqueta GHL: {punto.etiqueta_ghl}</div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {filas.map((fila) => (
                        <div key={fila.tipo} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-3 rounded-md bg-background px-3 py-2">
                            <span className="text-[13px] text-on-surface-variant shrink-0">{ETIQUETAS_ENDPOINT[fila.tipo]}</span>
                            <button
                              type="button"
                              onClick={() => copiar(fila.tipo, fila.token)}
                              className="press flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-md border border-outline hover:border-primary text-on-surface font-medium shrink-0 transition-colors duration-150"
                            >
                              {copiado === fila.token ? (
                                <>
                                  <Check size={12} /> Copiado
                                </>
                              ) : (
                                <>
                                  <Link2 size={12} /> {fila.tipo === "visita" ? "Copiar snippet" : "Copiar"}
                                </>
                              )}
                            </button>
                          </div>
                          {fila.tipo === "visita" && (
                            <p className="text-[11px] text-on-surface-faint px-1">
                              Pegá esto en el <code className="font-mono">&lt;head&gt;</code> de la página (o justo antes de cerrar{" "}
                              <code className="font-mono">&lt;/body&gt;</code>) — cuenta cada visita real, sin importar cuántos anuncios de
                              Meta apunten acá.
                            </p>
                          )}
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
