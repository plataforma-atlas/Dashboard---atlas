"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { MetaAdsResponse } from "@/lib/meta-ads/types";
import { V3Dashboard, V3VTurbMetricaFila } from "@/lib/v3/types";
import VermetricasLoader from "@/components/VermetricasLoader";
import MetaNoConectado from "@/components/v3/MetaNoConectado";
import Tabs from "@/components/v3/Tabs";
import MetaAdsTable from "@/components/v3/MetaAdsTable";
import PersonalizarColumnas from "@/components/v3/PersonalizarColumnas";
import CrearConversion from "@/components/v3/CrearConversion";
import VisionConsolidada from "@/components/v3/VisionConsolidada";
import V3PeriodFilter from "@/components/v3/V3PeriodFilter";
import { RANGO_RAPIDO_LABEL, RangoRapido, rangoRapido } from "@/lib/webinar-os/control-center/dateRanges";
import { ConversionPersonalizada, ReglaConversion, contarConversionPorAnuncio } from "@/lib/v3/conversiones";
import { V3Lead } from "@/lib/v3/types";
import {
  COLUMNAS,
  COLUMNAS_POR_DEFECTO,
  ColumnaKey,
  FilaTabla,
  columnasDeConversiones,
  sanitizarColumnas,
} from "@/lib/v3/columnas-tabla";
import { BarChart3, Columns3 } from "lucide-react";

// Columnas que eligió la persona para las tablas. Se guardan en su navegador.
const CLAVE_COLUMNAS = "vermetricas.v3.columnas-anuncios";

function hoyIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function guardarColumnas(columnas: ColumnaKey[]) {
  try {
    localStorage.setItem(CLAVE_COLUMNAS, JSON.stringify(columnas));
  } catch {
    // Sin acceso al almacenamiento, las columnas duran lo que la pantalla.
  }
}

type Pestania = "campanhas" | "conjuntos" | "anuncios";

