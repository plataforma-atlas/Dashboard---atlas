function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function mondayOf(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0=domingo..6=sábado
  const diff = day === 0 ? -6 : 1 - day; // retrocede hasta el lunes
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export type RangoRapido = "current" | "previous" | "4weeks";

/** Rangos de fecha REALES (lunes–hoy/domingo) para los presets rápidos — no son
 * comparativas "vs. periodo anterior" (eso necesitaría snapshots históricos que no
 * existen), solo una forma cómoda de fijar fecha_inicio/fecha_fin reales. */
export function rangoRapido(preset: RangoRapido): { fecha_inicio: string; fecha_fin: string } {
  const hoy = new Date();
  const lunesActual = mondayOf(hoy);

  if (preset === "current") {
    return { fecha_inicio: toISODate(lunesActual), fecha_fin: toISODate(hoy) };
  }
  if (preset === "previous") {
    const lunesAnterior = new Date(lunesActual);
    lunesAnterior.setDate(lunesAnterior.getDate() - 7);
    const domingoAnterior = new Date(lunesActual);
    domingoAnterior.setDate(domingoAnterior.getDate() - 1);
    return { fecha_inicio: toISODate(lunesAnterior), fecha_fin: toISODate(domingoAnterior) };
  }
  // "4weeks": últimas 4 semanas completas hasta hoy
  const inicio4Semanas = new Date(lunesActual);
  inicio4Semanas.setDate(inicio4Semanas.getDate() - 21);
  return { fecha_inicio: toISODate(inicio4Semanas), fecha_fin: toISODate(hoy) };
}

export type SemanaEspecifica = { value: string; label: string; fecha_inicio: string; fecha_fin: string };

/** Últimas N semanas calendario (lunes–domingo) para el selector de "semana específica"
 * del filtro avanzado. */
export function semanasEspecificas(cantidad = 6): SemanaEspecifica[] {
  const hoy = new Date();
  const lunesActual = mondayOf(hoy);
  const semanas: SemanaEspecifica[] = [];
  for (let i = 0; i < cantidad; i++) {
    const inicio = new Date(lunesActual);
    inicio.setDate(inicio.getDate() - 7 * i);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
    semanas.push({
      value: `${toISODate(inicio)}|${toISODate(fin)}`,
      label: `${fmt(inicio)} – ${fmt(fin)}`,
      fecha_inicio: toISODate(inicio),
      fecha_fin: toISODate(fin),
    });
  }
  return semanas;
}
