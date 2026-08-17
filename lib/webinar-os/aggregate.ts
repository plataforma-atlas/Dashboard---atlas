import { EXECUTIVE_FUNNEL_STAGES, EXECUTIVE_SUMMARY_KPIS, ModuleFieldConfig } from "./moduleConfigs";
import { MetaAdsEntry, WebinarMetrics } from "./types";

export function formatMoney(n: number | undefined): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function formatNumber(n: number | undefined): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return n.toLocaleString("es-CO");
}

export function formatPercent(n: number | undefined): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return `${n.toFixed(1)}%`;
}

export function formatDecimal(n: number | undefined): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return n.toFixed(2);
}

export function formatByType(value: number | undefined, format: ModuleFieldConfig["format"]): string {
  switch (format) {
    case "money":
      return formatMoney(value);
    case "percent":
      return formatPercent(value);
    case "decimal":
      return formatDecimal(value);
    default:
      return formatNumber(value);
  }
}

export type FunnelBarStage = {
  label: string;
  value: number | undefined;
  dropFromPrev: number | null;
};

// Construye un funnel genérico a partir de una lista ordenada de {label, value}.
// value === undefined (campo sin dato aún) se conserva como undefined, no se fabrica un 0.
export function toFunnelStages(input: { label: string; value: number | undefined }[]): FunnelBarStage[] {
  return input.map((s, i) => {
    const prev = i === 0 ? null : input[i - 1].value;
    const dropFromPrev =
      i === 0 || prev == null || s.value === undefined ? null : prev === 0 ? 0 : (s.value / prev) * 100;
    return { label: s.label, value: s.value, dropFromPrev };
  });
}

// "real" son los leads/ventas verdaderos de funnel_events (siempre disponibles, a
// diferencia de las métricas granulares). Cuando existen, reemplazan la primera
// ("Leads") y última ("Ventas") etapa en vez del valor (probablemente vacío) de
// webinar_metrics.
export function toExecutiveFunnelStages(
  metrics: WebinarMetrics,
  real?: { totalLeads: number; totalCompras: number }
): FunnelBarStage[] {
  const input = EXECUTIVE_FUNNEL_STAGES.map((stage, i) => {
    const granular = (metrics[stage.module] as Record<string, number | undefined>)?.[stage.field];
    if (real && i === 0) return { label: stage.label, value: real.totalLeads || granular };
    if (real && i === EXECUTIVE_FUNNEL_STAGES.length - 1) return { label: stage.label, value: real.totalCompras || granular };
    return { label: stage.label, value: granular };
  });
  return toFunnelStages(input);
}

export function toExecutiveSummaryKpis(metrics: WebinarMetrics, real: { totalLeads: number; totalIngresos: number }) {
  return EXECUTIVE_SUMMARY_KPIS.map((kpi) => ({
    label: kpi.label,
    sublabel: kpi.sublabel,
    module: kpi.module,
    value: formatByType(kpi.compute(metrics, real) ?? undefined, kpi.format),
  }));
}

export function toNivelatoriosSeries(metrics: WebinarMetrics["nivelatorios"]) {
  const sesiones = metrics.sesiones ?? [];
  const bySesion = new Map(sesiones.map((s) => [s.sesion, s.asistentes]));
  return [0, 1, 2, 3].map((sesion) => ({ sesion, asistentes: bySesion.get(sesion) }));
}

export function toRetentionSeries(metrics: WebinarMetrics["webinar"]) {
  return metrics.retencion ?? [];
}

export function toMetaAdsTotals(entries: MetaAdsEntry[]) {
  if (entries.length === 0) return null;
  const spend = entries.reduce((acc, e) => acc + (Number(e.spend) || 0), 0);
  const avg = (field: keyof MetaAdsEntry) => {
    const values = entries.map((e) => Number(e[field])).filter((n) => !Number.isNaN(n));
    return values.length === 0 ? undefined : values.reduce((a, b) => a + b, 0) / values.length;
  };
  return {
    spend,
    scroll_stop_rate: avg("scroll_stop_rate"),
    ctr: avg("ctr"),
    cpm: avg("cpm"),
    cpc: avg("cpc"),
    cpl: avg("cpl"),
    frequency: avg("frequency"),
  };
}
