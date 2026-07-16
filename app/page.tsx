"use client";

import { useEffect, useMemo, useState } from "react";
import { FunnelRow } from "@/lib/types";
import { toCountryBreakdown, toKpis, toSourceBreakdown, toStageSummary } from "@/lib/aggregate";
import { clients, defaultClient } from "@/lib/clients";
import KpiCards from "@/components/KpiCards";
import LaunchFunnel from "@/components/LaunchFunnel";
import CountryBarChart from "@/components/CountryBarChart";
import SourceTable from "@/components/SourceTable";
import FiltersBar from "@/components/FiltersBar";
import ClientSelector from "@/components/ClientSelector";
import ThemeSwitch from "@/components/ThemeSwitch";

type ApiResponse = {
  source: "mock" | "n8n" | "error";
  rows: FunnelRow[];
  message?: string;
};

export default function Home() {
  const [rows, setRows] = useState<FunnelRow[]>([]);
  const [source, setSource] = useState<ApiResponse["source"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [pais, setPais] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(defaultClient.id);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) ?? defaultClient,
    [selectedClientId]
  );

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.set("fecha_inicio", fechaInicio);
      if (fechaFin) params.set("fecha_fin", fechaFin);
      if (pais) params.set("pais", pais);
      if (selectedClient.clienteId) params.set("cliente_id", selectedClient.clienteId);

      const res = await fetch(`/api/funnel?${params.toString()}`, { cache: "no-store" });
      const data: ApiResponse = await res.json();
      setRows(data.rows ?? []);
      setSource(data.source);
    } catch (e) {
      setSource("error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId]);

  const stages = useMemo(() => toStageSummary(rows), [rows]);
  const countryData = useMemo(() => toCountryBreakdown(rows, 1), [rows]);
  const sourceData = useMemo(() => toSourceBreakdown(rows), [rows]);
  const kpis = useMemo(() => toKpis(rows), [rows]);

  const paisesDisponibles = useMemo(() => {
    const set = new Set(rows.map((r) => r.country).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [rows]);

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto flex flex-col gap-5">
      <ThemeSwitch theme={selectedClient.theme} />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.14em] text-signal font-mono">
            Panel de lanzamiento
          </span>
          <h1 className="font-display text-2xl md:text-3xl text-ink font-semibold">{selectedClient.name}</h1>
          <p className="text-sm text-mute">Telemetría del embudo: registro, webinar, tripwire y conversión.</p>
        </div>

        <ClientSelector clients={clients} selectedId={selectedClientId} onSelect={setSelectedClientId} />
      </header>

      <FiltersBar
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
        pais={pais}
        paisesDisponibles={paisesDisponibles}
        onChange={(next) => {
          if (next.fechaInicio !== undefined) setFechaInicio(next.fechaInicio);
          if (next.fechaFin !== undefined) setFechaFin(next.fechaFin);
          if (next.pais !== undefined) setPais(next.pais);
        }}
        onRefresh={load}
        loading={loading}
        source={source}
      />

      <KpiCards
        totalLeads={kpis.totalLeads}
        totalIngresos={kpis.totalIngresos}
        conversionGlobal={kpis.conversionGlobal}
        ticketPromedio={kpis.ticketPromedio}
      />

      <LaunchFunnel stages={stages} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CountryBarChart data={countryData} />
        <SourceTable data={sourceData} />
      </div>

      <footer className="text-center text-[11px] text-faint font-mono py-4">
        {source === "mock"
          ? "Mostrando datos de ejemplo — configura N8N_WEBHOOK_URL para ver datos reales."
          : "Datos en vivo desde n8n"}
      </footer>
    </main>
  );
}
