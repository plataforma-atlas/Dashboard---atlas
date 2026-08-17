import { CountryRow, DailyPoint, FunnelRow, SourceRow, StageSummary } from "./types";

export function toStageSummary(rows: FunnelRow[]): StageSummary[] {
  const byStage = new Map<number, { stage: string; leads: number; ingresos: number }>();
  for (const r of rows) {
    const prev = byStage.get(r.sort_order) ?? { stage: r.stagename, leads: 0, ingresos: 0 };
    prev.leads += Number(r.total_leads) || 0;
    prev.ingresos += Number(r.total_ingresos) || 0;
    byStage.set(r.sort_order, prev);
  }
  const ordered = Array.from(byStage.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([sort_order, v]) => ({ sort_order, ...v }));

  return ordered.map((s, i) => ({
    ...s,
    dropFromPrev: i === 0 ? null : ordered[i - 1].leads === 0 ? 0 : (s.leads / ordered[i - 1].leads) * 100,
  }));
}

// Serie real día por día, tal como viene de funnel_events (fe.event_date). Filas sin
// fecha (datos históricos migrados antes de que existiera esta columna en la consulta)
// se excluyen en vez de agruparse bajo una fecha inventada.
export function toDailySeries(rows: FunnelRow[]): DailyPoint[] {
  const map = new Map<string, DailyPoint>();
  for (const r of rows) {
    if (!r.event_date) continue;
    // El nodo Postgres de n8n serializa columnas `date` como timestamp ISO completo
    // (ej. "2026-07-30T00:00:00.000Z"); nos quedamos solo con la fecha (YYYY-MM-DD).
    const date = r.event_date.slice(0, 10);
    const key = `${date}|${r.sort_order}`;
    const prev = map.get(key) ?? { date, sort_order: r.sort_order, stage: r.stagename, leads: 0, ingresos: 0 };
    prev.leads += Number(r.total_leads) || 0;
    prev.ingresos += Number(r.total_ingresos) || 0;
    map.set(key, prev);
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date) || a.sort_order - b.sort_order);
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
