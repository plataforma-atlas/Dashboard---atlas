import { FunnelRow } from "../types";
import { toDailySeries } from "../aggregate";
import { VslDailyRow, VslKpis, VslFunnelStage } from "./types";

// sort_order reales de funnel_stages para strategy_type = 'vsl', confirmados contra
// la base de datos: 2 = Formulario (registro), 7 = Depósito. El resto de las etapas
// que se muestran en el embudo (Visitas, Inicio VSL, etc.) todavía no tienen tracking.
const SORT_ORDER_FORMULARIO = 2;
const SORT_ORDER_DEPOSITO = 7;

export function toVslDailyRows(rows: FunnelRow[]): VslDailyRow[] {
  const daily = toDailySeries(rows);
  const byDate = new Map<string, VslDailyRow>();
  for (const d of daily) {
    const prev = byDate.get(d.date) ?? { date: d.date, registros: 0, depositos: 0, capitalDepositado: 0 };
    if (d.sort_order === SORT_ORDER_FORMULARIO) prev.registros += d.leads;
    if (d.sort_order === SORT_ORDER_DEPOSITO) {
      prev.depositos += d.leads;
      prev.capitalDepositado += d.ingresos;
    }
    byDate.set(d.date, prev);
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function toVslKpis(rows: FunnelRow[]): VslKpis {
  let registros = 0;
  let depositos = 0;
  let capitalDepositado = 0;
  for (const r of rows) {
    if (r.sort_order === SORT_ORDER_FORMULARIO) registros += Number(r.total_leads) || 0;
    if (r.sort_order === SORT_ORDER_DEPOSITO) {
      depositos += Number(r.total_leads) || 0;
      capitalDepositado += Number(r.total_ingresos) || 0;
    }
  }
  return {
    registros,
    depositos,
    capitalDepositado,
    ticketPromedioDepositado: depositos > 0 ? capitalDepositado / depositos : null,
    conversionRegistroDeposito: registros > 0 ? (depositos / registros) * 100 : null,
    inversion: null,
    clicsOferta: null,
    ctrOferta: null,
    costoClicOferta: null,
    costoPorDepositante: null,
    inicioVsl: null,
  };
}

// Estructura fija del embudo (nombres del mockup); solo "Registros" tiene dato real hoy.
export function toVslFunnelStages(kpis: VslKpis): VslFunnelStage[] {
  return [
    { label: "Visitas", value: null },
    { label: "Registros (Formulario)", value: kpis.registros || null },
    { label: "Inicio VSL", value: null },
    { label: "Llega a oferta", value: null },
    { label: "Ve CTA HFM", value: null },
    { label: "Clic oferta HFM", value: kpis.clicsOferta },
  ];
}
