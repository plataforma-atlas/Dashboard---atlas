import { Campaign, FunnelRow } from "../types";
import { EventoAngleStat, EventoKpis } from "./types";

// sort_order reales de funnel_stages para strategy_type = 'evento_presencial'
// (ver Seed en el workflow n8n "Atlas — Evento Trading Experience").
const SORT_ORDER_REGISTRO = 1;
const SORT_ORDER_CHECKIN = 2;
const SORT_ORDER_VENTA = 3;

function sumLeads(rows: FunnelRow[], sortOrder: number): number {
  return rows.filter((r) => r.sort_order === sortOrder).reduce((acc, r) => acc + (Number(r.total_leads) || 0), 0);
}

function sumIngresos(rows: FunnelRow[], sortOrder: number): number {
  return rows.filter((r) => r.sort_order === sortOrder).reduce((acc, r) => acc + (Number(r.total_ingresos) || 0), 0);
}

export function toEventoKpis(rows: FunnelRow[]): EventoKpis {
  const registros = sumLeads(rows, SORT_ORDER_REGISTRO);
  const checkins = sumLeads(rows, SORT_ORDER_CHECKIN);
  const ventas = sumLeads(rows, SORT_ORDER_VENTA);
  const capitalVendido = sumIngresos(rows, SORT_ORDER_VENTA);
  return {
    registros,
    checkins,
    ventas,
    capitalVendido,
    conversionRegistroVenta: registros > 0 ? (ventas / registros) * 100 : null,
    conversionCheckin: registros > 0 ? (checkins / registros) * 100 : null,
  };
}

// Compara los 4 ángulos entre sí (ordenado por registros desc) para responder
// "qué ángulo está funcionando mejor" — cada entrada trae SUS propias filas,
// nunca mezcladas con las de otro ángulo.
export function toEventoAngleStats(byAngle: { campaign: Campaign; rows: FunnelRow[] }[]): EventoAngleStat[] {
  return byAngle
    .map(({ campaign, rows }) => {
      const registros = sumLeads(rows, SORT_ORDER_REGISTRO);
      const checkins = sumLeads(rows, SORT_ORDER_CHECKIN);
      const ventas = sumLeads(rows, SORT_ORDER_VENTA);
      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        registros,
        checkins,
        ventas,
        conversionRegistroVenta: registros > 0 ? (ventas / registros) * 100 : null,
      };
    })
    .sort((a, b) => b.registros - a.registros);
}
