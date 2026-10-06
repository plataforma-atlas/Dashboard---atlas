import { MetaAdRow } from "@/lib/meta-ads/types";
import { ENCUESTA_PREGUNTAS, obtenerRespuestasLead } from "@/lib/v3/embudo";
import { V3Lead } from "@/lib/v3/types";
import { formatMoney, formatNumber, formatPercent } from "@/lib/webinar-os/aggregate";

// Anuncio con los datos de leads cruzados por utm_content (id del anuncio).
export type AnuncioAnalisis = MetaAdRow & {
  leadsTotal: number;
  leadsCalificados: number;
  pctCalificados: number | null;
};

// Métricas que la persona puede mostrar en cada tarjeta de Análisis de Anuncios.
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
  formatear: (ad: AnuncioAnalisis) => string;
  sinDatos?: (ad: AnuncioAnalisis) => boolean;
};

const sinVentas = (ad: AnuncioAnalisis) => ad.roas === 0 && ad.ventas === 0;

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
  {
    key: "calificados",
    label: "Leads calificados",
    disponible: true,
    formatear: (ad) => `${ad.leadsCalificados} (${formatPercent(ad.pctCalificados ?? 0)})`,
    sinDatos: (ad) => ad.pctCalificados === null,
  },
];

export const METRICAS_POR_DEFECTO: MetricaKey[] = ["gasto", "impresiones", "roas", "cpa", "ventas"];

// Valor numérico de cada métrica para ordenar. null = sin dato (va al final).
const VALOR_POR_METRICA: Record<MetricaKey, (ad: AnuncioAnalisis) => number | null> = {
  gasto: (ad) => ad.spend,
  impresiones: (ad) => ad.impressions,
  clics_enlace: (ad) => ad.link_clicks,
  ctr: (ad) => ad.ctr,
  cpm: (ad) => ad.cpm,
  leads: (ad) => ad.leads,
  ventas: (ad) => ad.ventas,
  roas: (ad) => (sinVentas(ad) ? null : ad.roas),
  cpa: (ad) => (sinVentas(ad) ? null : ad.cpa),
  calificados: (ad) => ad.pctCalificados,
};

// Orden elegido por la persona. metrica = null → se usa el orden del grupo.
export type OrdenAnuncios = { metrica: MetricaKey | null; direccion: "asc" | "desc" };

export const ORDEN_POR_DEFECTO: OrdenAnuncios = { metrica: null, direccion: "desc" };

export function metricaDef(key: MetricaKey): MetricaDef {
  return METRICAS.find((m) => m.key === key)!;
}

// Criterio de "lead calificado" para el grupo Mejores leads. Se toma de una pregunta
// de la encuesta (extra.respuestas):
// - "top": las N respuestas de mayor monto (los empates cuentan juntos).
// - "minimo": las respuestas con monto desde `minimo`.
// - "manual": las respuestas que el cliente marcó en `respuestas`.
export type CriterioLeads = {
  pregunta: string;
  modo: "top" | "minimo" | "manual";
  n: number;
  minimo: number;
  respuestas: string[];
};

export const CRITERIO_POR_DEFECTO: CriterioLeads = { pregunta: "", modo: "top", n: 2, minimo: 0, respuestas: [] };

// Grupos predefinidos. Cada uno ordena las tarjetas de una forma.
export type GrupoKey = "todos" | "mejores_ganchos" | "mejor_roas" | "mejores_leads";

export const GRUPOS: { key: GrupoKey; label: string; disponible: boolean; ordenar: (a: AnuncioAnalisis, b: AnuncioAnalisis) => number }[] = [
  { key: "todos", label: "Todos", disponible: true, ordenar: (a, b) => b.roas - a.roas },
  { key: "mejores_ganchos", label: "Mejores ganchos", disponible: true, ordenar: (a, b) => b.ctr - a.ctr },
  { key: "mejor_roas", label: "Mejor ROAS", disponible: true, ordenar: (a, b) => b.roas - a.roas },
  {
    key: "mejores_leads",
    label: "Mejores leads",
    disponible: true,
    ordenar: (a, b) => {
      const pa = a.pctCalificados ?? -1;
      const pb = b.pctCalificados ?? -1;
      if (pa !== pb) return pb - pa;
      return b.leadsTotal - a.leadsTotal;
    },
  },
];

