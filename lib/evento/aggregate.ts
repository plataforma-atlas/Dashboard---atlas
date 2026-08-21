import { Campaign, FunnelRow } from "../types";
import { EventoAngleStat, EventoKpis } from "./types";

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
