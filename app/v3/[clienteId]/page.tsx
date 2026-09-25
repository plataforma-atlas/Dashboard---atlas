"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DollarSign, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Campaign, FunnelRow } from "@/lib/types";
import { EventoAdSpendConsolidatedRow, EventoAdSpendRow } from "@/lib/evento/types";
import {
  toEventoDailyPerformanceStats,
  toEventoInvestimentoPorCampana,
  toEventoKpis,
  toEventoVentasPorFuente,
} from "@/lib/evento/aggregate";
import { formatMoney } from "@/lib/webinar-os/aggregate";
import VermetricasLoader from "@/components/VermetricasLoader";
import V3ComingSoon from "@/components/v3/V3ComingSoon";
import KpiCard from "@/components/v3/KpiCard";
import PerformanceChart from "@/components/v3/PerformanceChart";
import Tabs from "@/components/v3/Tabs";
import DailyDetailTable from "@/components/v3/DailyDetailTable";
import HorizontalBarPanel from "@/components/v3/HorizontalBarPanel";

type Session = { authenticated: boolean; role?: "admin" | "client"; clientes?: string[] };
type FunnelResponse = { source: "n8n" | "error"; rows: FunnelRow[]; message?: string };

export default function V3ClientePage() {
  const router = useRouter();
  const params = useParams<{ clienteId: string }>();
  const clienteId = params.clienteId;

  const [session, setSession] = useState<Session | null>(null);
  const [clientes, setClientes] = useState<{ id: string; name: string }[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

  const [eventoByAngle, setEventoByAngle] = useState<{ campaign: Campaign; rows: FunnelRow[] }[]>([]);
  const [adSpend, setAdSpend] = useState<EventoAdSpendRow[]>([]);
  const [adSpendConsolidated, setAdSpendConsolidated] = useState<EventoAdSpendConsolidatedRow[]>([]);
  const [eventoLoading, setEventoLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"detalhes" | "porhora" | "reembolsos">("detalhes");

  // 1. Sesión.
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : { authenticated: false }))
      .then((data: Session) => setSession(data))
      .catch(() => setSession({ authenticated: false }));
  }, []);

  useEffect(() => {
    if (session && !session.authenticated) window.location.href = "/login";
  }, [session]);

  // 2. Un cliente no puede quedarse en la URL de otro cliente que no le pertenece.
  useEffect(() => {
    if (!session?.authenticated || session.role !== "client") return;
    if (!session.clientes || session.clientes.length === 0) return;
    if (!session.clientes.includes(clienteId)) {
      router.replace(`/v3/${session.clientes[0]}`);
    }
  }, [session, clienteId, router]);

  // 3. Lista de clientes (para mostrar el nombre real).
  useEffect(() => {
    if (!session?.authenticated) return;
    fetch("/api/clientes", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setClientes(data.clientes ?? []))
      .catch(() => setClientes([]));
  }, [session?.authenticated]);

  // 4. Campañas del cliente — misma lógica de "preferida" que la versión clásica.
  useEffect(() => {
    if (!session?.authenticated || !clienteId) return;
    let cancelled = false;
    setCampaignsLoading(true);
    fetch(`/api/campanas?cliente_id=${clienteId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const list: Campaign[] = data.campanas ?? [];
        setCampaigns(list);
      })
      .catch(() => {
        if (!cancelled) setCampaigns([]);
      })
      .finally(() => {
        if (!cancelled) setCampaignsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.authenticated, clienteId]);

  const selectedCampaign = useMemo(() => {
    const preferred = campaigns.find((c) => c.status === "active") ?? campaigns[0];
    return preferred ?? null;
  }, [campaigns]);

  const isEventoPresencial = selectedCampaign?.strategy_type === "evento_presencial";

  const eventoCampaigns = useMemo(
    () => campaigns.filter((c) => c.strategy_type === "evento_presencial" && c.status !== "archived"),
    [campaigns]
  );

  // 5. Datos reales del evento presencial (mismo patrón que app/page.tsx).
  useEffect(() => {
    if (!isEventoPresencial || eventoCampaigns.length === 0) {
      setEventoByAngle([]);
      setEventoLoading(false);
      return;
    }
    let cancelled = false;
    setEventoLoading(true);
    Promise.all(
      eventoCampaigns.map((campaign) => {
        const p = new URLSearchParams();
        p.set("campaign_id", String(campaign.id));
        p.set("cliente_id", clienteId);
        return fetch(`/api/funnel?${p.toString()}`, { cache: "no-store" })
          .then((r) => r.json())
          .then((data: FunnelResponse) => ({ campaign, rows: data.rows ?? [] }));
      })
    )
      .then((results) => {
        if (!cancelled) setEventoByAngle(results);
      })
      .catch(() => {
        if (!cancelled) setEventoByAngle([]);
      })
      .finally(() => {
        if (!cancelled) setEventoLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isEventoPresencial, eventoCampaigns, clienteId]);

  // 6. Gasto de pauta (por campaña) y consolidado (por día) — solo evento.
  useEffect(() => {
    if (!isEventoPresencial) {
      setAdSpend([]);
      setAdSpendConsolidated([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/evento/gasto-pauta?cliente_id=${clienteId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { adSpend?: EventoAdSpendRow[] }) => {
        if (!cancelled) setAdSpend(data.adSpend ?? []);
      })
      .catch(() => {
        if (!cancelled) setAdSpend([]);
      });
    fetch(`/api/evento/gasto-pauta-consolidado?cliente_id=${clienteId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { adSpendConsolidated?: EventoAdSpendConsolidatedRow[] }) => {
        if (!cancelled) setAdSpendConsolidated(data.adSpendConsolidated ?? []);
      })
      .catch(() => {
        if (!cancelled) setAdSpendConsolidated([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isEventoPresencial, clienteId]);

  const allEventoRows = useMemo(() => eventoByAngle.flatMap((a) => a.rows), [eventoByAngle]);
  const kpis = useMemo(() => toEventoKpis(allEventoRows), [allEventoRows]);
  const investimentoTotal = useMemo(
    () => adSpendConsolidated.reduce((acc, r) => acc + (Number(r.spend) || 0), 0),
    [adSpendConsolidated]
  );
  const faturamentoTotal = kpis.capitalVendido;
  const lucroTotal = faturamentoTotal - investimentoTotal;
  const roasTotal = investimentoTotal > 0 ? faturamentoTotal / investimentoTotal : null;

  const dailyPerformance = useMemo(
    () => toEventoDailyPerformanceStats(adSpendConsolidated, eventoByAngle),
    [adSpendConsolidated, eventoByAngle]
  );
  const ventasPorFuente = useMemo(() => toEventoVentasPorFuente(eventoByAngle), [eventoByAngle]);
  const investimentoPorCampana = useMemo(() => toEventoInvestimentoPorCampana(adSpend), [adSpend]);

  const clienteNombre = clientes.find((c) => c.id === clienteId)?.name ?? clienteId;

  if (!session || !session.authenticated || campaignsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <VermetricasLoader />
      </div>
    );
  }

  if (!isEventoPresencial) {
    return <V3ComingSoon strategyType={selectedCampaign?.strategy_type ?? null} />;
  }

  if (eventoLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <VermetricasLoader />
      </div>
    );
  }

  return (
    <div className="px-4 py-8 md:px-8 max-w-7xl mx-auto flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-[0.14em] text-primary font-mono">Dashboard</span>
        <h1 className="font-display text-2xl text-on-surface font-semibold">{clienteNombre}</h1>
        <p className="text-sm text-on-surface-variant">{selectedCampaign?.name}</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={DollarSign} label="Faturamento" value={formatMoney(faturamentoTotal)} accent="success" />
        <KpiCard icon={Wallet} label="Investimento" value={formatMoney(investimentoTotal)} accent="primary" />
        <KpiCard icon={lucroTotal >= 0 ? TrendingUp : TrendingDown} label="Lucro" value={formatMoney(lucroTotal)} accent={lucroTotal >= 0 ? "success" : "error"} />
        <KpiCard icon={TrendingUp} label="ROAS" value={roasTotal != null ? `${roasTotal.toFixed(2)}x` : "—"} accent="primary" />
      </div>

      <div className="bg-surface border border-outline rounded-xl p-4">
        <h2 className="text-sm font-semibold text-on-surface mb-4">Performance por día</h2>
        <PerformanceChart rows={dailyPerformance} />
      </div>

      <div className="bg-surface border border-outline rounded-xl p-4">
        <Tabs
          tabs={[
            { id: "detalhes", label: "Detalhes" },
            { id: "porhora", label: "Por hora do dia / dia da semana" },
            { id: "reembolsos", label: "Reembolsos" },
          ]}
          active={activeTab}
          onChange={(id) => setActiveTab(id as typeof activeTab)}
        />
        <div className="pt-4">
          {activeTab === "detalhes" && <DailyDetailTable rows={dailyPerformance} />}
          {activeTab === "porhora" && <V3ComingSoon />}
          {activeTab === "reembolsos" && <V3ComingSoon />}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <HorizontalBarPanel
          title="Vendas por fuente"
          rows={ventasPorFuente.map((v) => ({ label: v.source, value: v.ingresos }))}
          formatValue={formatMoney}
        />
        <HorizontalBarPanel
          title="Investimento por campaña"
          rows={investimentoPorCampana.map((v) => ({ label: v.campaign, value: v.spend }))}
          formatValue={formatMoney}
        />
      </div>
    </div>
  );
}
