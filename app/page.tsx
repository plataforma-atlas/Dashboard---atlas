"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Campaign, FunnelRow } from "@/lib/types";
import { toCountryBreakdown, toKpis, toSourceBreakdown, toStageSummary } from "@/lib/aggregate";
import { defaultClient, themeForClient, ClientConfig } from "@/lib/clients";
import { toFunnelStages, formatMoney, formatPercent } from "@/lib/webinar-os/aggregate";
import { MODULE_ORDER } from "@/lib/webinar-os/moduleConfigs";
import { WebinarDetail, WebinarMetrics, WebinarSummary } from "@/lib/webinar-os/types";
import { countryFlagEmoji } from "@/lib/webinar-os/countryFlag";
import { toVslDailyRows, toVslKpis, toVslFunnelStages } from "@/lib/vsl/aggregate";
import { toEventoKpis, toEventoAngleStats, toEventoTemperaturaStats, toEventoDailyTraficoStats } from "@/lib/evento/aggregate";
import { EventoTierRow, EventoAdSpendRow, EventoAdSpendConsolidatedRow, EventoAdPerformanceRow } from "@/lib/evento/types";
import VslSelector from "@/components/vsl/VslSelector";
import VslKpiCard from "@/components/vsl/VslKpiCard";
import VslDailyChart from "@/components/vsl/VslDailyChart";
import VslDailyTable from "@/components/vsl/VslDailyTable";
import VslFunnel from "@/components/vsl/VslFunnel";
import EventoSelector from "@/components/evento/EventoSelector";
import EventoAngleTable from "@/components/evento/EventoAngleTable";
import EventoAdSpendDailyTable from "@/components/evento/EventoAdSpendDailyTable";
import EventoAdSpendConsolidatedTable from "@/components/evento/EventoAdSpendConsolidatedTable";
import EventoAdPerformanceTable from "@/components/evento/EventoAdPerformanceTable";
import EventoTierPieChart from "@/components/evento/EventoTierPieChart";
import EventoTemperaturaChart from "@/components/evento/EventoTemperaturaChart";
import EventoDailyTraficoChart from "@/components/evento/EventoDailyTraficoChart";
import KpiCards from "@/components/KpiCards";
import LaunchFunnel from "@/components/LaunchFunnel";
import CountryBarChart from "@/components/CountryBarChart";
import SourceTable from "@/components/SourceTable";
import FiltersBar from "@/components/FiltersBar";
import ClientSelector from "@/components/ClientSelector";
import CampaignSelector from "@/components/CampaignSelector";
import { useThemeMode } from "@/components/ThemeModeProvider";
import ExecutiveFunnel from "@/components/webinar-os/ExecutiveFunnel";
import ExecutiveSummaryKpis from "@/components/webinar-os/ExecutiveSummaryKpis";
import ModuleShell from "@/components/webinar-os/ModuleShell";
import FunnelBars from "@/components/webinar-os/FunnelBars";
import KpiModuleSection from "@/components/webinar-os/KpiModuleSection";
import NivelatoriosStaggeredBars from "@/components/webinar-os/NivelatoriosStaggeredBars";
import WebinarRetentionChart from "@/components/webinar-os/WebinarRetentionChart";
import MetaAdsSection from "@/components/webinar-os/MetaAdsSection";
import PdfReportButton from "@/components/webinar-os/PdfReportButton";
import WebinarCountrySelector from "@/components/webinar-os/WebinarCountrySelector";
import WebinarNavSidebar, { NavSection } from "@/components/webinar-os/WebinarNavSidebar";
import ThemeModeToggle from "@/components/ThemeModeToggle";
import VermetricasLoader from "@/components/VermetricasLoader";

type FunnelResponse = { source: "n8n" | "error"; rows: FunnelRow[]; message?: string };
type Session = { authenticated: boolean; role?: "admin" | "client"; clientes?: string[] };

const KPI_ONLY_MODULES = new Set(["publicidad", "gracias", "gestion_comercial", "ventas", "downsell", "recuperacion", "resultados"]);

const EMPTY_METRICS: WebinarMetrics = {
  publicidad: {},
  landing: {},
  gracias: {},
  nivelatorios: {},
  webinar: {},
  oferta: {},
  gestion_comercial: {},
  ventas: {},
  downsell: {},
  recuperacion: {},
  resultados: {},
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" });
}

