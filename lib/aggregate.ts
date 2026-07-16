import { CountryRow, FunnelRow, SourceRow, StageSummary } from "./types";

export function toStageSummary(rows: FunnelRow[]): StageSummary[] {
  const byStage = new Map<number, { stage: string; leads: number; ingresos: number }>();

  for (const r of rows) {
    const key = r.sort_order;
    const prev = byStage.get(key) ?? { stage: r.stagename, leads: 0, ingresos: 0 };
    prev.leads += Number(r.total_leads) || 0;
    prev.ingresos += Number(r.total_ingresos) || 0;
    byStage.set(key, prev);
  }

  const ordered = Array.from(byStage.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([sort_order, v]) => ({ sort_order, ...v }));

  return ordered.map((s, i) => ({
    ...s,
    dropFromPrev: i === 0 ? null : ordered[i - 1].leads === 0 ? 0 : (s.leads / ordered[i - 1].leads) * 100,
  }));
}

export function toCountryBreakdown(rows: FunnelRow[], stageOrder = 1): CountryRow[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    if (r.sort_order !== stageOrder) continue;
    const country = r.country || "Sin dato";
    map.set(country, (map.get(country) ?? 0) + (Number(r.total_leads) || 0));
  }
  return Array.from(map.entries())
    .map(([country, leads]) => ({ country, leads }))
    .sort((a, b) => b.leads - a.leads);
}

export function toSourceBreakdown(rows: FunnelRow[]): SourceRow[] {
  const map = new Map<string, { leads: number; ingresos: number }>();
  for (const r of rows) {
    const source = r.utm_source || "sin_fuente";
    const prev = map.get(source) ?? { leads: 0, ingresos: 0 };
    // para "leads" tomamos solo el registro inicial, para no duplicar conteo entre etapas
    if (r.sort_order === 1) prev.leads += Number(r.total_leads) || 0;
    prev.ingresos += Number(r.total_ingresos) || 0;
    map.set(source, prev);
  }
  return Array.from(map.entries())
    .map(([source, v]) => ({ source, ...v }))
    .sort((a, b) => b.ingresos - a.ingresos);
}

export function toKpis(rows: FunnelRow[]) {
  const stages = toStageSummary(rows);
  const totalLeads = stages[0]?.leads ?? 0;
  const totalIngresos = stages.reduce((acc, s) => acc + s.ingresos, 0);
  const totalCompras = stages.filter((s) => s.ingresos > 0).reduce((acc, s) => acc + s.leads, 0);
  const conversionGlobal = totalLeads === 0 ? 0 : (totalCompras / totalLeads) * 100;
  const ticketPromedio = totalCompras === 0 ? 0 : totalIngresos / totalCompras;

  return { totalLeads, totalIngresos, conversionGlobal, ticketPromedio };
}