export type EstadoFiltro = "todos" | "activos" | "pausados";

export type ConfigAnalisis = {
  grupo: GrupoKey;
  metricas: MetricaKey[];
  estado: EstadoFiltro;
  gastoMinimo: number;
  campana: string;
  // Anuncios elegidos a mano. Vacío = todos los que pasen los demás filtros.
  adIds: string[];
  criterio: CriterioLeads | null;
  orden: OrdenAnuncios;
};

export const CONFIG_POR_DEFECTO: ConfigAnalisis = {
  grupo: "todos",
  metricas: METRICAS_POR_DEFECTO,
  estado: "todos",
  gastoMinimo: 0,
  campana: "",
  adIds: [],
  criterio: null,
  orden: ORDEN_POR_DEFECTO,
};

// Grupo guardado por cliente (tabla v3_grupos_anuncios). `config` viene tal cual de
// la base; antes de usarlo pasar por sanitizarConfig.
export type GrupoGuardado = {
  id: number;
  nombre: string;
  config: unknown;
  created_at: string;
  actualizado_at: string;
};

export function sanitizarCriterio(raw: unknown): CriterioLeads | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const pregunta = typeof r.pregunta === "string" ? r.pregunta.slice(0, 64) : "";
  if (!pregunta) return null;
  const modo: CriterioLeads["modo"] = r.modo === "minimo" || r.modo === "manual" ? r.modo : "top";
  const n = Math.min(10, Math.max(1, Math.floor(Number(r.n)) || CRITERIO_POR_DEFECTO.n));
  const minimo = typeof r.minimo === "number" && r.minimo > 0 ? r.minimo : 0;
  const respuestas = Array.isArray(r.respuestas)
    ? [...new Set(r.respuestas.filter((x): x is string => typeof x === "string" && x.length > 0 && x.length <= 200))].slice(0, 100)
    : [];
  return { pregunta, modo, n, minimo, respuestas };
}

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
  const criterio = sanitizarCriterio(r.criterio);
  const ordenRaw = (r.orden && typeof r.orden === "object" ? r.orden : {}) as Record<string, unknown>;
  const orden: OrdenAnuncios = {
    metrica: METRICAS.some((m) => m.key === ordenRaw.metrica) ? (ordenRaw.metrica as MetricaKey) : null,
    direccion: ordenRaw.direccion === "asc" ? "asc" : "desc",
  };
  return { grupo, metricas, estado, gastoMinimo, campana, adIds, criterio, orden };
}

export function filtrosActivos(config: ConfigAnalisis): number {
  let n = 0;
  if (config.estado !== "todos") n++;
  if (config.gastoMinimo > 0) n++;
  if (config.campana) n++;
  return n;
}

export function aplicarConfig(anuncios: AnuncioAnalisis[], config: ConfigAnalisis): AnuncioAnalisis[] {
  const grupo = GRUPOS.find((g) => g.key === config.grupo) ?? GRUPOS[0];
  const filtrados = anuncios.filter((ad) => {
    if (config.adIds.length > 0 && !config.adIds.includes(ad.ad_id)) return false;
    if (config.estado === "activos" && ad.status !== "ACTIVE") return false;
    if (config.estado === "pausados" && ad.status !== "PAUSED") return false;
    if (ad.spend < config.gastoMinimo) return false;
    if (config.campana && ad.campaign_id !== config.campana) return false;
    return true;
  });
  if (!config.orden.metrica) return filtrados.sort(grupo.ordenar);

  // Orden elegido por la persona: los sin dato van siempre al final.
  const valor = VALOR_POR_METRICA[config.orden.metrica];
  const signo = config.orden.direccion === "asc" ? 1 : -1;
  return filtrados.sort((a, b) => {
    const va = valor(a);
    const vb = valor(b);
    if (va === null && vb === null) return 0;
    if (va === null) return 1;
    if (vb === null) return -1;
    return (va - vb) * signo;
  });
}

// --- Montos y leads -------------------------------------------------------

