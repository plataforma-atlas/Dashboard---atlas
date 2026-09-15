"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useThemeMode } from "@/components/ThemeModeProvider";
import ThemeModeToggle from "@/components/ThemeModeToggle";
import SidebarCollapseButton from "@/components/SidebarCollapseButton";
import { useSidebarCollapse } from "@/components/useSidebarCollapse";
import { themeForClient } from "@/lib/clients";
import { Campaign } from "@/lib/types";
import { CampanaCartera } from "@/lib/webinar-os/control-center/types";
import { aggregateCampanas, pickRecomendaciones, pickBalance } from "@/lib/webinar-os/control-center/insights";
import { rangoRapido } from "@/lib/webinar-os/control-center/dateRanges";
import { formatMoney, formatDecimal, formatNumber, formatPercent } from "@/lib/webinar-os/aggregate";
import KpiCard from "@/components/webinar-os/KpiCard";
import RankingTable from "@/components/webinar-os/control-center/RankingTable";
import WccAccordion from "@/components/webinar-os/control-center/WccAccordion";
import WccSidebarNav from "@/components/webinar-os/control-center/WccSidebarNav";
import FunnelSteps from "@/components/webinar-os/control-center/FunnelSteps";
import WccFilterBar from "@/components/webinar-os/control-center/WccFilterBar";
import { WebinarSummary, WebinarDetail } from "@/lib/webinar-os/types";

