import { MetaAdRow } from "@/lib/meta-ads/types";
import { formatMoney, formatNumber, formatPercent } from "@/lib/webinar-os/aggregate";

// Métricas que la persona puede mostrar en cada tarjeta de Análisis de Anuncios.
// `disponible: false` = el dato todavía no existe (depende de atribuir leads a un
// anuncio por utm_content), se muestra deshabilitado en el popup.
export type MetricaKey =
  | "gasto"
  | "impresiones"
  | "clics_enlace"
  | "ctr"
  | "cpm"
  | "leads"
  | "ventas"
  | "roas"
  | "cpa"
  | "calificados";

export type MetricaDef = {
  key: MetricaKey;
  label: string;
  disponible: boolean;
  formatear: (ad: MetaAdRow) => string;
  sinDatos?: (ad: MetaAdRow) => boolean;
};

const sinVentas = (ad: MetaAdRow) => ad.roas === 0 && ad.ventas === 0;

export const METRICAS: MetricaDef[] = [
  { key: "gasto", label: "Gasto", disponible: true, formatear: (ad) => formatMoney(ad.spend) },
  { key: "impresiones", label: "Impresiones", disponible: true, formatear: (ad) => formatNumber(ad.impressions) },
  { key: "clics_enlace", label: "Clics en enlace", disponible: true, formatear: (ad) => formatNumber(ad.link_clicks) },
  { key: "ctr", label: "CTR", disponible: true, formatear: (ad) => formatPercent(ad.ctr) },
  { key: "cpm", label: "CPM", disponible: true, formatear: (ad) => formatMoney(ad.cpm) },
  { key: "leads", label: "Leads (Meta)", disponible: true, formatear: (ad) => formatNumber(ad.leads) },
  { key: "ventas", label: "Ventas", disponible: true, formatear: (ad) => formatNumber(ad.ventas) },
  { key: "roas", label: "ROAS", disponible: true, formatear: (ad) => `${ad.roas.toFixed(2)}x`, sinDatos: sinVentas },
  { key: "cpa", label: "CPA", disponible: true, formatear: (ad) => formatMoney(ad.cpa), sinDatos: sinVentas },
  { key: "calificados", label: "Leads calificados", disponible: false, formatear: () => "—" },
];

export const METRICAS_POR_DEFECTO: MetricaKey[] = ["gasto", "impresiones", "roas", "cpa", "ventas"];

export function metricaDef(key: MetricaKey): MetricaDef {
  return METRICAS.find((m) => m.key === key)!;
}

// Grupos predefinidos. "Mejores leads" queda deshabilitado hasta tener el criterio
// de respuesta calificada y la atribución lead→anuncio.
export type GrupoKey = "todos" | "mejores_ganchos" | "mejor_roas" | "mejores_leads";

export const GRUPOS: { key: GrupoKey; label: string; disponible: boolean; ordenar: (a: MetaAdRow, b: MetaAdRow) => number }[] = [
  { key: "todos", label: "Todos", disponible: true, ordenar: (a, b) => b.roas - a.roas },
  { key: "mejores_ganchos", label: "Mejores ganchos", disponible: true, ordenar: (a, b) => b.ctr - a.ctr },
  { key: "mejor_roas", label: "Mejor ROAS", disponible: true, ordenar: (a, b) => b.roas - a.roas },
  { key: "mejores_leads", label: "Mejores leads", disponible: false, ordenar: (a, b) => b.roas - a.roas },
];

export type EstadoFiltro = "todos" | "activos" | "pausados";

export type ConfigAnalisis = {
  grupo: GrupoKey;
  metricas: MetricaKey[];
  estado: EstadoFiltro;
  gastoMinimo: number;
  campana: string;
};

export const CONFIG_POR_DEFECTO: ConfigAnalisis = {
  grupo: "todos",
  metricas: METRICAS_POR_DEFECTO,
  estado: "todos",
  gastoMinimo: 0,
  campana: "",
};

export function filtrosActivos(config: ConfigAnalisis): number {
  let n = 0;
  if (config.estado !== "todos") n++;
  if (config.gastoMinimo > 0) n++;
  if (config.campana) n++;
  return n;
}

export function aplicarConfig(anuncios: MetaAdRow[], config: ConfigAnalisis): MetaAdRow[] {
  const grupo = GRUPOS.find((g) => g.key === config.grupo) ?? GRUPOS[0];
  return anuncios
    .filter((ad) => {
      if (config.estado === "activos" && ad.status !== "ACTIVE") return false;
      if (config.estado === "pausados" && ad.status !== "PAUSED") return false;
      if (ad.spend < config.gastoMinimo) return false;
      if (config.campana && ad.campaign_id !== config.campana) return false;
      return true;
    })
    .sort(grupo.ordenar);
}