// Saca el monto de una respuesta de texto: "Más de $1.000 USD" → 1000,
// "Entre $300 y $1.000" → 1000 (el mayor número del texto). Los puntos de miles
// se leen como separador de miles. Devuelve null si no hay ningún número.
export function parseMonto(texto: string): number | null {
  const tokens = texto.match(/\d[\d.,]*\d|\d/g);
  if (!tokens) return null;
  const valores = tokens
    .map((t) => {
      let s = t;
      if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
      else if (/^\d{1,3}(,\d{3})+$/.test(s)) s = s.replace(/,/g, "");
      else s = s.replace(",", ".");
      return Number(s);
    })
    .filter((v) => Number.isFinite(v));
  return valores.length ? Math.max(...valores) : null;
}

export type RespuestaPregunta = { label: string; count: number; monto: number | null };

// Respuestas distintas que dieron los leads a una pregunta, con su monto y cantidad.
// Orden: las de mayor monto primero; las que no tienen monto van al final.
export function respuestasDePregunta(leads: V3Lead[], pregunta: string): RespuestaPregunta[] {
  const conteo = new Map<string, number>();
  for (const lead of leads) {
    const valor = obtenerRespuestasLead(lead)?.[pregunta];
    if (typeof valor !== "string" || !valor.trim()) continue;
    conteo.set(valor, (conteo.get(valor) ?? 0) + 1);
  }
  return [...conteo.entries()]
    .map(([label, count]) => ({ label, count, monto: parseMonto(label) }))
    .sort((a, b) => {
      if (a.monto === null && b.monto === null) return b.count - a.count;
      if (a.monto === null) return 1;
      if (b.monto === null) return -1;
      return b.monto - a.monto;
    });
}

// Respuestas que cuentan como calificadas según el criterio. Para "top", se toma el
// N-ésimo monto distinto como corte: los empates de ese monto entran todos.
export function respuestasCalificadas(criterio: CriterioLeads, respuestas: RespuestaPregunta[]): Set<string> {
  if (criterio.modo === "manual") return new Set(criterio.respuestas);
  const conMonto = respuestas.filter((r): r is RespuestaPregunta & { monto: number } => r.monto !== null);
  if (criterio.modo === "minimo") {
    return new Set(conMonto.filter((r) => r.monto >= criterio.minimo).map((r) => r.label));
  }
  const montosDistintos = [...new Set(conMonto.map((r) => r.monto))].sort((a, b) => b - a);
  if (montosDistintos.length === 0) return new Set();
  const corte = montosDistintos[Math.min(criterio.n, montosDistintos.length) - 1];
  return new Set(conMonto.filter((r) => r.monto >= corte).map((r) => r.label));
}

// Cruza los leads con los anuncios por utm_content (id del anuncio).
export function calcularLeadsPorAnuncio(
  anuncios: MetaAdRow[],
  leads: V3Lead[],
  criterio: CriterioLeads | null,
  calificadas: Set<string>
): AnuncioAnalisis[] {
  const porAnuncio = new Map<string, { total: number; calificados: number }>();
  for (const lead of leads) {
    const adId = lead.utm_content?.trim();
    if (!adId) continue;
    const acum = porAnuncio.get(adId) ?? { total: 0, calificados: 0 };
    acum.total += 1;
    const valor = criterio ? obtenerRespuestasLead(lead)?.[criterio.pregunta] : undefined;
    if (typeof valor === "string" && calificadas.has(valor)) acum.calificados += 1;
    porAnuncio.set(adId, acum);
  }
  return anuncios.map((ad) => {
    const acum = porAnuncio.get(ad.ad_id) ?? { total: 0, calificados: 0 };
    return {
      ...ad,
      leadsTotal: acum.total,
      leadsCalificados: acum.calificados,
      pctCalificados: criterio && acum.total > 0 ? (acum.calificados / acum.total) * 100 : null,
    };
  });
}

// Preguntas que aparecen en las respuestas reales del dashboard. Si la pregunta es
// de las fijas de la encuesta usa su texto; si no, muestra la clave tal cual.
export function preguntasDisponibles(leads: V3Lead[]): { clave: string; texto: string }[] {
  const claves = new Set<string>();
  for (const lead of leads) {
    const r = obtenerRespuestasLead(lead);
    if (r) Object.keys(r).forEach((k) => claves.add(k));
  }
  return [...claves].map((clave) => ({
    clave,
    texto: ENCUESTA_PREGUNTAS.find((p) => p.clave === clave)?.pregunta ?? clave,
  }));
}
