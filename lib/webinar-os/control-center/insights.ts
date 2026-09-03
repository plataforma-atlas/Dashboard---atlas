import { Estado, estadoBadgeClass } from "@/lib/webinar-os/cartera";
import { formatMoney, formatPercent } from "@/lib/webinar-os/aggregate";
import { CampanaCartera } from "./types";

export { estadoBadgeClass };

/** Suma cruda de todas las campañas — para el resumen "todas las campañas". Los ratios
 * (ROAS/ticket/CAC) se recalculan sobre las sumas, nunca promediando los ratios por
 * campaña, para no caer en una paradoja de Simpson. */
export function aggregateCampanas(campanas: CampanaCartera[]) {
  const facturacion_bruta = campanas.reduce((acc, c) => acc + c.facturacion_bruta, 0);
  const inversion = campanas.reduce((acc, c) => acc + c.inversion, 0);
  const ventas = campanas.reduce((acc, c) => acc + c.ventas, 0);
  const registros = campanas.reduce((acc, c) => acc + c.registros, 0);
  const facturacion_neta = campanas.reduce((acc, c) => acc + c.facturacion_neta, 0);

  return {
    facturacion_bruta,
    facturacion_neta,
    inversion,
    ventas,
    registros,
    roas_bruto: inversion > 0 ? facturacion_bruta / inversion : null,
    roas_neto: inversion > 0 ? facturacion_neta / inversion : null,
    registro_a_venta: registros > 0 ? (ventas / registros) * 100 : null,
    ticket_promedio: ventas > 0 ? facturacion_bruta / ventas : null,
    cac: ventas > 0 ? inversion / ventas : null,
  };
}

const RANGO_ESTADO: Record<Estado, number> = {
  Atención: 0,
  Revisar: 1,
  Estable: 2,
  Escalar: 3,
  "Sin datos de inversión": 4,
};

export function ordenPrioridad(campanas: CampanaCartera[]): CampanaCartera[] {
  return [...campanas].sort((a, b) => RANGO_ESTADO[a.estado] - RANGO_ESTADO[b.estado]);
}

export type Recomendacion = { titulo: string; metrica: string; cuerpo: string };

/** Recomendaciones "qué deberías mirar hoy" calculadas de datos reales — nunca copy fijo.
 * Con ROAS (cuando hay inversión real) prioriza escalar/revisar; sin eso, cae a una
 * lectura basada en conversión registro→venta, que no depende de tener spend cargado. */
export function pickRecomendaciones(campanas: CampanaCartera[]): Recomendacion[] {
  const conRoas = campanas.filter((c) => c.roas_neto !== null);
  const recs: Recomendacion[] = [];

  if (conRoas.length > 0) {
    const mejor = conRoas.reduce((max, c) => (c.roas_neto! > max.roas_neto! ? c : max), conRoas[0]);
    const peor = conRoas.reduce((min, c) => (c.roas_neto! < min.roas_neto! ? c : min), conRoas[0]);
    if (mejor.roas_neto! >= 2.4) {
      recs.push({
        titulo: `${mejor.campaign_name} · Escalar adquisición`,
        metrica: `ROAS ${mejor.roas_neto!.toFixed(1).replace(".", ",")}x`,
        cuerpo: `Tiene el mejor retorno del portafolio (ROAS neto ${mejor.roas_neto!.toFixed(2).replace(".", ",")}x). Candidata a recibir más presupuesto de forma controlada.`,
      });
    }
    if (peor.campaign_id !== mejor.campaign_id && peor.roas_neto! < 1.9) {
      recs.push({
        titulo: `${peor.campaign_name} · Mejorar retorno`,
        metrica: `ROAS ${peor.roas_neto!.toFixed(1).replace(".", ",")}x`,
        cuerpo: `El retorno está por debajo del umbral saludable. Revisar oferta y seguimiento comercial antes de invertir más tráfico.`,
      });
    }
  }

  const conRegistros = campanas.filter((c) => c.registros > 0);
  if (conRegistros.length > 0) {
    const peorConversion = conRegistros.reduce(
      (min, c) => ((c.registro_a_venta ?? 0) < (min.registro_a_venta ?? 0) ? c : min),
      conRegistros[0]
    );
    if (!recs.some((r) => r.titulo.startsWith(peorConversion.campaign_name))) {
      recs.push({
        titulo: `${peorConversion.campaign_name} · Revisar conversión`,
        metrica: formatPercent(peorConversion.registro_a_venta ?? undefined),
        cuerpo: `De ${peorConversion.registros.toLocaleString("es-CO")} registros solo ${formatPercent(peorConversion.registro_a_venta ?? undefined)} termina comprando. Antes de invertir en tráfico, conviene revisar la oferta y el seguimiento a este grupo.`,
      });
    }
  }

  return recs.slice(0, 3);
}

export type BalanceItem = { titulo: string; metrica: string; cuerpo: string };

export function pickBalance(campanas: CampanaCartera[]): { bien: BalanceItem[]; atencion: BalanceItem[] } {
  const bien: BalanceItem[] = [];
  const atencion: BalanceItem[] = [];

  const conRoas = campanas.filter((c) => c.roas_neto !== null);
  if (conRoas.length > 0) {
    const mejor = conRoas.reduce((max, c) => (c.roas_neto! > max.roas_neto! ? c : max), conRoas[0]);
    bien.push({
      titulo: `${mejor.campaign_name} · Mejor eficiencia`,
      metrica: `ROAS ${mejor.roas_neto!.toFixed(1).replace(".", ",")}x`,
      cuerpo: "El mejor retorno del portafolio en el periodo seleccionado.",
    });
  }
  const mayorFacturacion = campanas.reduce(
    (max, c) => (c.facturacion_bruta > max.facturacion_bruta ? c : max),
    campanas[0]
  );
  if (mayorFacturacion && mayorFacturacion.facturacion_bruta > 0) {
    bien.push({
      titulo: `${mayorFacturacion.campaign_name} · Mayor facturación`,
      metrica: formatMoney(mayorFacturacion.facturacion_bruta),
      cuerpo: `Genera ${mayorFacturacion.ventas.toLocaleString("es-CO")} ventas — la que más aporta a la facturación del periodo.`,
    });
  }

  campanas
    .filter((c) => c.estado === "Atención" || c.estado === "Revisar")
    .slice(0, 2)
    .forEach((c) => {
      atencion.push({
        titulo: `${c.campaign_name} · ${c.estado}`,
        metrica: c.roas_neto !== null ? `ROAS ${c.roas_neto.toFixed(1).replace(".", ",")}x` : "Sin datos",
        cuerpo: c.estado === "Atención" ? "Retorno por debajo del umbral saludable — revisar antes de seguir invirtiendo." : "Retorno ajustado — vigilar de cerca antes de escalar.",
      });
    });

  return { bien, atencion };
}
