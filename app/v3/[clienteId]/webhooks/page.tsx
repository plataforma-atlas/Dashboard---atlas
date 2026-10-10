"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAcceso } from "@/components/v3/useAcceso";
import { Check, Link2, Plus, Save } from "lucide-react";
import VermetricasLoader from "@/components/VermetricasLoader";
import PreguntasEncuesta from "@/components/v3/PreguntasEncuesta";
import VTurbConfig from "@/components/v3/VTurbConfig";
import { V3CanalCaptacion, V3CaptacionPunto, V3Dashboard, V3EndpointTipo } from "@/lib/v3/types";

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

export default function V3WebhooksPage() {
  const params = useParams<{ clienteId: string }>();
  const clienteId = params.clienteId;
  const acceso = useAcceso(clienteId);
  const searchParams = useSearchParams();
  const dashboardIdParam = searchParams.get("dashboard") ?? "";

  const [isAdmin, setIsAdmin] = useState(false);
  const [dashboards, setDashboards] = useState<V3Dashboard[]>([]);
  const [dashboardsLoading, setDashboardsLoading] = useState(true);

  const [puntos, setPuntos] = useState<V3CaptacionPunto[]>([]);
  const [puntosLoading, setPuntosLoading] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [canalNuevo, setCanalNuevo] = useState<V3CanalCaptacion>("ads");
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
      setFormError("Ponele un nombre a la página de captación.");
      return;
    }
    setCreando(true);
    try {
      const res = await fetch("/api/v3/captacion-puntos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, dashboard_id: dashboardActual.id, nombre: nombreNuevo.trim(), canal: canalNuevo }),
      });
      const nuevo = await res.json();
      if (!res.ok) {
        setFormError(nuevo.error || "No se pudo crear la página de captación");
        return;
      }
      setNombreNuevo("");
      setCanalNuevo("ads");
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
        <span className="text-xs uppercase tracking-[0.14em] text-primary font-mono">Webhooks</span>
        <h1 className="font-display text-2xl text-on-surface font-semibold">Páginas de captación y su embudo</h1>
        <p className="text-sm text-on-surface-variant">
          Cada página de captación es una landing distinta que estás testeando — tiene su propio enlace de Captación y su propio pixel de Visitas. La Encuesta, el Ingreso a grupos y el Mensaje 1a1 son un solo enlace para todo el dashboard, sin importar por cuál página haya entrado la persona.
        </p>
      </header>

      {!dashboardActual ? (
        <p className="text-[13px] text-on-surface-faint py-8 text-center">
          Elegí un dashboard de tipo Lanzamiento en el selector de arriba para ver sus webhooks.
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
                    disabled={guardandoTipo === campo.tipo || !acceso.puedeEscribir}
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
              <div className="flex flex-col gap-1.5">
                {([
                  { tipo: "clase" as const, path: "integraciones/generar-enlace-clase", label: "Webhook para GHL — vio la clase" },
                  { tipo: "replay" as const, path: "integraciones/generar-enlace-replay", label: "Webhook para GHL — vio el replay" },
                ]).map((w) => (
                  <div key={w.tipo} className="flex items-center justify-between gap-3 rounded-md bg-background px-3 py-2">
                    <span className="text-[13px] text-on-surface-variant shrink-0">{w.label}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${typeof window !== "undefined" ? window.location.origin : ""}/api/hooks/${w.path}?cliente_id=${clienteId}`;
                        navigator.clipboard?.writeText(url).then(() => {
                          setCopiado(w.path);
                          setTimeout(() => setCopiado((actual) => (actual === w.path ? null : actual)), 2000);
                        });
                      }}
                      className="press flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-md border border-outline hover:border-primary text-on-surface font-medium shrink-0 transition-colors duration-150"
                    >
                      {copiado === w.path ? (
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
            )}
            {isAdmin && (
              <p className="text-[11px] text-on-surface-faint">
                Body de los dos: <code className="font-mono">{"{ telefono, correo }"}</code> — cada uno responde <code className="font-mono">{"{ url }"}</code> ya resuelto para su tipo, sin que GHL tenga que mandar nada más (antes era un solo webhook con un campo <code className="font-mono">tipo</code>, pero eso se prestaba a confusión al configurarlo).
              </p>
            )}
          </div>

          <VTurbConfig
            clienteId={clienteId}
            dashboardId={dashboardActual.id}
            vturbPlayerIds={dashboardActual.vturb_player_ids}
            vturbUtmParam={dashboardActual.vturb_utm_param}
            puedeEscribir={acceso.puedeEscribir}
            onGuardado={(vturbPlayerIds, vturbUtmParam) =>
              setDashboards((actuales) => actuales.map((d) => (d.id === dashboardActual.id ? { ...d, vturb_player_ids: vturbPlayerIds, vturb_utm_param: vturbUtmParam } : d)))
            }
          />

          {/* Encuesta / Ingreso a grupos / Mensaje 1a1 son del dashboard completo, no
              de una página en particular — un mismo enlace sirve sin importar por
              cuál página de captación haya entrado la persona. "Gracias" no tiene
              forma real de trackearse (ver comentario más abajo), se deja afuera. */}
          <div className="rounded-lg border border-outline bg-surface p-4 flex flex-col gap-3">
            <div>
              <div className="text-[14px] font-medium text-on-surface">Endpoints del dashboard</div>
              <div className="text-[12px] text-on-surface-variant">
                Un solo enlace de cada uno para todo {dashboardActual.nombre} — vale para cualquiera de sus páginas de captación.
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {dashboardActual.endpoints
                .filter((e) => e.tipo !== "gracias" && (isAdmin || e.tipo !== "mensaje_recibido"))
                .map((endpoint) => (
                  <div key={endpoint.tipo} className="flex items-center justify-between gap-3 rounded-md bg-background px-3 py-2">
                    <span className="text-[13px] text-on-surface-variant shrink-0">{ETIQUETAS_ENDPOINT[endpoint.tipo]}</span>
                    <button
                      type="button"
                      onClick={() => copiar(endpoint.tipo, endpoint.token)}
                      className="press flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-md border border-outline hover:border-primary text-on-surface font-medium shrink-0 transition-colors duration-150"
                    >
                      {copiado === endpoint.token ? (
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

          <PreguntasEncuesta
            clienteId={clienteId}
            dashboardId={dashboardActual.id}
            preguntas={dashboardActual.preguntas_encuesta}
            ghlSurveyId={dashboardActual.ghl_survey_id}
            puedeEscribir={acceso.puedeEscribir}
            onGuardadas={(preguntas) =>
              setDashboards((actuales) => actuales.map((d) => (d.id === dashboardActual.id ? { ...d, preguntas_encuesta: preguntas } : d)))
            }
            onSincronizado={(datos) =>
              setDashboards((actuales) =>
                actuales.map((d) =>
                  d.id === dashboardActual.id
                    ? { ...d, preguntas_encuesta: datos.preguntas_encuesta, ghl_survey_id: datos.ghl_survey_id }
                    : d
                )
              )
            }
          />

          {puntosLoading ? (
            <p className="text-[13px] text-on-surface-faint">Cargando…</p>
          ) : puntos.length === 0 ? (
            <p className="text-[13px] text-on-surface-faint">Todavía no hay páginas de captación para {dashboardActual.nombre}.</p>
          ) : (
            <>
              {(
                [
                  { canal: "ads" as const, titulo: "Páginas de Ads (testeo)", vacio: "Todavía no hay páginas de testeo." },
                  { canal: "organico" as const, titulo: "Página orgánica", vacio: "Todavía no hay página orgánica." },
                ] as const
              ).map((grupo) => {
                const deEsteGrupo = puntos.filter((p) => p.canal === grupo.canal);
                if (deEsteGrupo.length === 0) return null;
                return (
                  <div key={grupo.canal} className="flex flex-col gap-3">
                    <h3 className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">{grupo.titulo}</h3>
                    {deEsteGrupo.map((punto) => {
                      // Páginas creadas antes de este cambio todavía pueden traer, en la
                      // respuesta de la API, filas viejas de encuesta/gracias/grupos/
                      // mensaje a nivel de página (quedaron en la base, ya no se generan
                      // más) — esos endpoints dejaron de usarse: Eventos de Embudo ahora
                      // busca por dashboard_id, no por punto_captacion_id, así que esos
                      // tokens viejos ya ni funcionan. Por página solo se muestra "visita".
                      const filas: { tipo: "captacion" | V3EndpointTipo; token: string }[] = [
                        { tipo: "captacion", token: punto.token_captacion },
                        ...punto.endpoints.filter((e) => e.tipo === "visita"),
                      ];
                      return (
                        <div key={punto.id} className="rounded-lg border border-outline bg-surface p-4 flex flex-col gap-3">
                          <div>
                            <div className="text-[14px] font-medium text-on-surface">{punto.nombre}</div>
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
                                    <code className="font-mono">&lt;/body&gt;</code>) — cuenta cada visita real, sin importar cuántos
                                    anuncios de Meta apunten acá.
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}

          {acceso.puedeEscribir && (
          <form onSubmit={crearPunto} className="rounded-lg border border-outline bg-surface p-4 flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex flex-col gap-1.5 shrink-0">
              <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Canal</label>
              <div className="flex items-center gap-1.5">
                {(["ads", "organico"] as const).map((opcion) => (
                  <button
                    key={opcion}
                    type="button"
                    onClick={() => setCanalNuevo(opcion)}
                    className={`press text-[13px] px-3 py-2 rounded-md border font-medium transition-colors duration-150 ${
                      canalNuevo === opcion
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-outline text-on-surface-variant hover:border-primary hover:text-on-surface"
                    }`}
                  >
                    {opcion === "organico" ? "Orgánico" : "Ads"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Nombre de la página</label>
              <input
                type="text"
                value={nombreNuevo}
                onChange={(e) => setNombreNuevo(e.target.value)}
                placeholder="Ej. Página F"
                className="bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface focus:border-primary outline-none transition-colors duration-150"
              />
            </div>
            <button
              type="submit"
              disabled={creando}
              className="press flex items-center gap-1.5 rounded-md bg-primary text-on-primary text-[14px] font-medium px-4 py-2.5 disabled:opacity-50 shrink-0 transition-transform duration-150"
            >
              <Plus size={14} /> {creando ? "Creando…" : "Agregar página"}
            </button>
          </form>
          )}
          {formError && <p className="text-sm text-error">{formError}</p>}
        </>
      )}
    </div>
  );
}
