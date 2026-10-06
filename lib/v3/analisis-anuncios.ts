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

// Grupo guardado por cliente (tabla v3_grupos_anuncios). `config` viene tal cual de
// la base; antes de usarlo pasar por sanitizarConfig.
export type GrupoGuardado = {
  id: number;
  nombre: string;
  config: unknown;
  created_at: string;
  actualizado_at: string;
};

export type ConfigAnalisis = {
  grupo: GrupoKey;
  metricas: MetricaKey[];
  estado: EstadoFiltro;
  gastoMinimo: number;
  campana: string;
  // Anuncios elegidos a mano. Vacío = todos los que pasen los demás filtros.
  adIds: string[];
};

export const CONFIG_POR_DEFECTO: ConfigAnalisis = {
  grupo: "todos",
  metricas: METRICAS_POR_DEFECTO,
  estado: "todos",
  gastoMinimo: 0,
  campana: "",
  adIds: [],
};

// Limpia la configuración que llega del cliente antes de guardarla o aplicarla:
// solo acepta valores conocidos y descarta cualquier otra clave.
export function sanitizarConfig(raw: unknown): ConfigAnalisis {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const grupo = GRUPOS.some((g) => g.key === r.grupo) ? (r.grupo as GrupoKey) : CONFIG_POR_DEFECTO.grupo;
  const metricas = Array.isArray(r.metricas)
    ? (r.metricas.filter((m) => METRICAS.some((d) => d.key === m)) as MetricaKey[])
    : CONFIG_POR_DEFECTO.metricas;
  const estado: EstadoFiltro = r.estado === "activos" || r.estado === "pausados" ? r.estado : "todos";
  const gastoMinimo = typeof r.gastoMinimo === "number" && r.gastoMinimo > 0 ? r.gastoMinimo : 0;
  const campana = typeof r.campana === "string" ? r.campana.slice(0, 64) : "";
  const adIds = Array.isArray(r.adIds)
    ? r.adIds.filter((id): id is string => typeof id === "string" && id.length > 0 && id.length <= 64).slice(0, 500)
    : [];
  return { grupo, metricas, estado, gastoMinimo, campana, adIds };
}

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
      if (config.adIds.length > 0 && !config.adIds.includes(ad.ad_id)) return false;
      if (config.estado === "activos" && ad.status !== "ACTIVE") return false;
      if (config.estado === "pausados" && ad.status !== "PAUSED") return false;
      if (ad.spend < config.gastoMinimo) return false;
      if (config.campana && ad.campaign_id !== config.campana) return false;
      return true;
    })
    .sort(grupo.ordenar);
}
