"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAcceso } from "@/components/v3/useAcceso";
import { MetaAdsResponse } from "@/lib/meta-ads/types";
import { V3Dashboard } from "@/lib/v3/types";
import VermetricasLoader from "@/components/VermetricasLoader";
import MetaNoConectado from "@/components/v3/MetaNoConectado";
import Tabs from "@/components/v3/Tabs";
import MetaAdsTable from "@/components/v3/MetaAdsTable";
import PersonalizarColumnas from "@/components/v3/PersonalizarColumnas";
import CrearConversion from "@/components/v3/CrearConversion";
import { ConversionPersonalizada, ReglaConversion, contarConversionPorAnuncio } from "@/lib/v3/conversiones";
import { V3Lead } from "@/lib/v3/types";
import { COLUMNAS, COLUMNAS_POR_DEFECTO, ColumnaKey, columnasDeConversiones, sanitizarColumnas } from "@/lib/v3/columnas-tabla";
import { Columns3 } from "lucide-react";

// Columnas que eligió la persona para las tablas. Se guardan en su navegador.
const CLAVE_COLUMNAS = "vermetricas.v3.columnas-anuncios";

function guardarColumnas(columnas: ColumnaKey[]) {
  try {
    localStorage.setItem(CLAVE_COLUMNAS, JSON.stringify(columnas));
  } catch {
    // Sin acceso al almacenamiento, las columnas duran lo que la pantalla.
  }
}

export default function V3AnunciosPage() {
  const params = useParams<{ clienteId: string }>();
  const clienteId = params.clienteId;
  const acceso = useAcceso(clienteId);
  const searchParams = useSearchParams();
  const dashboardIdParam = searchParams.get("dashboard") ?? "";

  const [dashboards, setDashboards] = useState<V3Dashboard[]>([]);

  const [data, setData] = useState<MetaAdsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"campanhas" | "conjuntos" | "anuncios">("campanhas");
  const [columnas, setColumnas] = useState<ColumnaKey[]>(COLUMNAS_POR_DEFECTO);
  const [columnasAbierto, setColumnasAbierto] = useState(false);
  const [conversiones, setConversiones] = useState<ConversionPersonalizada[]>([]);
  const [creandoConversion, setCreandoConversion] = useState(false);
  const [leads, setLeads] = useState<V3Lead[]>([]);

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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams({ cliente_id: clienteId });
    if (dashboardActual?.nomenclatura_filtro) qs.set("nomenclatura", dashboardActual.nomenclatura_filtro);
    fetch(`/api/anuncios/meta?${qs.toString()}`, { cache: "no-store" })
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => {
        if (cancelled) return;
        if (!ok) {
          setError(body.error || "No se pudo consultar Meta Ads");
          return;
        }
        setData(body);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo conectar al servidor");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clienteId, dashboardActual?.nomenclatura_filtro]);

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

  async function handleToggleEstado(id: string, nuevoEstado: "ACTIVE" | "PAUSED") {
    const res = await fetch("/api/anuncios/meta/estado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente_id: clienteId, id, status: nuevoEstado }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || "No se pudo cambiar el estado en Meta");

    setData((prev) => {
      if (!prev || !prev.conectado) return prev;
      return {
        ...prev,
        campanas: prev.campanas.map((c) => (c.campaign_id === id ? { ...c, status: nuevoEstado } : c)),
        conjuntos: prev.conjuntos.map((s) => (s.adset_id === id ? { ...s, status: nuevoEstado } : s)),
        anuncios: prev.anuncios.map((a) => (a.ad_id === id ? { ...a, status: nuevoEstado } : a)),
      };
    });
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
        <span className="text-xs uppercase tracking-[0.14em] text-primary font-mono">Meta Ads · Últimos 30 días</span>
        <h1 className="font-display text-2xl text-on-surface font-semibold">Administrador de Anuncios</h1>
      </header>

      <div className="bg-surface border border-outline rounded-xl p-4">
        <Tabs
          tabs={[
            { id: "campanhas", label: "Campañas" },
            { id: "conjuntos", label: "Conjuntos de anuncios" },
            { id: "anuncios", label: "Anuncios" },
          ]}
          active={activeTab}
          onChange={(id) => setActiveTab(id as typeof activeTab)}
          acciones={
            <button
              type="button"
              onClick={() => setColumnasAbierto(true)}
              className="press inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline text-[13px] text-on-surface-variant hover:text-on-surface transition-colors duration-150"
            >
              <Columns3 size={14} strokeWidth={2} />
              Columnas
            </button>
          }
        />
        <div className="pt-4">
          {activeTab === "campanhas" && (
            <MetaAdsTable
              nombreColumna="Campaña"
              columnas={columnasVisibles}
              definiciones={definiciones}
              onToggleEstado={acceso.puedeEscribir ? handleToggleEstado : undefined}
              rows={data.campanas.map((c) => ({
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
              }))}
            />
          )}
          {activeTab === "conjuntos" && (
            <MetaAdsTable
              nombreColumna="Conjunto de anuncios"
              columnas={columnasVisibles}
              definiciones={definiciones}
              onToggleEstado={acceso.puedeEscribir ? handleToggleEstado : undefined}
              rows={data.conjuntos.map((s) => ({
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
              }))}
            />
          )}
          {activeTab === "anuncios" && (
            <MetaAdsTable
              nombreColumna="Anuncio"
              columnas={columnasVisibles}
              definiciones={definiciones}
              onToggleEstado={acceso.puedeEscribir ? handleToggleEstado : undefined}
              rows={data.anuncios.map((a) => ({
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
              }))}
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