export default function ControlCenterPage() {
  const params = useParams<{ clienteId: string }>();
  const clienteId = params.clienteId;
  const router = useRouter();
  const { mode, toggleMode, setActiveTheme } = useThemeMode();

  const [isAdmin, setIsAdmin] = useState(false);
  const [clienteName, setClienteName] = useState(clienteId);
  const [todosLosClientes, setTodosLosClientes] = useState<{ id: string; name: string }[]>([]);
  const [selectorClienteAbierto, setSelectorClienteAbierto] = useState(false);
  const { collapsed: sidebarCollapsed, toggleCollapsed: toggleSidebarCollapsed } = useSidebarCollapse();
  const [campanas, setCampanas] = useState<CampanaCartera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campanaSeleccionada, setCampanaSeleccionada] = useState<string>("all");
  const [otrasCampanas, setOtrasCampanas] = useState<Campaign[]>([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [webinarsList, setWebinarsList] = useState<WebinarSummary[]>([]);
  const [webinarSeleccionado, setWebinarSeleccionado] = useState<string>("");
  const [webinarDetalle, setWebinarDetalle] = useState<WebinarDetail | null>(null);
  const [webinarDetalleLoading, setWebinarDetalleLoading] = useState(false);

  useEffect(() => {
    setActiveTheme(themeForClient(clienteId));
  }, [clienteId, setActiveTheme]);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setIsAdmin(data?.role === "admin"))
      .catch(() => setIsAdmin(false));
  }, []);

  // Campañas de OTRAS estrategias (VSL, Evento presencial, Lanzamiento) de
  // este cliente — el Control Center solo sabe mostrar Webinar Automático,
  // así que estas se ofrecen en el mismo selector pero eligiendo una te
  // manda al dashboard clásico (único lugar que sabe renderizarlas).
  useEffect(() => {
    fetch(`/api/campanas?cliente_id=${clienteId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const list: Campaign[] = data.campanas ?? [];
        setOtrasCampanas(list.filter((c) => c.strategy_type !== "webinar_automatizado"));
      })
      .catch(() => setOtrasCampanas([]));
  }, [clienteId]);

  function handleCampanaChange(v: string) {
    if (v.startsWith("otra:")) {
      const campaignId = v.slice("otra:".length);
      router.push(`/?vista=clasica&campaign_id=${campaignId}`);
      return;
    }
    setCampanaSeleccionada(v);
  }

  useEffect(() => {
    fetch("/api/clientes", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const list: { id: string; name: string }[] = data.clientes ?? [];
        setTodosLosClientes(list);
        const match = list.find((c) => c.id === clienteId);
        if (match) setClienteName(match.name);
      })
      .catch(() => {});
  }, [clienteId]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function cargar(fiOverride?: string, ffOverride?: string) {
    setLoading(true);
    setError(null);
    const fi = fiOverride ?? fechaInicio;
    const ff = ffOverride ?? fechaFin;
    const qs = new URLSearchParams({ cliente_id: clienteId });
    if (fi) qs.set("fecha_inicio", fi);
    if (ff) qs.set("fecha_fin", ff);
    fetch(`/api/webinar-os/cartera-por-campana?${qs.toString()}`, { cache: "no-store" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setError(data.error || "No se pudo cargar la información");
          return;
        }
        setCampanas(data.campanas ?? []);
      })
      .catch(() => setError("No se pudo conectar al servidor"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const { fecha_inicio, fecha_fin } = rangoRapido("4weeks");
    setFechaInicio(fecha_inicio);
    setFechaFin(fecha_fin);
    cargar(fecha_inicio, fecha_fin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  useEffect(() => {
    fetch(`/api/webinar-os/webinars?cliente_id=${clienteId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const list: WebinarSummary[] = data.webinars ?? [];
        setWebinarsList(list);
        if (list.length > 0) setWebinarSeleccionado(String(list[0].id));
      })
      .catch(() => setWebinarsList([]));
  }, [clienteId]);

  useEffect(() => {
    if (!webinarSeleccionado) return;
    setWebinarDetalleLoading(true);
    fetch(`/api/webinar-os/webinar-detalle?webinar_id=${webinarSeleccionado}&cliente_id=${clienteId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setWebinarDetalle(data.webinar ? data : null))
      .catch(() => setWebinarDetalle(null))
      .finally(() => setWebinarDetalleLoading(false));
  }, [webinarSeleccionado, clienteId]);

  const isAll = campanaSeleccionada === "all";
  const campanaActiva = isAll ? null : campanas.find((c) => String(c.campaign_id) === campanaSeleccionada) ?? null;
  const resumen = useMemo(() => {
    if (isAll) return aggregateCampanas(campanas);
    if (!campanaActiva) return aggregateCampanas(campanas);
    return {
      facturacion_bruta: campanaActiva.facturacion_bruta,
      facturacion_neta: campanaActiva.facturacion_neta,
      inversion: campanaActiva.inversion,
      ventas: campanaActiva.ventas,
      registros: campanaActiva.registros,
      roas_bruto: campanaActiva.roas_bruto,
      roas_neto: campanaActiva.roas_neto,
      registro_a_venta: campanaActiva.registro_a_venta,
      ticket_promedio: campanaActiva.ticket_promedio,
      cac: campanaActiva.cac,
    };
  }, [isAll, campanaActiva, campanas]);

  const recomendaciones = useMemo(() => pickRecomendaciones(campanas), [campanas]);
  const balance = useMemo(() => pickBalance(campanas), [campanas]);

  return (
    <div className="webinar-os-scope wcc-page min-h-screen flex flex-col md:flex-row" data-wos-theme={mode}>
      <aside className="wcc-no-print bg-[#111218] md:w-[var(--sidebar-w,240px)] md:fixed md:inset-y-0 md:left-0 md:h-screen p-4 md:p-5 flex flex-col gap-4 overflow-y-auto transition-[width] duration-200">
        <div className="relative pb-4 border-b border-white/10">
          <div className={`flex ${sidebarCollapsed ? "flex-col items-center gap-2" : "items-center gap-2"}`}>
            <button
              onClick={() => setSelectorClienteAbierto((v) => !v)}
              disabled={sidebarCollapsed}
              className={`flex items-center gap-2.5 rounded-lg hover:bg-white/5 transition p-1 -m-1 disabled:hover:bg-transparent min-w-0 ${
                sidebarCollapsed ? "" : "flex-1"
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--wos-primary)] to-[var(--wos-primary)]/70 grid place-items-center text-sm font-bold text-[var(--wos-on-primary)] shrink-0">
                {clienteName.charAt(0).toUpperCase()}
              </div>
              {!sidebarCollapsed && (
                <>
                  <div className="min-w-0 text-left flex-1">
                    <div className="text-[13px] font-semibold text-white truncate">{clienteName}</div>
                    <div className="text-[10px] text-white/50">Webinar Control Center</div>
                  </div>
                  {todosLosClientes.length > 1 && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`text-white/40 shrink-0 transition-transform ${selectorClienteAbierto ? "rotate-180" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  )}
                </>
              )}
            </button>
            <SidebarCollapseButton collapsed={sidebarCollapsed} onToggle={toggleSidebarCollapsed} />
          </div>

          {!sidebarCollapsed && selectorClienteAbierto && todosLosClientes.length > 1 && (
            <div className="mt-2 flex flex-col gap-0.5 max-h-64 overflow-y-auto">
              {todosLosClientes
                .filter((c) => c.id !== clienteId)
                .map((c) => (
                  <a
                    key={c.id}
                    href={`/?cliente_id=${c.id}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] text-white/60 hover:text-white hover:bg-white/5 transition"
                  >
                    <span className="w-5 h-5 rounded-md bg-white/10 grid place-items-center text-[10px] font-semibold shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate">{c.name}</span>
                  </a>
                ))}
            </div>
          )}
        </div>

        <WccSidebarNav collapsed={sidebarCollapsed} />

        <div className="flex flex-col gap-1.5 pt-4 border-t border-white/10">
          <a
            href="/?vista=clasica"
            title="Dashboard clásico"
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] whitespace-nowrap text-white/60 hover:text-white hover:bg-white/5 transition ${sidebarCollapsed ? "justify-center" : ""}`}
          >
            <span className="w-6 h-6 rounded-lg bg-white/10 grid place-items-center text-[11px] shrink-0">▦</span>
            {!sidebarCollapsed && <span>Dashboard clásico</span>}
          </a>
          {isAdmin && (
            <>
              <a
                href="/admin/cartera"
                title="Cartera"
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] whitespace-nowrap text-white/60 hover:text-white hover:bg-white/5 transition ${sidebarCollapsed ? "justify-center" : ""}`}
              >
                <span className="w-6 h-6 rounded-lg bg-white/10 grid place-items-center text-[11px] shrink-0">←</span>
                {!sidebarCollapsed && <span>Cartera</span>}
              </a>
              <a
                href="/admin/clientes"
                title="Clientes"
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] whitespace-nowrap text-white/60 hover:text-white hover:bg-white/5 transition ${sidebarCollapsed ? "justify-center" : ""}`}
              >
                <span className="w-6 h-6 rounded-lg bg-white/10 grid place-items-center text-[11px] shrink-0">◎</span>
                {!sidebarCollapsed && <span>Clientes</span>}
              </a>
              <a
                href="/admin/usuarios"
                title="Usuarios"
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] whitespace-nowrap text-white/60 hover:text-white hover:bg-white/5 transition ${sidebarCollapsed ? "justify-center" : ""}`}
              >
                <span className="w-6 h-6 rounded-lg bg-white/10 grid place-items-center text-[11px] shrink-0">◈</span>
                {!sidebarCollapsed && <span>Usuarios</span>}
              </a>
            </>
          )}
        </div>

        <div className={`mt-auto pt-4 border-t border-white/10 flex items-center ${sidebarCollapsed ? "flex-col gap-2" : "justify-between"}`}>
          {isAdmin && !sidebarCollapsed ? <ThemeModeToggle mode={mode} onToggle={toggleMode} /> : <span />}
          <button
            onClick={handleLogout}
            title="Salir"
            aria-label="Salir"
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/15 grid place-items-center text-white/70 hover:text-white transition shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 md:ml-[var(--sidebar-w,240px)] p-4 md:p-8 flex flex-col gap-6 bg-[var(--wcc-page-bg)] transition-[margin] duration-200">
        <div className="hidden print:block mb-2">
          <div className="text-lg font-bold text-[var(--wos-ink)]">{clienteName} · Webinar Control Center</div>
          <div className="text-xs text-[var(--wos-ink-muted)]">
            {new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--wos-primary)]">Dashboard semanal</div>
            <h1 className="font-display text-2xl md:text-[28px] text-[var(--wos-ink)] font-semibold mt-1">
              {isAll ? "Centro de control del negocio" : campanaActiva?.campaign_name ?? "Centro de control"}
            </h1>
            <p className="text-sm text-[var(--wos-ink-muted)] mt-1">
              {isAll ? "Vista consolidada de todas las campañas activas." : "Resultados de la campaña seleccionada."}
            </p>
            <div className="wcc-no-print flex gap-2 flex-wrap mt-2.5">
              <span className="text-[11px] text-[var(--wos-ink-muted)] bg-[var(--wos-surface)] border border-[var(--wos-border)] rounded-full px-2.5 py-1">
                {isAll ? "Todas las campañas" : campanaActiva?.campaign_name}
              </span>
              {fechaInicio && fechaFin && (
                <span className="text-[11px] text-[var(--wos-ink-muted)] bg-[var(--wos-surface)] border border-[var(--wos-border)] rounded-full px-2.5 py-1">
                  Periodo: {fechaInicio} – {fechaFin}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <WccFilterBar
              campanas={campanas}
              otrasCampanas={otrasCampanas}
              campanaSeleccionada={campanaSeleccionada}
              onCampanaChange={handleCampanaChange}
              onAplicar={(fi, ff) => {
                setFechaInicio(fi);
                setFechaFin(ff);
                cargar(fi, ff);
              }}
            />
          </div>
        </div>

        {error && <div className="rounded-lg border border-outline-error bg-error-container px-4 py-3 text-sm text-error">{error}</div>}

        {loading ? (
          <p className="text-sm text-[var(--wos-ink-faint)]">Cargando…</p>
        ) : (
          <>
            <section id="resumen" className="scroll-mt-6 flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[var(--wos-ink)]">1. Lo más importante para el infoproductor</h2>
                <p className="text-xs text-[var(--wos-ink-muted)] mt-1">Negocio primero: facturación, ventas, inversión y retorno.</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard label="Facturación bruta" value={formatMoney(resumen.facturacion_bruta)} meta="ventas confirmadas" />
                <KpiCard label="Ventas totales" value={formatNumber(resumen.ventas)} meta="compras confirmadas" />
                <KpiCard label="Inversión publicitaria" value={formatMoney(resumen.inversion)} meta={isAll ? `${campanas.length} campañas activas` : "periodo seleccionado"} />
                <KpiCard label="ROAS bruto" value={resumen.roas_bruto !== null ? `${formatDecimal(resumen.roas_bruto)}x` : "—"} meta="retorno publicitario" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard label="Facturación neta" value={formatMoney(resumen.facturacion_neta)} meta="ingreso neto estimado" />
                <KpiCard label="ROAS neto" value={resumen.roas_neto !== null ? `${formatDecimal(resumen.roas_neto)}x` : "—"} meta="retorno real estimado" />
                <KpiCard label="Registro → venta" value={formatPercent(resumen.registro_a_venta ?? undefined)} meta="conversión global" />
                <KpiCard label="Asistentes" value="—" meta="sin fuente de datos conectada" />
              </div>

              {isAll && (
                <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_.75fr] gap-4">
                  <div className="rounded-2xl border border-[var(--wos-border)] bg-[var(--wos-surface)] p-4">
                    <h3 className="text-base font-semibold text-[var(--wos-ink)] mb-1">Ranking de campañas</h3>
                    <p className="text-xs text-[var(--wos-ink-muted)] mb-3">Qué campaña genera más resultado y cuál necesita atención.</p>
                    <RankingTable campanas={campanas} />
                  </div>
                  <div className="rounded-2xl border border-[var(--wos-border)] bg-[var(--wos-surface)] p-4">
                    <h3 className="text-base font-semibold text-[var(--wos-ink)] mb-1">Qué deberías mirar hoy</h3>
                    <p className="text-xs text-[var(--wos-ink-muted)] mb-3">Recomendaciones basadas en los datos reales del periodo.</p>
                    {recomendaciones.length > 0 ? (
                      <WccAccordion
                        items={recomendaciones.map((r, i) => ({
                          index: String(i + 1),
                          title: r.titulo,
                          metric: r.metrica,
                          body: r.cuerpo,
                          defaultOpen: i === 0,
                        }))}
                      />
                    ) : (
                      <p className="text-xs text-[var(--wos-ink-faint)]">
                        Aún no hay suficientes datos de inversión o ventas para generar recomendaciones automáticas.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {isAll && (balance.bien.length > 0 || balance.atencion.length > 0) && (
                <div className="rounded-2xl border border-[var(--wos-border)] bg-[var(--wos-surface)] p-4">
                  <h3 className="text-base font-semibold text-[var(--wos-ink)] mb-1">Balance general del portafolio</h3>
                  <p className="text-xs text-[var(--wos-ink-muted)] mb-3">
                    Antes de entrar al detalle: qué está funcionando y qué requiere atención.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-[13px] font-semibold text-[var(--wos-ink)] mb-2">Funcionando bien</h4>
                      {balance.bien.length > 0 ? (
                        <WccAccordion items={balance.bien.map((b, i) => ({ index: "✓", title: b.titulo, metric: b.metrica, body: b.cuerpo, defaultOpen: i === 0 }))} />
                      ) : (
                        <p className="text-xs text-[var(--wos-ink-faint)]">Sin datos suficientes todavía.</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-[13px] font-semibold text-[var(--wos-ink)] mb-2">Atención inmediata</h4>
                      {balance.atencion.length > 0 ? (
                        <WccAccordion items={balance.atencion.map((b, i) => ({ index: "!", title: b.titulo, metric: b.metrica, body: b.cuerpo, defaultOpen: i === 0 }))} />
                      ) : (
                        <p className="text-xs text-[var(--wos-ink-faint)]">Nada requiere atención inmediata en este periodo.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section id="comercial" className="scroll-mt-6 flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[var(--wos-ink)]">2. Resultados comerciales</h2>
                <p className="text-xs text-[var(--wos-ink-muted)] mt-1">Resultado bruto y resultado real disponible para el negocio.</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <KpiCard label="Facturación bruta" value={formatMoney(resumen.facturacion_bruta)} meta="ventas confirmadas" />
                <KpiCard label="Facturación neta" value={formatMoney(resumen.facturacion_neta)} meta="ingreso neto estimado" />
                <KpiCard label="ROAS bruto" value={resumen.roas_bruto !== null ? `${formatDecimal(resumen.roas_bruto)}x` : "—"} meta="sobre facturación bruta" />
                <KpiCard label="ROAS neto" value={resumen.roas_neto !== null ? `${formatDecimal(resumen.roas_neto)}x` : "—"} meta="retorno real estimado" />
                <KpiCard label="Ventas" value={formatNumber(resumen.ventas)} meta="compras confirmadas" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <KpiCard label="Ticket promedio" value={resumen.ticket_promedio !== null ? formatMoney(resumen.ticket_promedio) : "—"} meta="facturación bruta / ventas" />
                <KpiCard label="CAC" value={resumen.cac !== null ? formatMoney(resumen.cac) : "—"} meta="inversión / venta" />
                <KpiCard label="Registro → venta" value={formatPercent(resumen.registro_a_venta ?? undefined)} meta="conversión comercial" />
              </div>
            </section>

            <section id="chat" className="scroll-mt-6 flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[var(--wos-ink)]">3. Ventas por chat 1 a 1</h2>
                <p className="text-xs text-[var(--wos-ink-muted)] mt-1">Mide el impacto del equipo que conversa directamente con prospectos.</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <KpiCard label="Conversaciones 1 a 1" value="—" meta="prospectos iniciados" />
                <KpiCard label="Conversaciones atendidas" value="—" meta="—" />
                <KpiCard label="Ventas por 1 a 1" value="—" meta="—" />
                <KpiCard label="Facturación 1 a 1" value="—" meta="atribuida al equipo" />
                <KpiCard label="Comisiones pagadas" value="—" meta="—" />
              </div>
              <div className="rounded-2xl border border-[var(--wos-border)] bg-[var(--wos-surface)] p-4">
                <WccAccordion
                  items={[
                    {
                      index: "!",
                      title: "Sin fuente de datos conectada",
                      body: "Esta sección todavía no tiene una tabla de captura de conversaciones/ventas 1 a 1 ni de comisiones — se muestra la estructura completa para cuando ese dato exista, en vez de ocultarla.",
                    },
                  ]}
                />
              </div>
            </section>

            <section id="trafico" className="scroll-mt-6 flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[var(--wos-ink)]">4. Tráfico Meta</h2>
                <p className="text-xs text-[var(--wos-ink-muted)] mt-1">Volumen y costo antes de entrar a métricas técnicas.</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard label="Inversión" value={formatMoney(resumen.inversion)} meta="periodo seleccionado" />
                <KpiCard label="Registros" value={formatNumber(resumen.registros)} meta="personas captadas" />
                <KpiCard
                  label="Costo por registro"
                  value={resumen.inversion > 0 && resumen.registros > 0 ? formatMoney(resumen.inversion / resumen.registros) : "—"}
                  meta="inversión / registros"
                />
                <KpiCard label="CTR" value="—" meta="sin datos de Meta Ads sincronizados" />
              </div>
              {resumen.inversion === 0 && (
                <p className="text-xs text-[var(--wos-ink-faint)]">
                  Aún no hay inversión publicitaria cargada para {isAll ? "este cliente" : "esta campaña"} — impresiones, CPM, CPC y frecuencia quedan sin dato hasta que se sincronice Meta Ads.
                </p>
              )}
            </section>

            <section id="embudo" className="scroll-mt-6 flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[var(--wos-ink)]">5. Embudo de conversión</h2>
                <p className="text-xs text-[var(--wos-ink-muted)] mt-1">
                  De registro a venta — el embudo de tráfico pagado (impresiones, clics, landing) requiere datos de Meta Ads que aún no
                  están sincronizados.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--wos-border)] bg-[var(--wos-surface)] p-4">
                <FunnelSteps
                  steps={[
                    { title: "Registros", sub: "Entrada al embudo", value: formatNumber(resumen.registros), rate: "100%" },
                    {
                      title: "Ventas",
                      sub: "Compra confirmada",
                      value: formatNumber(resumen.ventas),
                      rate: formatPercent(resumen.registro_a_venta ?? undefined),
                    },
                  ]}
                />
              </div>
            </section>

            <section id="detalle" className="scroll-mt-6 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--wos-ink)]">6. Detalle del webinar</h2>
                  <p className="text-xs text-[var(--wos-ink-muted)] mt-1">Consumo de la clase, intención de compra y ventas de una edición específica.</p>
                </div>
                {webinarsList.length > 0 && (
                  <select
                    value={webinarSeleccionado}
                    onChange={(e) => setWebinarSeleccionado(e.target.value)}
                    className="border border-[var(--wos-border)] bg-[var(--wos-surface)] text-[var(--wos-ink)] rounded-lg px-3 py-2 text-[13px]"
                  >
                    {webinarsList.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.country} · {w.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {webinarsList.length === 0 ? (
                <p className="text-xs text-[var(--wos-ink-faint)]">Este cliente todavía no tiene ediciones de webinar registradas.</p>
              ) : webinarDetalleLoading ? (
                <p className="text-xs text-[var(--wos-ink-faint)]">Cargando…</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <KpiCard label="Registrados" value={formatNumber(webinarDetalle?.metrics?.webinar?.registrados)} meta="entrada al embudo" />
                    <KpiCard label="Asistentes" value={formatNumber(webinarDetalle?.metrics?.webinar?.asistentes_en_vivo)} meta="sin fuente de datos conectada" />
                    <KpiCard label="Tasa de asistencia" value={formatPercent(webinarDetalle?.metrics?.webinar?.tasa_asistencia)} meta="de registrados" />
                    <KpiCard label="Ventas" value={formatNumber(webinarDetalle?.metrics?.ventas?.ventas)} meta="de esta edición" />
                  </div>
                  {!webinarDetalle?.metrics ? (
                    <p className="text-xs text-[var(--wos-ink-faint)]">
                      Sin datos operativos cargados todavía para esta edición (registro, asistencia, oferta y ventas por webinar).
                    </p>
                  ) : (
                    <div className="rounded-2xl border border-[var(--wos-border)] bg-[var(--wos-surface)] p-4">
                      <FunnelSteps
                        steps={[
                          { title: "Registrados", sub: "Entrada", value: formatNumber(webinarDetalle.metrics.webinar?.registrados), rate: "100%" },
                          {
                            title: "Asistentes",
                            sub: "Entraron a la clase",
                            value: formatNumber(webinarDetalle.metrics.webinar?.asistentes_en_vivo),
                            rate: formatPercent(webinarDetalle.metrics.webinar?.tasa_asistencia),
                          },
                          {
                            title: "Clic en oferta",
                            sub: "Intención de compra",
                            value: formatNumber(webinarDetalle.metrics.oferta?.clics_oferta),
                            rate: "—",
                          },
                          {
                            title: "Ventas",
                            sub: "Compra confirmada",
                            value: formatNumber(webinarDetalle.metrics.ventas?.ventas),
                            rate: "—",
                          },
                        ]}
                      />
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
