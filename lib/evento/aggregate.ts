import { Campaign, FunnelRow } from "../types";
import {
  EventoAdSpendConsolidatedRow,
  EventoAdSpendRow,
  EventoAngleStat,
  EventoDailyPerformanceRow,
  EventoDailyTraficoRow,
  EventoKpis,
  EventoTemperaturaRow,
} from "./types";

// Nombres reales de funnel_stages para strategy_type = 'evento_presencial'.
// Se compara por nombre (no por sort_order) porque esta tabla es compartida entre
// estrategias/clientes y el orden numérico puede cambiar sin que cambie el nombre.
const STAGE_REGISTRO = "Preregistro";
const STAGE_WP = "Se unió a WP";
const STAGE_CHECKIN = "Check-in Evento";
const STAGE_CONFIRMACION = "Confirmación";

function sumLeads(rows: FunnelRow[], stageName: string): number {
  return rows.filter((r) => r.stagename === stageName).reduce((acc, r) => acc + (Number(r.total_leads) || 0), 0);
}

function sumIngresos(rows: FunnelRow[], stageName: string): number {
  return rows.filter((r) => r.stagename === stageName).reduce((acc, r) => acc + (Number(r.total_ingresos) || 0), 0);
}

export function toEventoKpis(rows: FunnelRow[]): EventoKpis {
  const registros = sumLeads(rows, STAGE_REGISTRO);
  const llegaronWp = sumLeads(rows, STAGE_WP);
  const checkins = sumLeads(rows, STAGE_CHECKIN);
  const confirmados = sumLeads(rows, STAGE_CONFIRMACION);
  const capitalVendido = sumIngresos(rows, STAGE_CONFIRMACION);
  return {
    registros,
    llegaronWp,
    checkins,
    confirmados,
    capitalVendido,
    conversionWp: registros > 0 ? (llegaronWp / registros) * 100 : null,
    conversionConfirmado: registros > 0 ? (confirmados / registros) * 100 : null,
    conversionCheckin: registros > 0 ? (checkins / registros) * 100 : null,
  };
}

// Compara los ángulos entre sí (ordenado por registros desc) para responder
// "qué ángulo está funcionando mejor" — cada entrada trae SUS propias filas,
// nunca mezcladas con las de otro ángulo.
export function toEventoAngleStats(byAngle: { campaign: Campaign; rows: FunnelRow[] }[]): EventoAngleStat[] {
  return byAngle
    .map(({ campaign, rows }) => {
      const registros = sumLeads(rows, STAGE_REGISTRO);
      const llegaronWp = sumLeads(rows, STAGE_WP);
      const checkins = sumLeads(rows, STAGE_CHECKIN);
      const confirmados = sumLeads(rows, STAGE_CONFIRMACION);
      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        registros,
        llegaronWp,
        checkins,
        confirmados,
        conversionConfirmado: registros > 0 ? (confirmados / registros) * 100 : null,
      };
    })
    .sort((a, b) => b.registros - a.registros);
}

// Agrupa los registros por origen: campañas cuyo slug incluye "organica" (redes propias
// de los expertos) van a tibio; el resto (pauta paga) va a frío.
export function toEventoTemperaturaStats(byAngle: { campaign: Campaign; rows: FunnelRow[] }[]): EventoTemperaturaRow[] {
  let tibio = 0;
  let frio = 0;
  for (const { campaign, rows } of byAngle) {
    const registros = sumLeads(rows, STAGE_REGISTRO);
    if (campaign.slug?.includes("organica")) tibio += registros;
    else frio += registros;
  }
  return [
    { temperatura: "Tráfico Tibio", registros: tibio },
    { temperatura: "Tráfico Frío", registros: frio },
  ];
}

