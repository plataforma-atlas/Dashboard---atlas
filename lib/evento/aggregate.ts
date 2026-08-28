import { Campaign, FunnelRow } from "../types";
import { EventoAdSpendConsolidatedRow, EventoAngleStat, EventoDailyTraficoRow, EventoKpis, EventoTemperaturaRow } from "./types";

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
