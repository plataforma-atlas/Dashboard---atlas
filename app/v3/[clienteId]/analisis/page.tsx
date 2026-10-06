"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { MetaAdsResponse } from "@/lib/meta-ads/types";
import { V3Dashboard } from "@/lib/v3/types";
import VermetricasLoader from "@/components/VermetricasLoader";
import MetaNoConectado from "@/components/v3/MetaNoConectado";
import AdCreativeCard from "@/components/v3/AdCreativeCard";
import AnalisisFiltrosModal from "@/components/v3/AnalisisFiltrosModal";
import Pagination from "@/components/ui/pagination";
import { SlidersHorizontal } from "lucide-react";
import { CONFIG_POR_DEFECTO, ConfigAnalisis, aplicarConfig, filtrosActivos } from "@/lib/v3/analisis-anuncios";

const PAGE_SIZE_OPTIONS = [12, 24, 48];

export default function V3AnalisisPage() {
  const params = useParams<{ clienteId: string }>();
  const clienteId = params.clienteId;
  const searchParams = useSearchParams();
  const dashboardIdParam = searchParams.get("dashboard") ?? "";

  const [dashboards, setDashboards] = useState<V3Dashboard[]>([]);
  const [data, setData] = useState<MetaAdsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [config, setConfig] = useState<ConfigAnalisis>(CONFIG_POR_DEFECTO);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  useEffect(() => {
    if (!clienteId) return;
    fetch(`/api/v3/dashboards?cliente_id=${clienteId}`, { cache: "no-store" })
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => setDashboards(ok ? body.dashboards ?? [] : []))
      .catch(() => setDashboards([]));
  }, [clienteId]);

  const dashboardActual = dashboards.find((d) => String(d.id) === dashboardIdParam) ?? null;

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

  useEffect(() => {
    setPage(1);
  }, [clienteId, dashboardActual?.nomenclatura_filtro, pageSize]);

  function cambiarPageSize(size: number) {
    setPageSize(size);
    setPage(1);
  }

  function toggleSeleccion(adId: string) {
    setSeleccionados((prev) => (prev.includes(adId) ? prev.filter((id) => id !== adId) : [...prev, adId]));
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

  const anunciosOrdenados = aplicarConfig(data.anuncios, config);
  const anunciosSeleccionados = anunciosOrdenados.filter((a) => seleccionados.includes(a.ad_id));
  const campanasDisponibles = Array.from(new Map(data.anuncios.map((a) => [a.campaign_id, a.campaign_name])), ([id, nombre]) => ({
    id,
    nombre,
  }));
  const cantFiltros = filtrosActivos(config);

  function aplicarFiltros(nueva: ConfigAnalisis) {
    setConfig(nueva);
    setPage(1);
    setFiltrosAbiertos(false);
  }
  const totalPages = Math.max(1, Math.ceil(anunciosOrdenados.length / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const visibles = anunciosOrdenados.slice((pageClamped - 1) * pageSize, pageClamped * pageSize);

  return (
    <div className="px-4 py-8 md:px-8 max-w-7xl mx-auto flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.14em] text-primary font-mono">Meta Ads · Últimos 30 días</span>
          <h1 className="font-display text-2xl text-on-surface font-semibold">Análisis de Anuncios</h1>
          <p className="text-sm text-on-surface-variant">Seleccioná 2 o más para compararlos lado a lado.</p>
        </div>
        <button
          type="button"
          onClick={() => setFiltrosAbiertos(true)}
          className="press inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-2 rounded-lg border border-outline bg-surface text-[13px] text-on-surface-variant hover:text-on-surface transition-colors duration-150"
        >
          <SlidersHorizontal size={15} strokeWidth={2} />
          Filtros y métricas
          {cantFiltros > 0 && (
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-on-primary text-[11px] font-medium grid place-items-center">
              {cantFiltros}
            </span>
          )}
        </button>
      </header>

      {filtrosAbiertos && (
        <AnalisisFiltrosModal
          config={config}
          campanas={campanasDisponibles}
          onAplicar={aplicarFiltros}
          onClose={() => setFiltrosAbiertos(false)}
        />
      )}

      {anunciosSeleccionados.length >= 2 && (
        <div className="animate-fade-in-up bg-surface border border-outline rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-medium text-on-surface">Comparación ({anunciosSeleccionados.length})</h2>
            <button
              type="button"
              onClick={() => setSeleccionados([])}
              className="press text-[13px] text-on-surface-variant hover:text-on-surface transition-colors duration-150"
            >
              Limpiar selección
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {anunciosSeleccionados.map((ad) => (
              <div key={ad.ad_id} className="w-full sm:w-96">
                <AdCreativeCard ad={ad} selected onToggle={() => toggleSeleccion(ad.ad_id)} metricas={config.metricas} />
              </div>
            ))}
          </div>
        </div>
      )}

      {anunciosOrdenados.length === 0 ? (
        <p className="text-sm text-on-surface-faint py-6">
          {data.anuncios.length === 0 ? "Sin anuncios en los últimos 30 días." : "Ningún anuncio cumple los filtros elegidos."}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibles.map((ad) => (
              <AdCreativeCard
                key={ad.ad_id}
                ad={ad}
                selected={seleccionados.includes(ad.ad_id)}
                onToggle={() => toggleSeleccion(ad.ad_id)}
                metricas={config.metricas}
              />
            ))}
          </div>
          <Pagination
            page={pageClamped}
            pageCount={totalPages}
            pageSize={pageSize}
            total={anunciosOrdenados.length}
            onPageChange={setPage}
            onPageSizeChange={cambiarPageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </>
      )}
    </div>
  );
}
