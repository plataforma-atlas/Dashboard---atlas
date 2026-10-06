// Evolución diaria de los anuncios seleccionados. Cada día suma las cifras de los
// anuncios y las razones (CTR, CPM, ROAS, CPA) se calculan sobre esas sumas.

export type FilaDiaria = {
  fecha: string;
  ad_id: string;
  gasto: number;
  impresiones: number;
  clics: number;
  enlace: number;
  leads: number;
  ventas: number;
  ingreso: number;
};

export type MetricaSerie = "gasto" | "impresiones" | "clics" | "leads" | "ventas" | "roas" | "cpa" | "ctr" | "cpm";

export type FormatoSerie = "dinero" | "numero" | "porcentaje" | "roas";

export const METRICAS_SERIE: { key: MetricaSerie; label: string; formato: FormatoSerie }[] = [
  { key: "gasto", label: "Gasto", formato: "dinero" },
  { key: "impresiones", label: "Impresiones", formato: "numero" },
  { key: "clics", label: "Clics", formato: "numero" },
  { key: "leads", label: "Leads (Meta)", formato: "numero" },
  { key: "ventas", label: "Ventas", formato: "numero" },
  { key: "roas", label: "ROAS", formato: "roas" },
  { key: "cpa", label: "CPA", formato: "dinero" },
  { key: "ctr", label: "CTR", formato: "porcentaje" },
  { key: "cpm", label: "CPM", formato: "dinero" },
];

export type PuntoDia = { fecha: string } & Record<MetricaSerie, number | null>;

export function serieDiaria(filas: FilaDiaria[]): PuntoDia[] {
  const porDia = new Map<string, { gasto: number; impresiones: number; clics: number; leads: number; ventas: number; ingreso: number }>();
  for (const f of filas) {
    const acum = porDia.get(f.fecha) ?? { gasto: 0, impresiones: 0, clics: 0, leads: 0, ventas: 0, ingreso: 0 };
    acum.gasto += f.gasto;
    acum.impresiones += f.impresiones;
    acum.clics += f.clics;
    acum.leads += f.leads;
    acum.ventas += f.ventas;
    acum.ingreso += f.ingreso;
    porDia.set(f.fecha, acum);
  }
  return [...porDia.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([fecha, d]) => ({
      fecha,
      gasto: d.gasto,
      impresiones: d.impresiones,
      clics: d.clics,
      leads: d.leads,
      ventas: d.ventas,
      roas: d.gasto > 0 ? d.ingreso / d.gasto : null,
      cpa: d.ventas > 0 ? d.gasto / d.ventas : null,
      ctr: d.impresiones > 0 ? (d.clics / d.impresiones) * 100 : null,
      cpm: d.impresiones > 0 ? (d.gasto / d.impresiones) * 1000 : null,
    }));
}

export function metricaSerie(key: MetricaSerie) {
  return METRICAS_SERIE.find((m) => m.key === key)!;
}
