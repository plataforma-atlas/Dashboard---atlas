"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Banknote,
  BarChart3,
  DollarSign,
  Eye,
  Filter,
  MousePointerClick,
  Percent,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Campaign, FunnelRow } from "@/lib/types";
import { EventoAdSpendConsolidatedRow, EventoAdSpendRow } from "@/lib/evento/types";
import {
  toEventoDailyPerformanceStats,
  toEventoInvestimentoPorCampana,
  toEventoKpis,
  toEventoVentasPorFuente,
} from "@/lib/evento/aggregate";
import { formatMoney, formatNumber, formatPercent } from "@/lib/webinar-os/aggregate";
import { RangoRapido, rangoRapido } from "@/lib/webinar-os/control-center/dateRanges";
import { MetaAdsResponse } from "@/lib/meta-ads/types";
import { V3Dashboard, V3Lead } from "@/lib/v3/types";
import VermetricasLoader from "@/components/VermetricasLoader";
import V3ComingSoon from "@/components/v3/V3ComingSoon";
import MetaNoConectado from "@/components/v3/MetaNoConectado";
import KpiCard from "@/components/v3/KpiCard";
import AnimatedNumber from "@/components/v3/AnimatedNumber";
import V3PeriodFilter from "@/components/v3/V3PeriodFilter";
import PerformanceChart from "@/components/v3/PerformanceChart";
import DesempenoDiarioChart from "@/components/v3/DesempenoDiarioChart";
import Tabs from "@/components/v3/Tabs";
import DailyDetailTable from "@/components/v3/DailyDetailTable";
import HorizontalBarPanel from "@/components/v3/HorizontalBarPanel";
import { formatMoneyEnMoneda } from "@/lib/v3/format";

type Session = { authenticated: boolean; role?: "admin" | "client"; clientes?: string[] };
type FunnelResponse = { source: "n8n" | "error"; rows: FunnelRow[]; message?: string };