// Une, por día, los leads pagos (con su CPL, desde el gasto consolidado) con los registros
// orgánicos del mismo día (campañas cuyo slug incluye "organica") — para la gráfica combinada.
export function toEventoDailyTraficoStats(
  adSpendConsolidated: EventoAdSpendConsolidatedRow[],
  byAngle: { campaign: Campaign; rows: FunnelRow[] }[]
): EventoDailyTraficoRow[] {
  const byDate = new Map<string, { spend: number; leadsPauta: number; leadsOrganico: number }>();

  for (const row of adSpendConsolidated) {
    if (!row.entry_date) continue;
    const date = row.entry_date.slice(0, 10);
    const prev = byDate.get(date) ?? { spend: 0, leadsPauta: 0, leadsOrganico: 0 };
    prev.spend += Number(row.spend) || 0;
    prev.leadsPauta += Number(row.leads) || 0;
    byDate.set(date, prev);
  }

  for (const { campaign, rows } of byAngle) {
    if (!campaign.slug?.includes("organica")) continue;
    for (const r of rows) {
      if (r.stagename !== STAGE_REGISTRO || !r.event_date) continue;
      const date = r.event_date.slice(0, 10);
      const prev = byDate.get(date) ?? { spend: 0, leadsPauta: 0, leadsOrganico: 0 };
      prev.leadsOrganico += Number(r.total_leads) || 0;
      byDate.set(date, prev);
    }
  }

  return Array.from(byDate.entries())
    .map(([entry_date, v]) => ({
      entry_date,
      leadsPauta: v.leadsPauta,
      leadsOrganico: v.leadsOrganico,
      cpl: v.leadsPauta > 0 ? v.spend / v.leadsPauta : null,
    }))
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date));
}

// Dashboard V3: une, por día, el faturamento real (ingresos de TODAS las campañas
// evento del cliente en la etapa Confirmación) con el investimento real (gasto de
// pauta consolidado) y deriva el ROAS. A diferencia de toEventoDailyTraficoStats
// (leads + CPL, por ángulo orgánico), esta es una vista a nivel cliente completo.
export function toEventoDailyPerformanceStats(
  adSpendConsolidated: EventoAdSpendConsolidatedRow[],
  byAngle: { campaign: Campaign; rows: FunnelRow[] }[]
): EventoDailyPerformanceRow[] {
  const byDate = new Map<string, { faturamento: number; investimento: number }>();

  for (const row of adSpendConsolidated) {
    if (!row.entry_date) continue;
    const date = row.entry_date.slice(0, 10);
    const prev = byDate.get(date) ?? { faturamento: 0, investimento: 0 };
    prev.investimento += Number(row.spend) || 0;
    byDate.set(date, prev);
  }

  for (const { rows } of byAngle) {
    for (const r of rows) {
      if (r.stagename !== STAGE_CONFIRMACION || !r.event_date) continue;
      const date = r.event_date.slice(0, 10);
      const prev = byDate.get(date) ?? { faturamento: 0, investimento: 0 };
      prev.faturamento += Number(r.total_ingresos) || 0;
      byDate.set(date, prev);
    }
  }

  return Array.from(byDate.entries())
    .map(([entry_date, v]) => ({
      entry_date,
      faturamento: v.faturamento,
      investimento: v.investimento,
      roas: v.investimento > 0 ? v.faturamento / v.investimento : null,
    }))
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date));
}

// Dashboard V3 — "Vendas por fuente": suma total_ingresos SOLO de la etapa
// Confirmación (nunca de otras etapas) agrupado por utm_source. No reusa
// toSourceBreakdown de lib/aggregate.ts porque esa suma ingresos de todas las
// filas sin filtrar por stage — acá necesitamos certeza total sobre qué se suma.
export function toEventoVentasPorFuente(byAngle: { campaign: Campaign; rows: FunnelRow[] }[]): { source: string; ingresos: number }[] {
  const byFuente = new Map<string, number>();
  for (const { rows } of byAngle) {
    for (const r of rows) {
      if (r.stagename !== STAGE_CONFIRMACION) continue;
      const fuente = r.utm_source || "sin_fuente";
      byFuente.set(fuente, (byFuente.get(fuente) ?? 0) + (Number(r.total_ingresos) || 0));
    }
  }
  return Array.from(byFuente.entries())
    .map(([source, ingresos]) => ({ source, ingresos }))
    .sort((a, b) => b.ingresos - a.ingresos);
}

// Dashboard V3 — "Investimento por campaña": suma spend agrupado por campaign_name.
export function toEventoInvestimentoPorCampana(adSpend: EventoAdSpendRow[]): { campaign: string; spend: number }[] {
  const byCampana = new Map<string, number>();
  for (const row of adSpend) {
    const nombre = row.campaign_name || "Sin nombre";
    byCampana.set(nombre, (byCampana.get(nombre) ?? 0) + (Number(row.spend) || 0));
  }
  return Array.from(byCampana.entries())
    .map(([campaign, spend]) => ({ campaign, spend }))
    .sort((a, b) => b.spend - a.spend);
}