function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<Session | null>(null);

  // Modo claro/oscuro y tema activo ahora viven en ThemeModeProvider (app/layout.tsx),
  // compartidos por toda la app — este componente solo avisa cuál es su tema (el del
  // cliente seleccionado) cada vez que cambia.
  const { mode, toggleMode, setActiveTheme } = useThemeMode();

  const [rows, setRows] = useState<FunnelRow[]>([]);
  const [source, setSource] = useState<FunnelResponse["source"] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [pais, setPais] = useState("");

  // Vacío = "todavía no elegido". Un cliente (role=client) se auto-selecciona
  // a sí mismo abajo; un admin ve la pantalla de "elige un cliente" hasta que
  // haga clic en uno — nunca cae en un cliente fijo por defecto.
  const [selectedClientId, setSelectedClientId] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);

  const [webinarsList, setWebinarsList] = useState<WebinarSummary[]>([]);
  const [webinarsListLoading, setWebinarsListLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedWebinarId, setSelectedWebinarId] = useState<number | null>(null);
  const [navSection, setNavSection] = useState<NavSection>("resumen");

  const [webinarDetail, setWebinarDetail] = useState<WebinarDetail | null>(null);
  const [webinarDetailLoading, setWebinarDetailLoading] = useState(false);
  const [webinarDetailError, setWebinarDetailError] = useState<string | null>(null);

  const [vslAngleId, setVslAngleId] = useState<number | "all">("all");
  const [vslRows, setVslRows] = useState<FunnelRow[]>([]);
  const [vslLoading, setVslLoading] = useState(false);

  const [eventoAngleId, setEventoAngleId] = useState<number | "all">("all");
  const [eventoByAngle, setEventoByAngle] = useState<{ campaign: Campaign; rows: FunnelRow[] }[]>([]);
  const [eventoLoading, setEventoLoading] = useState(false);
  const [eventoTiers, setEventoTiers] = useState<EventoTierRow[]>([]);
  const [eventoAdSpend, setEventoAdSpend] = useState<EventoAdSpendRow[]>([]);
  const [eventoAdSpendConsolidated, setEventoAdSpendConsolidated] = useState<EventoAdSpendConsolidatedRow[]>([]);
  const [eventoAdPerformance, setEventoAdPerformance] = useState<EventoAdPerformanceRow[]>([]);

  const [visibleClients, setVisibleClients] = useState<ClientConfig[]>([]);

  const selectedClient = useMemo(
    () => visibleClients.find((c) => c.id === selectedClientId) ?? visibleClients[0] ?? defaultClient,
    [selectedClientId, visibleClients]
  );

  // Avisa al ThemeModeProvider global cuál es el tema activo (el del cliente
  // seleccionado) — el provider se encarga de aplicar la variante clara/oscura.
  useEffect(() => {
    setActiveTheme(selectedClient.theme);
  }, [selectedClient, setActiveTheme]);

  // 1. Sesión
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : { authenticated: false }))
      .then((data: Session) => {
        setSession(data);
        if (data.role === "client" && data.clientes?.length) setSelectedClientId(data.clientes[0]);
      })
      .catch(() => setSession({ authenticated: false }));
  }, []);

  // 1b. Lista real de clientes (Postgres, vía /api/clientes) — reemplaza el
  // array fijo que antes vivía en lib/clients.ts, así un cliente creado desde
  // Admin > Clientes aparece aquí sin tocar código.
  useEffect(() => {
    if (!session?.authenticated) return;
    fetch("/api/clientes", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const list: { id: string; name: string }[] = data.clientes ?? [];
        setVisibleClients(list.map((c) => ({ id: c.id, name: c.name, theme: themeForClient(c.id) })));
        // Admin llegando con ?cliente_id= (ej. desde el selector de clientes
        // del Control Center) — respeta esa elección en vez de mostrar el
        // selector "¿Qué cliente quieres revisar?".
        if (session.role === "admin") {
          const clienteIdParam = searchParams.get("cliente_id");
          if (clienteIdParam && list.some((c) => c.id === clienteIdParam)) {
            setSelectedClientId(clienteIdParam);
          }
        }
      })
      .catch(() => setVisibleClients([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.authenticated]);

  // 2. Campañas del cliente seleccionado
  useEffect(() => {
    if (!session?.authenticated || !selectedClient) return;
    setCampaignsLoading(true);
    setSelectedCampaignId(null);
    setRows([]);
    setVslAngleId("all");
    setEventoAngleId("all");
    fetch(`/api/campanas?cliente_id=${selectedClient.id}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const list: Campaign[] = data.campanas ?? [];
        setCampaigns(list);
        // Si llegamos con ?campaign_id= (ej. desde el selector del Control
        // Center para una campaña de otra estrategia), respetamos esa
        // elección en vez de la preferida automática.
        const campaignIdParam = searchParams.get("campaign_id");
        const fromParam = campaignIdParam ? list.find((c) => String(c.id) === campaignIdParam) : null;
        // Preferimos seleccionar automáticamente una campaña "active"; si no hay, la primera disponible
        const preferred = fromParam ?? list.find((c) => c.status === "active") ?? list[0];
        if (preferred) setSelectedCampaignId(preferred.id);
      })
      .catch(() => setCampaigns([]))
      .finally(() => setCampaignsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient?.id, session?.authenticated]);

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId) ?? null;
  const isWebinarAutomatizado = selectedCampaign?.strategy_type === "webinar_automatizado";
  const isVsl = selectedCampaign?.strategy_type === "vsl";
  const isEventoPresencial = selectedCampaign?.strategy_type === "evento_presencial";

  // Los clientes de Webinar Automático van directo al Control Center (vista
  // semanal agregada) en vez de este dashboard por campaña — ese es ahora
  // el destino por defecto para esa estrategia. "?vista=clasica" es la
  // salida de emergencia para seguir viendo este dashboard si hace falta.
  useEffect(() => {
    if (!selectedClientId || campaignsLoading) return;
    if (!isWebinarAutomatizado) return;
    if (searchParams.get("vista") === "clasica") return;
    router.replace(`/webinar-os/control-center/${selectedClientId}`);
  }, [selectedClientId, campaignsLoading, isWebinarAutomatizado, searchParams, router]);
  const selectedWebinarSummary = webinarsList.find((w) => w.id === selectedWebinarId) ?? null;
  const vslCampaigns = useMemo(() => campaigns.filter((c) => c.strategy_type === "vsl"), [campaigns]);
  const eventoCampaigns = useMemo(
    () => campaigns.filter((c) => c.strategy_type === "evento_presencial" && c.status !== "archived"),
    [campaigns]
  );

  async function loadFunnel(campaignId: number, clienteId: string, paisFilter: string) {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      params.set("campaign_id", String(campaignId));
      params.set("cliente_id", clienteId);
      if (fechaInicio) params.set("fecha_inicio", fechaInicio);
      if (fechaFin) params.set("fecha_fin", fechaFin);
      if (paisFilter) params.set("pais", paisFilter);

      const res = await fetch(`/api/funnel?${params.toString()}`, { cache: "no-store" });
      const data: FunnelResponse = await res.json();
      setRows(data.rows ?? []);
      setSource(data.source);
      if (data.source === "error") setErrorMsg(data.message ?? "No se pudo cargar el embudo");
    } catch {
      setSource("error");
      setErrorMsg("No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  }

  // 3. Datos reales del embudo (leads/ventas por etapa, país y fuente). Para campañas
  // normales usa la campaña + país seleccionados arriba; para Webinar Automático usa
  // la edición y el país elegidos en el sidebar (pueden no coincidir con el dropdown
  // superior, ya que las 3 ediciones comparten el mismo strategy_type).
  const effectiveCampaignId = isWebinarAutomatizado ? selectedWebinarSummary?.campaign_id ?? null : selectedCampaignId;
  const effectivePais = isWebinarAutomatizado ? selectedCountry ?? "" : pais;

  useEffect(() => {
    if (!effectiveCampaignId || !selectedClient) return;
    loadFunnel(effectiveCampaignId, selectedClient.id, effectivePais);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCampaignId, effectivePais, fechaInicio, fechaFin, selectedClient?.id]);

  // 4. Lista de webinars (país + edición) del cliente, solo para Webinar Automático.
  useEffect(() => {
    if (!isWebinarAutomatizado || !selectedClient) {
      setWebinarsList([]);
      setSelectedCountry(null);
      setSelectedWebinarId(null);
      return;
    }
    let cancelled = false;
    setWebinarsListLoading(true);
    fetch(`/api/webinar-os/webinars?cliente_id=${selectedClient.id}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const list: WebinarSummary[] = data.webinars ?? [];
        setWebinarsList(list);
        const countries = Array.from(new Set(list.map((w) => w.country))).sort();
        const firstCountry = countries[0] ?? null;
        setSelectedCountry(firstCountry);
        const firstWebinar = list.find((w) => w.country === firstCountry);
        setSelectedWebinarId(firstWebinar?.id ?? null);
        setNavSection("resumen");
      })
      .catch(() => setWebinarsList([]))
      .finally(() => {
        if (!cancelled) setWebinarsListLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWebinarAutomatizado, selectedClient?.id]);

  // 5. Detalle granular (webinar_metrics + meta_ads) del webinar país+edición seleccionado.
  useEffect(() => {
    if (!selectedWebinarId || !selectedClient) {
      setWebinarDetail(null);
      return;
    }
    let cancelled = false;
    setWebinarDetailLoading(true);
    setWebinarDetailError(null);
    fetch(`/api/webinar-os/webinar-detalle?webinar_id=${selectedWebinarId}&cliente_id=${selectedClient.id}`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "No se pudo cargar el detalle del webinar");
        if (!cancelled) setWebinarDetail(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setWebinarDetail(null);
          setWebinarDetailError(err instanceof Error ? err.message : "No se pudo cargar el detalle del webinar");
        }
      })
      .finally(() => {
        if (!cancelled) setWebinarDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedWebinarId, selectedClient?.id]);

  // 6. Datos reales de VSL: si hay un ángulo específico elegido, trae solo esa campaña;
  // si es "Vista consolidada", trae las campañas VSL del cliente y las combina en el
  // cliente (calcular-embudo solo acepta un campaign_id por llamada).
  useEffect(() => {
    if (!isVsl || !selectedClient || vslCampaigns.length === 0) {
      setVslRows([]);
      return;
    }
    let cancelled = false;
    setVslLoading(true);
    const targetIds = vslAngleId === "all" ? vslCampaigns.map((c) => c.id) : [vslAngleId];
    Promise.all(
      targetIds.map((id) => {
        const params = new URLSearchParams();
        params.set("campaign_id", String(id));
        params.set("cliente_id", selectedClient.id);
        if (fechaInicio) params.set("fecha_inicio", fechaInicio);
        if (fechaFin) params.set("fecha_fin", fechaFin);
        return fetch(`/api/funnel?${params.toString()}`, { cache: "no-store" }).then((r) => r.json());
      })
    )
      .then((results: FunnelResponse[]) => {
        if (cancelled) return;
        setVslRows(results.flatMap((r) => r.rows ?? []));
      })
      .catch(() => {
        if (!cancelled) setVslRows([]);
      })
      .finally(() => {
        if (!cancelled) setVslLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVsl, selectedClient?.id, vslAngleId, vslCampaigns.length, fechaInicio, fechaFin]);

  // 7. Datos reales del evento presencial: trae CADA ángulo por separado (sin aplanar)
  // para poder comparar cuál convierte mejor, además de sumar el total.
  useEffect(() => {
    if (!isEventoPresencial || !selectedClient || eventoCampaigns.length === 0) {
      setEventoByAngle([]);
      return;
    }
    let cancelled = false;
    setEventoLoading(true);
    Promise.all(
      eventoCampaigns.map((campaign) => {
        const params = new URLSearchParams();
        params.set("campaign_id", String(campaign.id));
        params.set("cliente_id", selectedClient.id);
        if (fechaInicio) params.set("fecha_inicio", fechaInicio);
        if (fechaFin) params.set("fecha_fin", fechaFin);
        return fetch(`/api/funnel?${params.toString()}`, { cache: "no-store" })
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEventoPresencial, selectedClient?.id, eventoCampaigns.length, fechaInicio, fechaFin]);

  // 8. Desglose de pagos del evento (Confirmado / Platino / VIP) — total real, no por ángulo.
  useEffect(() => {
    if (!isEventoPresencial) {
      setEventoTiers([]);
      return;
    }
    let cancelled = false;
    fetch("/api/evento/resumen-pagos", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { tiers?: EventoTierRow[] }) => {
        if (!cancelled) setEventoTiers(data.tiers ?? []);
      })
      .catch(() => {
        if (!cancelled) setEventoTiers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isEventoPresencial]);

  // 9. Gasto de pauta (Meta Ads) por ángulo — solo aplica a las campañas con anuncios pagos.
  useEffect(() => {
    if (!isEventoPresencial || !selectedClient) {
      setEventoAdSpend([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/evento/gasto-pauta?cliente_id=${selectedClient.id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { adSpend?: EventoAdSpendRow[] }) => {
        if (!cancelled) setEventoAdSpend(data.adSpend ?? []);
      })
      .catch(() => {
        if (!cancelled) setEventoAdSpend([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isEventoPresencial, selectedClient?.id]);

  // 10. Gasto de pauta consolidado (todas las campañas con pauta, combinadas por fecha).
  useEffect(() => {
    if (!isEventoPresencial || !selectedClient) {
      setEventoAdSpendConsolidated([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/evento/gasto-pauta-consolidado?cliente_id=${selectedClient.id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { adSpendConsolidated?: EventoAdSpendConsolidatedRow[] }) => {
        if (!cancelled) setEventoAdSpendConsolidated(data.adSpendConsolidated ?? []);
      })
      .catch(() => {
        if (!cancelled) setEventoAdSpendConsolidated([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isEventoPresencial, selectedClient?.id]);

  // 11. Rendimiento de pauta por conjunto de anuncios y anuncio individual.
  useEffect(() => {
    if (!isEventoPresencial || !selectedClient) {
      setEventoAdPerformance([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/evento/gasto-pauta-por-anuncio?cliente_id=${selectedClient.id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { adPerformance?: EventoAdPerformanceRow[] }) => {
        if (!cancelled) setEventoAdPerformance(data.adPerformance ?? []);
      })
      .catch(() => {
        if (!cancelled) setEventoAdPerformance([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isEventoPresencial, selectedClient?.id]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const stages = useMemo(() => toStageSummary(rows), [rows]);
  const countryData = useMemo(() => toCountryBreakdown(rows, 1), [rows]);
  const sourceData = useMemo(() => toSourceBreakdown(rows), [rows]);
  const kpis = useMemo(() => toKpis(rows), [rows]);
  const totalCompras = useMemo(() => stages.filter((s) => s.ingresos > 0).reduce((acc, s) => acc + s.leads, 0), [stages]);
  const paisesDisponibles = useMemo(() => {
    const set = new Set(rows.map((r) => r.country).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [rows]);

  const vslKpis = useMemo(() => toVslKpis(vslRows), [vslRows]);
  const vslDailyRows = useMemo(() => toVslDailyRows(vslRows), [vslRows]);
  const vslFunnelStages = useMemo(() => toVslFunnelStages(vslKpis), [vslKpis]);

  const eventoAngleStats = useMemo(() => toEventoAngleStats(eventoByAngle), [eventoByAngle]);
  const eventoTemperaturaStats = useMemo(() => toEventoTemperaturaStats(eventoByAngle), [eventoByAngle]);
  const eventoDailyTrafico = useMemo(
    () => toEventoDailyTraficoStats(eventoAdSpendConsolidated, eventoByAngle),
    [eventoAdSpendConsolidated, eventoByAngle]
  );
  const eventoSelectedRows = useMemo(() => {
    if (eventoAngleId === "all") return eventoByAngle.flatMap((a) => a.rows);
    return eventoByAngle.find((a) => a.campaign.id === eventoAngleId)?.rows ?? [];
  }, [eventoByAngle, eventoAngleId]);
  const eventoKpis = useMemo(() => toEventoKpis(eventoSelectedRows), [eventoSelectedRows]);

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <VermetricasLoader />
      </div>
    );
  }

  if (!session.authenticated) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <VermetricasLoader />
      </div>
    );
  }

  if (session.role === "client" && visibleClients.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="text-center max-w-sm">
          <h1 className="font-display text-xl text-on-surface mb-2">Sin acceso asignado todavía</h1>
          <p className="text-sm text-on-surface-variant mb-6">
            Tu cuenta fue creada correctamente, pero aún no tienes ningún cliente vinculado. Contacta a un administrador de la agencia.
          </p>
          <button onClick={handleLogout} className="text-xs text-on-surface-variant hover:text-on-surface border border-outline rounded-full px-4 py-2 transition">
            Salir
          </button>
        </div>
      </main>
    );
  }

  if (session.role === "admin" && !selectedClientId) {
    // Paleta de acentos para los avatares — se asigna por índice, ciclando,
    // así cada cliente se distingue de un vistazo sin depender de datos que
    // no tenemos (logo/color propio por cliente).
    const avatarAccents = [
      "from-primary to-secondary",
      "from-secondary to-primary",
      "from-[#7C7CFB] to-[#A5A0FF]",
      "from-[#A5A0FF] to-[#7C7CFB]",
    ];
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-2xl">
          <div className="text-center flex flex-col items-center gap-2 mb-10">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface border border-outline mb-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/vermetricas-icon.png" alt="" className="h-6 w-6" />
            </span>
            <span className="text-[11px] uppercase tracking-[0.14em] text-primary font-mono">Agencia Vermetricas</span>
            <h1 className="font-display text-2xl text-on-surface font-semibold">¿Qué cliente quieres revisar?</h1>
            <p className="text-sm text-on-surface-variant max-w-sm">
              Elegí una cuenta para entrar a su panel, o revisá la cartera completa.
            </p>
          </div>

          {visibleClients.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center">Cargando clientes…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {visibleClients.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClientId(c.id)}
                  className="group flex items-center gap-3 rounded-xl border border-outline bg-surface hover:bg-surface-high hover:border-primary/60 px-4 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarAccents[i % avatarAccents.length]} text-sm font-semibold text-on-primary`}
                  >
                    {c.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-on-surface">{c.name}</span>
                    <span className="block truncate text-[11px] font-mono text-on-surface-faint mt-0.5">{c.id}</span>
                  </span>
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    className="h-4 w-4 shrink-0 text-on-surface-faint group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                  >
                    <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ))}
            </div>
          )}

          <div className="mt-10 flex items-center justify-center gap-3 border-t border-outline pt-6">
            <a
              href="/admin/cartera"
              className="text-xs font-medium text-on-surface-variant hover:text-primary transition"
            >
              Ver Cartera en su lugar
            </a>
            <span className="text-outline">•</span>
            <button onClick={handleLogout} className="text-xs font-medium text-on-surface-variant hover:text-error transition">
              Salir
            </button>
          </div>
        </div>
      </main>
    );
  }

  function renderModuleContent(key: keyof WebinarMetrics, metrics: WebinarMetrics, real?: { totalIngresos: number; totalCompras: number }) {
    if (KPI_ONLY_MODULES.has(key)) {
      let data = metrics[key] as Record<string, number | undefined>;
      // "Ventas" se respalda con datos reales (funnel_events) cuando webinar_metrics
      // todavía no tiene esta edición sincronizada — mismo fallback que el Resumen ejecutivo.
      if (key === "ventas" && real) {
        const ventas = data.ventas ?? (real.totalCompras || undefined);
        const ingresos = data.ingresos ?? (real.totalIngresos || undefined);
        const ticket_promedio = data.ticket_promedio ?? (ventas && ingresos ? ingresos / ventas : undefined);
        data = { ...data, ventas, ingresos, ticket_promedio };
      }
      return <KpiModuleSection key={key} moduleKey={key} data={data} />;
    }
    if (key === "landing") {
      const stagesLanding = toFunnelStages([
        { label: "Visitas", value: metrics.landing.visitas },
        { label: "Leads", value: metrics.landing.leads },
      ]);
      return (
        <ModuleShell key={key} icon="🖥️" title="Landing">
          <FunnelBars stages={stagesLanding} />
        </ModuleShell>
      );
    }
    if (key === "oferta") {
      const stagesOferta = toFunnelStages([
        { label: "Clics a oferta", value: metrics.oferta.clics_oferta },
        { label: "Checkout iniciado", value: metrics.oferta.checkout_iniciado },
      ]);
      return (
        <ModuleShell key={key} icon="🛒" title="Oferta">
          <FunnelBars stages={stagesOferta} />
        </ModuleShell>
      );
    }
    if (key === "nivelatorios") {
      return <NivelatoriosStaggeredBars key={key} metrics={metrics.nivelatorios} />;
    }
    if (key === "webinar") {
      return <WebinarRetentionChart key={key} metrics={metrics.webinar} />;
    }
    return null;
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mode === "dark" ? "/brand/vermetricas-horizontal-dark.png" : "/brand/vermetricas-horizontal-light.png"}
            alt="Vermetricas"
            className="h-7 w-auto self-start mb-1"
          />
          <span className="text-[11px] uppercase tracking-[0.14em] text-primary font-mono">Panel de lanzamiento</span>
          <h1 className="font-display text-2xl md:text-3xl text-on-surface font-semibold">{selectedClient.name}</h1>
          <p className="text-sm text-on-surface-variant">
            {selectedCampaign ? selectedCampaign.name : "Telemetría del embudo de marketing"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {visibleClients.length > 1 && <ClientSelector clients={visibleClients} selectedId={selectedClient.id} onSelect={setSelectedClientId} />}
          <CampaignSelector campaigns={campaigns} selectedId={selectedCampaignId} onSelect={setSelectedCampaignId} loading={campaignsLoading} />
          <ThemeModeToggle mode={mode} onToggle={toggleMode} />
          <a
            href={session.role === "admin" ? `/panel/conexiones?cliente_id=${selectedClient.id}` : "/panel/conexiones"}
            className="text-xs text-on-surface-variant hover:text-on-surface border border-outline rounded-full px-3 py-1.5 transition"
          >
            Conexiones
          </a>
          {session.role === "admin" && (
            <>
              <a href="/admin/cartera" className="text-xs text-on-surface-variant hover:text-on-surface border border-outline rounded-full px-3 py-1.5 transition">
                Cartera
              </a>
              <a href="/admin/usuarios" className="text-xs text-on-surface-variant hover:text-on-surface border border-outline rounded-full px-3 py-1.5 transition">
                Usuarios
              </a>
            </>
          )}
          <button onClick={handleLogout} className="text-xs text-on-surface-variant hover:text-on-surface border border-outline rounded-full px-3 py-1.5 transition">
            Salir
          </button>
        </div>
      </header>

      {isWebinarAutomatizado ? (
        <div className="webinar-os-scope -mx-4 px-4 md:-mx-8 md:px-8 py-6" data-wos-theme={mode}>
          <div className="flex items-center justify-between gap-3 mb-5">
            <span className="text-[11px] uppercase tracking-[0.1em] text-[var(--wos-ink-faint)] font-mono">Webinar OS</span>
            <div className="flex items-center gap-2">
              <a
                href={`/webinar-os/control-center/${selectedClient.id}`}
                className="text-xs text-[var(--wos-ink-muted)] hover:text-[var(--wos-ink)] border border-[var(--wos-border)] rounded-full px-3 py-1.5 transition"
              >
                Ver Control Center →
              </a>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="bg-[var(--wos-surface)] border border-[var(--wos-border)] rounded-md px-2 py-1 text-xs text-[var(--wos-ink)] outline-none focus:border-[var(--wos-primary)]"
              />
              <span className="text-[var(--wos-ink-faint)] text-xs">—</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="bg-[var(--wos-surface)] border border-[var(--wos-border)] rounded-md px-2 py-1 text-xs text-[var(--wos-ink)] outline-none focus:border-[var(--wos-primary)]"
              />
            </div>
          </div>

          {webinarsListLoading && <p className="text-sm text-[var(--wos-ink-muted)]">Cargando webinars…</p>}
          {!webinarsListLoading && webinarsList.length === 0 && (
            <p className="text-sm text-[var(--wos-ink-muted)]">Esta campaña todavía no tiene webinars registrados.</p>
          )}

          {webinarsList.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
              <aside className="flex flex-col gap-6">
                <WebinarCountrySelector
                  webinars={webinarsList}
                  selectedCountry={selectedCountry}
                  selectedWebinarId={selectedWebinarId}
                  onSelectCountry={(c) => {
                    setSelectedCountry(c);
                    const first = webinarsList.find((w) => w.country === c);
                    setSelectedWebinarId(first?.id ?? null);
                  }}
                  onSelectWebinar={setSelectedWebinarId}
                />
                <div className="border-t border-[var(--wos-border)] pt-4">
                  <WebinarNavSidebar active={navSection} onSelect={setNavSection} />
                </div>
              </aside>

              <div className="flex flex-col gap-5 min-w-0">
                {errorMsg && <div className="rounded-lg border border-outline-error bg-error-container px-4 py-3 text-sm text-error">{errorMsg}</div>}
                {webinarDetailError && <div className="rounded-lg border border-outline-error bg-error-container px-4 py-3 text-sm text-error">{webinarDetailError}</div>}
                {webinarDetailLoading && <p className="text-sm text-[var(--wos-ink-muted)]">Cargando datos del webinar…</p>}

                {webinarDetail &&
                  !webinarDetailLoading &&
                  (() => {
                    const metrics: WebinarMetrics = webinarDetail.metrics ?? EMPTY_METRICS;
                    const real = { totalLeads: kpis.totalLeads, totalIngresos: kpis.totalIngresos, totalCompras };

                    if (navSection === "resumen") {
                      return (
                        <>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h2 className="font-display text-lg text-[var(--wos-ink)] font-semibold">{webinarDetail.webinar.label}</h2>
                              <p className="text-sm text-[var(--wos-ink-muted)]">
                                {countryFlagEmoji(webinarDetail.webinar.country)} {webinarDetail.webinar.country} · {formatDate(webinarDetail.webinar.webinar_date)} · Estado del webinar en 10 KPI
                              </p>
                            </div>
                            <PdfReportButton detail={{ ...webinarDetail, metrics }} />
                          </div>

                          <ExecutiveSummaryKpis metrics={metrics} real={real} />

                          <ExecutiveFunnel metrics={metrics} real={{ totalLeads: real.totalLeads, totalCompras: real.totalCompras }} />

                          <MetaAdsSection entries={webinarDetail.meta_ads} />
                        </>
                      );
                    }

                    return renderModuleContent(navSection, metrics, real);
                  })()}
              </div>
            </div>
          )}
        </div>
      ) : isVsl ? (
        <div className="webinar-os-scope -mx-4 px-4 md:-mx-8 md:px-8 py-6 flex flex-col gap-5" data-wos-theme={mode}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-end gap-3 flex-wrap">
              <VslSelector vslCampaigns={vslCampaigns} selectedId={vslAngleId} onSelect={setVslAngleId} />
              <div className="flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-[0.1em] text-[var(--wos-ink-faint)]">Periodo</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="bg-[var(--wos-surface)] border border-[var(--wos-border)] rounded-md px-2 py-1.5 text-xs text-[var(--wos-ink)] outline-none focus:border-[var(--wos-primary)]"
                  />
                  <span className="text-[var(--wos-ink-faint)] text-xs">—</span>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="bg-[var(--wos-surface)] border border-[var(--wos-border)] rounded-md px-2 py-1.5 text-xs text-[var(--wos-ink)] outline-none focus:border-[var(--wos-primary)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {vslCampaigns.length === 0 ? (
            <p className="text-sm text-[var(--wos-ink-muted)]">Este cliente todavía no tiene campañas VSL registradas.</p>
          ) : (
            <>
              <div>
                <h2 className="font-display text-lg text-[var(--wos-ink)] font-semibold">
                  {vslAngleId === "all" ? "Vista consolidada de VSL" : vslCampaigns.find((c) => c.id === vslAngleId)?.name}
                </h2>
                <p className="text-sm text-[var(--wos-ink-muted)]">
                  Indicador principal: depósito real en HFM. Registros y depósitos vienen de datos reales; el resto se muestra "—" hasta tener tracking de
                  inversión, clics a la oferta y reproducción del VSL.
                </p>
              </div>

              {vslLoading && <p className="text-sm text-[var(--wos-ink-muted)]">Cargando…</p>}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <VslKpiCard label="Inversión" value="—" note="Sin tracking de inversión" />
                <VslKpiCard label="Registros" value={String(vslKpis.registros)} tone="up" note="Formulario" />
                <VslKpiCard label="Depósitos" value={String(vslKpis.depositos)} tone="up" note="Cuenta abierta en HFM" />
                <VslKpiCard label="Capital depositado" value={formatMoney(vslKpis.capitalDepositado)} tone="up" note="Suma real" />
                <VslKpiCard
                  label="Ticket promedio"
                  value={vslKpis.ticketPromedioDepositado != null ? formatMoney(vslKpis.ticketPromedioDepositado) : "—"}
                  note="Por depositante"
                />
                <VslKpiCard
                  label="Conv. registro → depósito"
                  value={vslKpis.conversionRegistroDeposito != null ? formatPercent(vslKpis.conversionRegistroDeposito) : "—"}
                  note="Real"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="rounded-xl border border-[var(--wos-border)] bg-[var(--wos-surface)] shadow-[var(--wos-shadow)] p-5">
                  <h3 className="text-base font-semibold text-[var(--wos-ink)] mb-1">Evolución diaria: registros vs. depósitos</h3>
                  <p className="text-xs text-[var(--wos-ink-muted)] mb-4">
                    Compara registros del formulario con el capital depositado en HFM cada día (datos reales).
                  </p>
                  <VslDailyChart rows={vslDailyRows} />
                </div>
                <div className="rounded-xl border border-[var(--wos-border)] bg-[var(--wos-surface)] shadow-[var(--wos-shadow)] p-5">
                  <h3 className="text-base font-semibold text-[var(--wos-ink)] mb-1">Embudo de intención</h3>
                  <p className="text-xs text-[var(--wos-ink-muted)] mb-4">La última acción es el clic para abrir cuenta en HFM.</p>
                  <VslFunnel stages={vslFunnelStages} />
                </div>
              </div>

              <div className="rounded-xl border border-[var(--wos-border)] bg-[var(--wos-surface)] shadow-[var(--wos-shadow)] p-5">
                <h3 className="text-base font-semibold text-[var(--wos-ink)] mb-1">Desempeño diario detallado</h3>
                <p className="text-xs text-[var(--wos-ink-muted)] mb-4">Lectura completa desde el registro hasta el depósito realizado en HFM.</p>
                <VslDailyTable rows={vslDailyRows} />
              </div>
            </>
          )}
        </div>
      ) : isEventoPresencial ? (
        <div className="webinar-os-scope -mx-4 px-4 md:-mx-8 md:px-8 py-6 flex flex-col gap-5" data-wos-theme={mode}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-end gap-3 flex-wrap">
              <EventoSelector eventoCampaigns={eventoCampaigns} selectedId={eventoAngleId} onSelect={setEventoAngleId} />
              <div className="flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-[0.1em] text-[var(--wos-ink-faint)]">Periodo</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="bg-[var(--wos-surface)] border border-[var(--wos-border)] rounded-md px-2 py-1.5 text-xs text-[var(--wos-ink)] outline-none focus:border-[var(--wos-primary)]"
                  />
                  <span className="text-[var(--wos-ink-faint)] text-xs">—</span>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="bg-[var(--wos-surface)] border border-[var(--wos-border)] rounded-md px-2 py-1.5 text-xs text-[var(--wos-ink)] outline-none focus:border-[var(--wos-primary)]"
                  />
                </div>
              </div>
            </div>
            <a
              href="/checkin"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-[var(--wos-primary)] border border-[var(--wos-border)] rounded-md px-3 py-2 hover:bg-[var(--wos-surface-alt)]"
            >
              Abrir pantalla de check-in →
            </a>
          </div>

          {eventoCampaigns.length === 0 ? (
            <p className="text-sm text-[var(--wos-ink-muted)]">Este cliente todavía no tiene campañas de evento presencial registradas.</p>
          ) : (
            <>
              <div>
                <h2 className="font-display text-lg text-[var(--wos-ink)] font-semibold">
                  {eventoAngleId === "all" ? "Vista consolidada del evento" : eventoCampaigns.find((c) => c.id === eventoAngleId)?.name}
                </h2>
                <p className="text-sm text-[var(--wos-ink-muted)]">
                  Registro (acceso General), check-in del día del evento y ventas de Platinum/VIP — todo con datos reales.
                </p>
              </div>

              {eventoLoading && <p className="text-sm text-[var(--wos-ink-muted)]">Cargando…</p>}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <VslKpiCard label="Registros" value={String(eventoKpis.registros)} tone="up" note="Preregistro" />
                <VslKpiCard
                  label="Se unió a WP"
                  value={String(eventoKpis.llegaronWp)}
                  tone="up"
                  note={eventoKpis.conversionWp != null ? `${formatPercent(eventoKpis.conversionWp)} de conversión` : "Sin registros"}
                />
                <VslKpiCard
                  label="Confirmados"
                  value={String(eventoKpis.confirmados)}
                  tone="up"
                  note={eventoKpis.conversionConfirmado != null ? `${formatPercent(eventoKpis.conversionConfirmado)} de conversión` : "Gratis + Platinum + VIP"}
                />
                <VslKpiCard
                  label="Check-in"
                  value={String(eventoKpis.checkins)}
                  tone="up"
                  note={eventoKpis.conversionCheckin != null ? `${formatPercent(eventoKpis.conversionCheckin)} de asistencia` : "Sin registros"}
                />
                <VslKpiCard label="Capital vendido" value={formatMoney(eventoKpis.capitalVendido)} tone="up" note="Suma real" />
              </div>

              {eventoTiers.length > 0 && (
                <div className="rounded-xl border border-[var(--wos-border)] bg-[var(--wos-surface)] shadow-[var(--wos-shadow)] p-5">
                  <h3 className="text-base font-semibold text-[var(--wos-ink)] mb-1">Desglose de confirmados</h3>
                  <p className="text-xs text-[var(--wos-ink-muted)] mb-4">Cuántos confirmaron gratis vs. compraron Platinum/VIP — total real del evento.</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                    {eventoTiers.map((t) => (
                      <VslKpiCard
                        key={t.tier}
                        label={t.tier === "Platino" ? "Platinum" : t.tier === "Confirmado" ? "Gratuita" : t.tier}
                        value={String(t.total)}
                        tone="up"
                        note={Number(t.ingresos) > 0 ? formatMoney(Number(t.ingresos)) : "Acceso gratuito"}
                      />
                    ))}
                  </div>
                  <EventoTierPieChart tiers={eventoTiers} />
                </div>
              )}

              <div className="rounded-xl border border-[var(--wos-border)] bg-[var(--wos-surface)] shadow-[var(--wos-shadow)] p-5">
                <h3 className="text-base font-semibold text-[var(--wos-ink)] mb-1">Comparación por ángulo</h3>
                <p className="text-xs text-[var(--wos-ink-muted)] mb-4">Qué landing está trayendo más registros y convirtiendo mejor a venta.</p>
                <EventoAngleTable stats={eventoAngleStats} adSpend={eventoAdSpend} />
              </div>

              <div className="rounded-xl border border-[var(--wos-border)] bg-[var(--wos-surface)] shadow-[var(--wos-shadow)] p-5">
                <h3 className="text-base font-semibold text-[var(--wos-ink)] mb-1">Leads por temperatura</h3>
                <p className="text-xs text-[var(--wos-ink-muted)] mb-4">Tibio = redes propias de los expertos (orgánico). Frío = pauta paga.</p>
                <EventoTemperaturaChart rows={eventoTemperaturaStats} />
              </div>

              <div className="rounded-xl border border-[var(--wos-border)] bg-[var(--wos-surface)] shadow-[var(--wos-shadow)] p-5">
                <h3 className="text-base font-semibold text-[var(--wos-ink)] mb-1">Gasto de pauta consolidado</h3>
                <p className="text-xs text-[var(--wos-ink-muted)] mb-4">Leads pagos vs. orgánicos por día, con CPL — total combinado de las campañas con pauta activa.</p>
                <EventoDailyTraficoChart rows={eventoDailyTrafico} />
                <div className="mt-5">
                  <EventoAdSpendConsolidatedTable rows={eventoAdSpendConsolidated} />
                </div>
              </div>

              <div className="rounded-xl border border-[var(--wos-border)] bg-[var(--wos-surface)] shadow-[var(--wos-shadow)] p-5">
                <h3 className="text-base font-semibold text-[var(--wos-ink)] mb-1">Gasto de pauta día a día por ángulo</h3>
                <p className="text-xs text-[var(--wos-ink-muted)] mb-4">Desglose diario por ángulo — solo las campañas con pauta activa.</p>
                <EventoAdSpendDailyTable rows={eventoAdSpend} />
              </div>

              <div className="rounded-xl border border-[var(--wos-border)] bg-[var(--wos-surface)] shadow-[var(--wos-shadow)] p-5">
                <h3 className="text-base font-semibold text-[var(--wos-ink)] mb-1">Rendimiento por conjunto de anuncios y anuncio</h3>
                <p className="text-xs text-[var(--wos-ink-muted)] mb-4">Desglose por conjunto de anuncios y anuncio individual para ver cuál convierte mejor.</p>
                <EventoAdPerformanceTable rows={eventoAdPerformance} />
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {errorMsg && <div className="rounded-lg border border-outline-error bg-error-container px-4 py-3 text-sm text-error">{errorMsg}</div>}

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
            onRefresh={() => effectiveCampaignId && selectedClient && loadFunnel(effectiveCampaignId, selectedClient.id, effectivePais)}
            loading={loading}
            source={source}
          />

          <KpiCards totalLeads={kpis.totalLeads} totalIngresos={kpis.totalIngresos} conversionGlobal={kpis.conversionGlobal} ticketPromedio={kpis.ticketPromedio} />

          <LaunchFunnel stages={stages} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <CountryBarChart data={countryData} />
            <SourceTable data={sourceData} />
          </div>

          <footer className="text-center text-[11px] text-on-surface-faint font-mono py-4">
            {loading ? "Cargando…" : source === "n8n" ? `Datos en vivo — campaña #${selectedCampaignId}` : "Selecciona una campaña"}
          </footer>
        </>
      )}
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <Home />
    </Suspense>
  );
}
