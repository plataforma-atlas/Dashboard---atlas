"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useThemeMode } from "@/components/ThemeModeProvider";
import ThemeModeToggle from "@/components/ThemeModeToggle";
import { themeForClient } from "@/lib/clients";
import { CampanaCartera } from "@/lib/webinar-os/control-center/types";
import { aggregateCampanas, pickRecomendaciones, pickBalance } from "@/lib/webinar-os/control-center/insights";
import { formatMoney, formatDecimal, formatNumber, formatPercent } from "@/lib/webinar-os/aggregate";
import KpiCard from "@/components/webinar-os/KpiCard";
import RankingTable from "@/components/webinar-os/control-center/RankingTable";
import WccAccordion from "@/components/webinar-os/control-center/WccAccordion";
import WccSidebarNav from "@/components/webinar-os/control-center/WccSidebarNav";
import FunnelSteps from "@/components/webinar-os/control-center/FunnelSteps";
import { WebinarSummary, WebinarDetail } from "@/lib/webinar-os/types";

export default function ControlCenterPage() {
  const params = useParams<{ clienteId: string }>();
  const clienteId = params.clienteId;
  const router = useRouter();
  const { mode, toggleMode, setActiveTheme } = useThemeMode();

  const [clienteName, setClienteName] = useState(clienteId);
  const [campanas, setCampanas] = useState<CampanaCartera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campanaSeleccionada, setCampanaSeleccionada] = useState<string>("all");
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
    fetch("/api/clientes", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const list: { id: string; name: string }[] = data.clientes ?? [];
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

  function cargar() {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams({ cliente_id: clienteId });
    if (fechaInicio) qs.set("fecha_inicio", fechaInicio);
    if (fechaFin) qs.set("fecha_fin", fechaFin);
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
    cargar();
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
      <aside className="bg-[#111218] md:w-[240px] md:min-h-screen md:sticky md:top-0 p-4 md:p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--wos-primary)] to-[var(--wos-primary)]/70 grid place-items-center text-sm font-bold text-[var(--wos-on-primary)]">
            {clienteName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-white truncate">{clienteName}</div>
            <div className="text-[10px] text-white/50">Webinar Control Center</div>
          </div>
        </div>
        <WccSidebarNav />
      </aside>

      <main className="flex-1 min-w-0 p-4 md:p-8 flex flex-col gap-6 bg-[var(--wcc-page-bg)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--wos-primary)]">Dashboard semanal</div>
            <h1 className="font-display text-2xl md:text-[28px] text-[var(--wos-ink)] font-semibold mt-1">
              {isAll ? "Centro de control del negocio" : campanaActiva?.campaign_name ?? "Centro de control"}
            </h1>
            <p className="text-sm text-[var(--wos-ink-muted)] mt-1">
              {isAll ? "Vista consolidada de todas las campañas activas." : "Resultados de la campaña seleccionada."}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={campanaSeleccionada}
              onChange={(e) => setCampanaSeleccionada(e.target.value)}
              className="border border-[var(--wos-border)] bg-[var(--wos-surface)] text-[var(--wos-ink)] rounded-lg px-3 py-2 text-[13px]"
            >
              <option value="all">Todas las campañas</option>
              {campanas.map((c) => (
                <option key={c.campaign_id} value={c.campaign_id}>
                  {c.campaign_name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="border border-[var(--wos-border)] bg-[var(--wos-surface)] text-[var(--wos-ink)] rounded-lg px-3 py-2 text-[13px]"
            />
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="border border-[var(--wos-border)] bg-[var(--wos-surface)] text-[var(--wos-ink)] rounded-lg px-3 py-2 text-[13px]"
            />
            <button
              onClick={cargar}
              className="border border-[var(--wos-border)] bg-[var(--wos-surface)] text-[var(--wos-ink)] rounded-lg px-3 py-2 text-[13px] hover:bg-[var(--wos-surface-alt)]"
            >
              Aplicar
            </button>
            <ThemeModeToggle mode={mode} onToggle={toggleMode} />
            <a href="/admin/cartera" className="text-xs text-[var(--wos-ink-muted)] hover:text-[var(--wos-ink)] border border-[var(--wos-border)] rounded-full px-3 py-1.5 transition">
              ← Cartera
            </a>
            <button onClick={handleLogout} className="text-xs text-[var(--wos-ink-muted)] hover:text-[var(--wos-ink)] border border-[var(--wos-border)] rounded-full px-3 py-1.5 transition">
              Salir
            </button>
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