export default function V3AnunciosPage() {
  const params = useParams<{ clienteId: string }>();
  const clienteId = params.clienteId;
  const searchParams = useSearchParams();
  const dashboardIdParam = searchParams.get("dashboard") ?? "";

  const [dashboards, setDashboards] = useState<V3Dashboard[]>([]);

  const [data, setData] = useState<MetaAdsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Pestania>("campanhas");
  const [columnas, setColumnas] = useState<ColumnaKey[]>(COLUMNAS_POR_DEFECTO);
  const [columnasAbierto, setColumnasAbierto] = useState(false);
  const [conversiones, setConversiones] = useState<ConversionPersonalizada[]>([]);
  const [creandoConversion, setCreandoConversion] = useState(false);
  const [leads, setLeads] = useState<V3Lead[]>([]);
  // Filas seleccionadas en la pestaña activa, y si la visión consolidada está abierta.
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [graficoAbierto, setGraficoAbierto] = useState(false);
  // Período de los datos de Meta (el mismo filtro que usa el dashboard).
  const [periodo, setPeriodo] = useState<RangoRapido>("30days");
  const [rangoPeriodo, setRangoPeriodo] = useState(() => rangoRapido("30days"));
  // Solo la primera carga muestra la pantalla de carga; cambiar el período no la repite.
  const primeraCarga = useRef(true);
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    if (!clienteId) return;
    fetch(`/api/v3/conversiones?cliente_id=${clienteId}`, { cache: "no-store" })
      .then((res) => res.json().then((body) => (res.ok && Array.isArray(body) ? body : [])))
      .then((lista) => setConversiones(lista))
      .catch(() => setConversiones([]));
  }, [clienteId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CLAVE_COLUMNAS);
      if (raw) setColumnas(sanitizarColumnas(JSON.parse(raw)));
    } catch {
      // Si lo guardado está dañado, se usan las columnas por defecto.
    }
  }, []);

  // El selector de dashboard vive en la barra global (V3Topbar) — acá solo
  // leemos qué nomenclatura corresponde al elegido para filtrar los datos.
  useEffect(() => {
    if (!clienteId) return;
    fetch(`/api/v3/dashboards?cliente_id=${clienteId}`, { cache: "no-store" })
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => setDashboards(ok ? body.dashboards ?? [] : []))
      .catch(() => setDashboards([]));
  }, [clienteId]);

  const dashboardActual = dashboards.find((d) => String(d.id) === dashboardIdParam) ?? null;
  const dashboardActualId = dashboardActual?.id ?? null;
  const [vturbPorClave, setVturbPorClave] = useState<Map<string, V3VTurbMetricaFila>>(new Map());

  useEffect(() => {
    if (!clienteId || dashboardActualId === null) {
      setLeads([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/v3/leads?cliente_id=${clienteId}&dashboard_id=${dashboardActualId}`, { cache: "no-store" })
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => {
        if (!cancelled) setLeads(ok && Array.isArray(body.leads) ? body.leads : []);
      })
      .catch(() => {
        if (!cancelled) setLeads([]);
      });
    return () => {
      cancelled = true;
    };
  }, [clienteId, dashboardActualId]);

  // Métricas de video de VTurb, cruzadas por UTM — solo se piden si el
  // dashboard tiene al menos un reproductor y un parámetro UTM configurados
  // (ver endpoints/page.tsx). Mismo rango de fechas que el resto de la pantalla.
  const vturbPlayerIds = dashboardActual?.vturb_player_ids ?? [];
  const vturbUtmParam = dashboardActual?.vturb_utm_param ?? null;
  useEffect(() => {
    if (!clienteId || vturbPlayerIds.length === 0 || !vturbUtmParam) {
      setVturbPorClave(new Map());
      return;
    }
    let cancelled = false;
    fetch("/api/v3/vturb/metricas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente_id: clienteId,
        player_ids: vturbPlayerIds.map((p) => p.player_id),
        query_key: vturbUtmParam,
        start_date: `${rangoPeriodo.fecha_inicio || "2000-01-01"} 00:00:00`,
        end_date: `${rangoPeriodo.fecha_fin || hoyIso()} 23:59:59`,
      }),
      cache: "no-store",
    })
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => {
        if (cancelled || !ok) return;
        const filas: V3VTurbMetricaFila[] = Array.isArray(body?.rows) ? body.rows : [];
        setVturbPorClave(new Map(filas.map((f) => [f.grouped_field.trim().toLowerCase(), f])));
      })
      .catch(() => {
        if (!cancelled) setVturbPorClave(new Map());
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId, JSON.stringify(vturbPlayerIds), vturbUtmParam, rangoPeriodo.fecha_inicio, rangoPeriodo.fecha_fin]);

  useEffect(() => {
    let cancelled = false;
    if (primeraCarga.current) setLoading(true);
    else setActualizando(true);
    setError(null);
    const qs = new URLSearchParams({ cliente_id: clienteId });
    if (dashboardActual?.nomenclatura_filtro) qs.set("nomenclatura", dashboardActual.nomenclatura_filtro);
    // "Todo el período" no trae fechas: se pide desde muy atrás y el servidor lo recorta al límite de Meta.
    qs.set("fecha_inicio", rangoPeriodo.fecha_inicio || "2000-01-01");
    qs.set("fecha_fin", rangoPeriodo.fecha_fin || hoyIso());
    fetch(`/api/anuncios/meta?${qs.toString()}`, { cache: "no-store" })
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => {
        if (cancelled) return;
        if (!ok) {
          setError(body.error || "No se pudo consultar Meta Ads");
          return;
        }
        setData(body);
        primeraCarga.current = false;
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo conectar al servidor");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setActualizando(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [clienteId, dashboardActual?.nomenclatura_filtro, rangoPeriodo.fecha_inicio, rangoPeriodo.fecha_fin]);

  function aplicarPeriodo(p: RangoRapido, r: { fecha_inicio: string; fecha_fin: string }) {
    setPeriodo(p);
    setRangoPeriodo(r);
    setSeleccion(new Set());
    setGraficoAbierto(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <VermetricasLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8 md:px-8 max-w-7xl">
        <div className="rounded-lg border border-outline-error bg-error-container px-4 py-3 text-sm text-error">{error}</div>
      </div>
    );
  }

  if (!data || !data.conectado) {
    return <MetaNoConectado />;
  }

  // Conversiones por anuncio. Campañas y conjuntos suman los anuncios que tienen dentro.
  const conversionesPorAnuncio = new Map<string, Record<string, number>>();
  for (const conv of conversiones) {
    const conteo = contarConversionPorAnuncio(leads, conv.config as ReglaConversion);
    for (const [adId, n] of conteo) {
      const actual = conversionesPorAnuncio.get(adId) ?? {};
      actual[`conv:${conv.id}`] = n;
      conversionesPorAnuncio.set(adId, actual);
    }
  }
  const definiciones = [...COLUMNAS, ...columnasDeConversiones(conversiones)];
  // Una columna guardada cuya conversión ya no existe no se muestra.
  const columnasVisibles = columnas.filter((k) => definiciones.some((d) => d.key === k));
  const hayConversiones = conversiones.length > 0 && dashboardActualId !== null;

  function conversionesDe(anuncios: { ad_id: string }[]): Record<string, number> | undefined {
    if (!hayConversiones) return undefined;
    const total: Record<string, number> = {};
    for (const conv of conversiones) total[`conv:${conv.id}`] = 0;
    for (const { ad_id } of anuncios) {
      const propias = conversionesPorAnuncio.get(ad_id) ?? {};
      for (const [k, n] of Object.entries(propias)) total[k] = (total[k] ?? 0) + n;
    }
    return total;
  }

  // Cruza un anuncio con sus métricas de VTurb, matcheando por nombre o id del
  // anuncio contra el valor del UTM configurado (ver endpoints/page.tsx) — no
  // sabemos de antemano cuál de los dos usa el cliente en su URL de destino.
  function vturbDe(ad: { ad_id: string; ad_name: string }): FilaTabla["vturb"] {
    if (vturbPorClave.size === 0) return undefined;
    const fila = vturbPorClave.get(ad.ad_name.trim().toLowerCase()) ?? vturbPorClave.get(ad.ad_id.trim().toLowerCase());
    if (!fila) return undefined;
    return {
      clicsBoton: fila.clics_boton,
      playRate: fila.play_rate,
      audienciaPitch: fila.audiencia_pitch,
      primerMinuto: fila.primer_minuto,
    };
  }

  // Filas de cada pestaña. Se calculan una vez para usarlas en la tabla y en la visión consolidada.
  const filasCampanas: FilaTabla[] = data.campanas.map((c) => ({
    id: c.campaign_id,
    nombre: c.campaign_name,
    subtitulo: c.ad_account_label,
    status: c.status,
    spend: c.spend,
    impressions: c.impressions,
    clicks: c.clicks,
    link_clicks: c.link_clicks,
    ctr: c.ctr,
    cpm: c.cpm,
    cpc: c.cpc,
    leads: c.leads,
    conversiones: conversionesDe(data.anuncios.filter((a) => a.campaign_id === c.campaign_id)),
  }));
  const filasConjuntos: FilaTabla[] = data.conjuntos.map((s) => ({
    id: s.adset_id,
    nombre: s.adset_name,
    subtitulo: `${s.ad_account_label} · ${s.campaign_name}`,
    status: s.status,
    spend: s.spend,
    impressions: s.impressions,
    clicks: s.clicks,
    link_clicks: s.link_clicks,
    ctr: s.ctr,
    cpm: s.cpm,
    cpc: s.cpc,
    leads: s.leads,
    conversiones: conversionesDe(data.anuncios.filter((a) => a.adset_id === s.adset_id)),
  }));
  const filasAnuncios: FilaTabla[] = data.anuncios.map((a) => ({
    id: a.ad_id,
    nombre: a.ad_name,
    subtitulo: `${a.ad_account_label} · ${a.campaign_name} · ${a.adset_name}`,
    status: a.status,
    spend: a.spend,
    impressions: a.impressions,
    clicks: a.clicks,
    link_clicks: a.link_clicks,
    ctr: a.ctr,
    cpm: a.cpm,
    leads: a.leads,
    ventas: a.ventas,
    roas: a.roas,
    cpa: a.cpa,
    conversiones: conversionesDe([a]),
    vturb: vturbDe(a),
  }));

  const filasPestaniaActiva =
    activeTab === "campanhas" ? filasCampanas : activeTab === "conjuntos" ? filasConjuntos : filasAnuncios;
  const filasSeleccionadas = filasPestaniaActiva.filter((f) => seleccion.has(f.id));
  // Anuncios que representa la selección: una campaña o conjunto trae los anuncios que tiene dentro.
  const anunciosSeleccionados = data.anuncios
    .filter((a) => {
      if (activeTab === "anuncios") return seleccion.has(a.ad_id);
      if (activeTab === "campanhas") return seleccion.has(a.campaign_id);
      return seleccion.has(a.adset_id);
    })
    .map((a) => ({ ad_id: a.ad_id, ad_account_id: a.ad_account_id }));

  function cambiarPestania(id: Pestania) {
    setActiveTab(id);
    setSeleccion(new Set());
    setGraficoAbierto(false);
  }

  async function eliminarConversion(key: ColumnaKey): Promise<string | null> {
    const id = Number(key.slice("conv:".length));
    const res = await fetch(`/api/v3/conversiones?id=${id}&cliente_id=${clienteId}`, { method: "DELETE" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return body.error || "No se pudo eliminar la conversión";
    setConversiones((prev) => prev.filter((c) => c.id !== id));
    setColumnas((prev) => {
      const siguientes = prev.filter((k) => k !== key);
      guardarColumnas(siguientes);
      return siguientes;
    });
    return null;
  }

  async function guardarConversion(nombre: string, config: ReglaConversion): Promise<string | null> {
    const res = await fetch("/api/v3/conversiones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente_id: clienteId, nombre, config }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return body.error || "No se pudo guardar la conversión";
    const nueva = body as ConversionPersonalizada;
    setConversiones((prev) => [...prev, nueva]);
    setColumnas((prev) => {
      const siguientes = [...prev, `conv:${nueva.id}` as ColumnaKey];
      guardarColumnas(siguientes);
      return siguientes;
    });
    return null;
  }

  return (
    <div className="px-4 py-8 md:px-8 max-w-7xl mx-auto flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-[0.14em] text-primary font-mono">
          Meta Ads · {periodo === "custom" ? "Rango personalizado" : RANGO_RAPIDO_LABEL[periodo]}
        </span>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="font-display text-2xl text-on-surface font-semibold">Administrador de Anuncios</h1>
          <V3PeriodFilter periodo={periodo} rango={rangoPeriodo} onAplicar={aplicarPeriodo} />
        </div>
        {actualizando && <p className="text-[12px] text-on-surface-faint">Actualizando datos de Meta…</p>}
      </header>

      {graficoAbierto && filasSeleccionadas.length > 0 && (
        <VisionConsolidada
          clienteId={clienteId}
          rango={{ fecha_inicio: rangoPeriodo.fecha_inicio || "2000-01-01", fecha_fin: rangoPeriodo.fecha_fin || hoyIso() }}
          filas={filasSeleccionadas}
          anuncios={anunciosSeleccionados}
          onLimpiar={() => setSeleccion(new Set())}
          onCerrar={() => setGraficoAbierto(false)}
        />
      )}

      <div className="bg-surface border border-outline rounded-xl p-4">
        <Tabs
          tabs={[
            { id: "campanhas", label: "Campañas" },
            { id: "conjuntos", label: "Conjuntos de anuncios" },
            { id: "anuncios", label: "Anuncios" },
          ]}
          active={activeTab}
          onChange={(id) => cambiarPestania(id as Pestania)}
          acciones={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGraficoAbierto((v) => !v)}
                disabled={filasSeleccionadas.length === 0}
                aria-pressed={graficoAbierto}
                className={`press inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[13px] transition-colors duration-150 disabled:opacity-40 ${
                  graficoAbierto
                    ? "border-primary bg-primary/10 text-on-surface"
                    : "border-outline text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <BarChart3 size={14} strokeWidth={2} />
                Gráfico
              </button>
              <button
                type="button"
                onClick={() => setColumnasAbierto(true)}
                className="press inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline text-[13px] text-on-surface-variant hover:text-on-surface transition-colors duration-150"
              >
                <Columns3 size={14} strokeWidth={2} />
                Columnas
              </button>
            </div>
          }
        />
        <div className="pt-4">
          {activeTab === "campanhas" && (
            <MetaAdsTable
              nombreColumna="Campaña"
              columnas={columnasVisibles}
              definiciones={definiciones}
              onSeleccionChange={(ids) => setSeleccion(new Set(ids))}
              rows={filasCampanas}
            />
          )}
          {activeTab === "conjuntos" && (
            <MetaAdsTable
              nombreColumna="Conjunto de anuncios"
              columnas={columnasVisibles}
              definiciones={definiciones}
              onSeleccionChange={(ids) => setSeleccion(new Set(ids))}
              rows={filasConjuntos}
            />
          )}
          {activeTab === "anuncios" && (
            <MetaAdsTable
              nombreColumna="Anuncio"
              columnas={columnasVisibles}
              definiciones={definiciones}
              onSeleccionChange={(ids) => setSeleccion(new Set(ids))}
              rows={filasAnuncios}
            />
          )}
        </div>
      </div>

      {columnasAbierto && (
        <PersonalizarColumnas
          columnas={columnasVisibles}
          definiciones={definiciones}
          onCrearConversion={() => setCreandoConversion(true)}
          onEliminarConversion={eliminarConversion}
          onAplicar={(nuevas) => {
            setColumnas(nuevas);
            guardarColumnas(nuevas);
            setColumnasAbierto(false);
          }}
          onClose={() => setColumnasAbierto(false)}
        />
      )}

      {creandoConversion && (
        <CrearConversion onGuardar={guardarConversion} onClose={() => setCreandoConversion(false)} />
      )}
    </div>
  );
}
