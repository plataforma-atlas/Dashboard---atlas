"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { MetaAdsResponse } from "@/lib/meta-ads/types";
import { V3Dashboard } from "@/lib/v3/types";
import VermetricasLoader from "@/components/VermetricasLoader";
import MetaNoConectado from "@/components/v3/MetaNoConectado";
import Tabs from "@/components/v3/Tabs";
import MetaAdsTable from "@/components/v3/MetaAdsTable";

export default function V3AnunciosPage() {
  const params = useParams<{ clienteId: string }>();
  const clienteId = params.clienteId;
  const searchParams = useSearchParams();
  const dashboardIdParam = searchParams.get("dashboard") ?? "";

  const [dashboards, setDashboards] = useState<V3Dashboard[]>([]);

  const [data, setData] = useState<MetaAdsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"campanhas" | "conjuntos" | "anuncios">("campanhas");

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
        />
        <div className="pt-4">
          {activeTab === "campanhas" && (
            <MetaAdsTable
              nombreColumna="Campaña"
              onToggleEstado={handleToggleEstado}
              rows={data.campanas.map((c) => ({
                id: c.campaign_id,
                nombre: c.campaign_name,
                subtitulo: c.ad_account_label,
                status: c.status,
                spend: c.spend,
                impressions: c.impressions,
                clicks: c.clicks,
                ctr: c.ctr,
                cpm: c.cpm,
                leads: c.leads,
              }))}
            />
          )}
          {activeTab === "conjuntos" && (
            <MetaAdsTable
              nombreColumna="Conjunto de anuncios"
              onToggleEstado={handleToggleEstado}
              rows={data.conjuntos.map((s) => ({
                id: s.adset_id,
                nombre: s.adset_name,
                subtitulo: `${s.ad_account_label} · ${s.campaign_name}`,
                status: s.status,
                spend: s.spend,
                impressions: s.impressions,
                clicks: s.clicks,
                ctr: s.ctr,
                cpm: s.cpm,
                leads: s.leads,
              }))}
            />
          )}
          {activeTab === "anuncios" && (
            <MetaAdsTable
              nombreColumna="Anuncio"
              onToggleEstado={handleToggleEstado}
              rows={data.anuncios.map((a) => ({
                id: a.ad_id,
                nombre: a.ad_name,
                subtitulo: `${a.ad_account_label} · ${a.campaign_name} · ${a.adset_name}`,
                status: a.status,
                spend: a.spend,
                impressions: a.impressions,
                clicks: a.clicks,
                ctr: a.ctr,
                cpm: a.cpm,
                leads: a.leads,
              }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
