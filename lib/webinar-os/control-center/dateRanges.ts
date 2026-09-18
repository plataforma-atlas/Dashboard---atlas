function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export type RangoRapido = "all" | "today" | "7days" | "1month" | "custom";

export const RANGO_RAPIDO_LABEL: Record<Exclude<RangoRapido, "custom">, string> = {
  all: "Todo el período",
  today: "Hoy",
  "7days": "Últimos 7 días",
  "1month": "Último mes",
};

/** Rangos de fecha REALES (hasta hoy) para los presets rápidos — no son
 * comparativas "vs. periodo anterior" (eso necesitaría snapshots históricos que no
 * existen), solo una forma cómoda de fijar fecha_inicio/fecha_fin reales. */
export function rangoRapido(preset: Exclude<RangoRapido, "custom">): { fecha_inicio: string; fecha_fin: string } {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // "all": sin fecha_inicio/fecha_fin — el backend no filtra por periodo y
  // devuelve el acumulado histórico completo (mismo comportamiento que
  // Cartera). Es el default porque las ediciones de muchos clientes quedan
  // "archived" y su actividad real cae fuera de cualquier ventana reciente
  // — con un periodo reciente como default el resumen se veía vacío.
  if (preset === "all") {
    return { fecha_inicio: "", fecha_fin: "" };
  }
  if (preset === "today") {
    return { fecha_inicio: toISODate(hoy), fecha_fin: toISODate(hoy) };
  }
  if (preset === "7days") {
    const inicio = new Date(hoy);
    inicio.setDate(inicio.getDate() - 6);
    return { fecha_inicio: toISODate(inicio), fecha_fin: toISODate(hoy) };
  }
  // "1month"
  const inicioMes = new Date(hoy);
  inicioMes.setMonth(inicioMes.getMonth() - 1);
  return { fecha_inicio: toISODate(inicioMes), fecha_fin: toISODate(hoy) };
}