export default function V3ClientePage() {
  const router = useRouter();
  const params = useParams<{ clienteId: string }>();
  const clienteId = params.clienteId;
  const searchParams = useSearchParams();
  const dashboardIdParam = searchParams.get("dashboard") ?? "";

  const [session, setSession] = useState<Session | null>(null);
  const [clientes, setClientes] = useState<{ id: string; name: string }[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

  // Dashboards de tipo Lanzamiento (v3_dashboards) — el selector vive en la
  // barra global (V3Topbar), acá solo leemos cuál está elegido vía ?dashboard=.
  const [dashboards, setDashboards] = useState<V3Dashboard[]>([]);
  const [dashboardsLoading, setDashboardsLoading] = useState(true);
  const [metaData, setMetaData] = useState<MetaAdsResponse | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [leads, setLeads] = useState<V3Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  // Filtra leads/ventas propios por fecha — Meta Ads (inversión/impresiones/
  // clics) sigue fijo en los últimos 30 días, el pull de n8n todavía no
  // acepta un rango custom.
  const [periodo, setPeriodo] = useState<RangoRapido>("30days");
  const [rangoPeriodo, setRangoPeriodo] = useState(() => rangoRapido("30days"));
  function aplicarPeriodo(p: RangoRapido, r: { fecha_inicio: string; fecha_fin: string }) {
    setPeriodo(p);
    setRangoPeriodo(r);
  }

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

  // 4b. Dashboards de Lanzamiento (v3_dashboards) — independiente del sistema
  // viejo de Campaign/strategy_type de arriba.
  useEffect(() => {
    if (!session?.authenticated || !clienteId) return;
    let cancelled = false;
    setDashboardsLoading(true);
    fetch(`/api/v3/dashboards?cliente_id=${clienteId}`, { cache: "no-store" })
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => {
        if (!cancelled) setDashboards(ok ? body.dashboards ?? [] : []);
      })
      .catch(() => {
        if (!cancelled) setDashboards([]);
      })
      .finally(() => {
        if (!cancelled) setDashboardsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.authenticated, clienteId]);

  const dashboardActual = useMemo(
    () => dashboards.find((d) => String(d.id) === dashboardIdParam) ?? null,
    [dashboards, dashboardIdParam]
  );
  const esLanzamiento = dashboardActual?.tipo === "lanzamiento";

  // 4c. Meta Ads + leads/ventas propios, solo si hay un dashboard de Lanzamiento elegido.
  useEffect(() => {
    if (!esLanzamiento || !dashboardActual) return;
    let cancelled = false;
    setMetaLoading(true);
    const qs = new URLSearchParams({ cliente_id: clienteId });
    if (dashboardActual.nomenclatura_filtro) qs.set("nomenclatura", dashboardActual.nomenclatura_filtro);
    fetch(`/api/anuncios/meta?${qs.toString()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((body: MetaAdsResponse) => {
        if (!cancelled) setMetaData(body);
      })
      .catch(() => {
        if (!cancelled) setMetaData(null);
      })
      .finally(() => {
        if (!cancelled) setMetaLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [esLanzamiento, dashboardActual, clienteId]);

  useEffect(() => {
    if (!esLanzamiento || !dashboardActual) return;
    let cancelled = false;
    setLeadsLoading(true);
    const qs = new URLSearchParams({ cliente_id: clienteId, dashboard_id: String(dashboardActual.id) });
    if (rangoPeriodo.fecha_inicio) qs.set("fecha_inicio", rangoPeriodo.fecha_inicio);
    if (rangoPeriodo.fecha_fin) qs.set("fecha_fin", rangoPeriodo.fecha_fin);
    fetch(`/api/v3/leads?${qs.toString()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((body: { leads?: V3Lead[] }) => {
        if (!cancelled) setLeads(body.leads ?? []);
      })
      .catch(() => {
        if (!cancelled) setLeads([]);
      })
      .finally(() => {
        if (!cancelled) setLeadsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [esLanzamiento, dashboardActual, clienteId, rangoPeriodo.fecha_inicio, rangoPeriodo.fecha_fin]);

  // Métricas de la sección Meta del Home de Lanzamiento. "Facturación bruta"
  // y "neta"/cash-collect son hoy la misma suma de extra.monto de Hotmart —
  // quedan como dos tarjetas separadas porque a futuro pueden divergir
  // (comisiones, pagos en cuotas), sin que haya que rehacer la UI.
  const lanzamientoMetrics = useMemo(() => {
    if (!metaData || !metaData.conectado) return null;
    const inversion = metaData.campanas.reduce((acc, c) => acc + c.spend, 0);
    const impresiones = metaData.campanas.reduce((acc, c) => acc + c.impressions, 0);
    const clics = metaData.campanas.reduce((acc, c) => acc + c.clicks, 0);

    const ventas = leads.filter((l) => l.status === "comprado");
    const leadsCount = leads.length;
    const ventasCount = ventas.length;
    const facturacion = ventas.reduce((acc, l) => acc + (typeof l.extra?.monto === "number" ? l.extra.monto : 0), 0);
    // Las ventas de Hotmart traen su propia moneda (extra.moneda) — no asumir USD.
    // Si hubiera ventas en más de una moneda, tomamos la de la primera; sumarlas
    // directo ya sería incorrecto y queda fuera de alcance de esta entrega.
    const primeraMoneda = ventas.find((l) => typeof l.extra?.moneda === "string" && l.extra.moneda);
    const moneda = typeof primeraMoneda?.extra?.moneda === "string" ? primeraMoneda.extra.moneda : "USD";

    const roas = inversion > 0 ? facturacion / inversion : null;
    const conversionPagina = clics > 0 ? (leadsCount / clics) * 100 : null;
    const conversionGlobal = leadsCount > 0 ? (ventasCount / leadsCount) * 100 : null;

    return { inversion, impresiones, clics, leadsCount, ventasCount, facturacion, moneda, roas, conversionPagina, conversionGlobal };
  }, [metaData, leads]);

  // Desempeño por día para el gráfico de abajo: Facturación/Ventas se arman
  // agrupando por día los leads con status='comprado' (respetan el filtro de
  // fecha de la V3); Inversión viene del nuevo desglose diario de Meta
  // (metaData.diario, siempre últimos 30 días, igual que el resto del bloque
  // Meta Ads) — se mergean por fecha y de ahí sale el ROAS real por día.
  const desempenoPorDia = useMemo(() => {
    const porFecha = new Map<string, { inversion: number; facturacion: number }>();
    if (metaData?.conectado) {
      for (const d of metaData.diario) {
        const actual = porFecha.get(d.fecha) ?? { inversion: 0, facturacion: 0 };
        actual.inversion += d.inversion;
        porFecha.set(d.fecha, actual);
      }
    }
    for (const l of leads) {
      if (l.status !== "comprado") continue;
      const fecha = l.created_at.slice(0, 10);
      const monto = typeof l.extra?.monto === "number" ? l.extra.monto : 0;
      const actual = porFecha.get(fecha) ?? { inversion: 0, facturacion: 0 };
      actual.facturacion += monto;
      porFecha.set(fecha, actual);
    }
    return Array.from(porFecha.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, v]) => ({
        fecha,
        inversion: v.inversion,
        facturacion: v.facturacion,
        roas: v.inversion > 0 ? v.facturacion / v.inversion : null,
      }));
  }, [metaData, leads]);

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

  if (!session || !session.authenticated || campaignsLoading || dashboardsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <VermetricasLoader />
      </div>
    );
  }

  if (esLanzamiento && dashboardActual) {
    if (metaLoading || leadsLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <VermetricasLoader />
        </div>
      );
    }

    if (!metaData || !metaData.conectado) {
      return <MetaNoConectado />;
    }

    const m = lanzamientoMetrics!;
    // "—" no se anima (no hay nada que contar hacia un guion) — solo los
    // valores reales suben desde el anterior.
    const numeroOGuion = (valor: number | null, formato: (n: number) => string) =>
      valor == null ? "—" : <AnimatedNumber value={valor} format={formato} />;

    return (
      <div className="px-4 py-8 md:px-8 max-w-7xl mx-auto flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.14em] text-primary font-mono">Dashboard · Lanzamiento</span>
          <h1 className="font-display text-2xl text-on-surface font-semibold">{dashboardActual.nombre}</h1>
          <p className="text-sm text-on-surface-variant">{clienteNombre}</p>
        </header>

        <V3PeriodFilter periodo={periodo} rango={rangoPeriodo} onAplicar={aplicarPeriodo} />

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-on-surface">
            Meta Ads <span className="text-on-surface-faint font-normal">· inversión/impresiones/clics siempre últimos 30 días</span>
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard icon={Wallet} label="Inversión publicitaria" value={numeroOGuion(m.inversion, formatMoney)} accent="primary" />
            <KpiCard icon={Eye} label="Impresiones" value={numeroOGuion(m.impresiones, formatNumber)} accent="primary" />
            <KpiCard icon={MousePointerClick} label="Clics" value={numeroOGuion(m.clics, formatNumber)} accent="primary" />
            <KpiCard
              icon={Filter}
              label="% Conversión"
              value={numeroOGuion(m.conversionPagina, formatPercent)}
              sub="Clics → Leads (página de captación)"
              accent="primary"
            />
            <KpiCard
              icon={Percent}
              label="% Conversión global"
              value={numeroOGuion(m.conversionGlobal, formatPercent)}
              sub="Leads → Ventas (embudo completo)"
              accent="primary"
            />
            <KpiCard
              icon={DollarSign}
              label="Facturación bruta"
              value={numeroOGuion(m.facturacion, (n) => formatMoneyEnMoneda(n, m.moneda))}
              accent="success"
            />
            <KpiCard
              icon={Banknote}
              label="Cash collect (facturación neta)"
              value={numeroOGuion(m.facturacion, (n) => formatMoneyEnMoneda(n, m.moneda))}
              accent="success"
            />
            <KpiCard icon={TrendingUp} label="ROAS bruto" value={numeroOGuion(m.roas, (n) => `${n.toFixed(2)}x`)} accent="primary" />
            <KpiCard icon={BarChart3} label="ROAS neto" value={numeroOGuion(m.roas, (n) => `${n.toFixed(2)}x`)} accent="primary" />
            <KpiCard icon={ShoppingCart} label="Ventas" value={numeroOGuion(m.ventasCount, formatNumber)} accent="success" />
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <h3 className="text-sm font-semibold text-on-surface">
              Desempeño por día{" "}
              <span className="text-on-surface-faint font-normal">· inversión siempre últimos 30 días, facturación según el período elegido</span>
            </h3>
            <DesempenoDiarioChart rows={desempenoPorDia} moneda={m.moneda} />
          </div>
        </section>
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
