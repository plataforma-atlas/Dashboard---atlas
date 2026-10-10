import { formatMoney, formatNumber, formatPercent } from "@/lib/webinar-os/aggregate";

// Fila de las tablas del Administrador de Anuncios (campañas, conjuntos y anuncios).
// Las métricas de venta solo existen a nivel anuncio; en campañas y conjuntos quedan
// undefined y se muestran como "—".
export type FilaTabla = {
  id: string;
  nombre: string;
  subtitulo?: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  link_clicks?: number;
  ctr: number;
  cpm: number;
  cpc?: number;
  leads: number;
  ventas?: number;
  roas?: number;
  cpa?: number;
  // Cantidad de leads que cumplen cada conversión personalizada, por "conv:<id>".
  conversiones?: Record<string, number>;
  // Métricas de video de VTurb cruzadas por UTM contra este anuncio — ausente
  // si el dashboard no tiene VTurb configurado, o si este anuncio en
  // particular no tuvo ninguna sesión de video en el período.
  vturb?: {
    clicsBoton: number;
    playRate: number | null;
    audienciaPitch: number | null;
    primerMinuto: number | null;
  };
};

export type ColumnaBase =
  | "gasto"
  | "impresiones"
  | "clics"
  | "clics_enlace"
  | "ctr"
  | "cpm"
  | "cpc"
  | "leads"
  | "ventas"
  | "roas"
  | "cpa"
  | "vturb_clics_boton"
  | "vturb_play_rate"
  | "vturb_audiencia_pitch"
  | "vturb_primer_minuto";

// Las conversiones personalizadas se identifican por su id: "conv:12".
export type ColumnaKey = ColumnaBase | `conv:${number}`;

export type CategoriaColumna = "Tráfico" | "Conversión" | "Conversiones personalizadas" | "VTurb";

export type DefColumna = {
  key: ColumnaKey;
  label: string;
  categoria: CategoriaColumna;
  formatear: (f: FilaTabla) => string;
};

const SIN_DATO = "—";

// Sin ventas no hay ROAS ni CPA reales: se muestra "—" en vez de 0.
const sinVentas = (f: FilaTabla) => !f.ventas && !f.roas;

export const COLUMNAS: DefColumna[] = [
  { key: "gasto", label: "Gasto", categoria: "Tráfico", formatear: (f) => formatMoney(f.spend) },
  { key: "impresiones", label: "Impresiones", categoria: "Tráfico", formatear: (f) => formatNumber(f.impressions) },
  { key: "clics", label: "Clics", categoria: "Tráfico", formatear: (f) => formatNumber(f.clicks) },
  {
    key: "clics_enlace",
    label: "Clics en enlace",
    categoria: "Tráfico",
    formatear: (f) => (f.link_clicks === undefined ? SIN_DATO : formatNumber(f.link_clicks)),
  },
  { key: "ctr", label: "CTR", categoria: "Tráfico", formatear: (f) => formatPercent(f.ctr) },
  { key: "cpm", label: "CPM", categoria: "Tráfico", formatear: (f) => formatMoney(f.cpm) },
  {
    key: "cpc",
    label: "CPC",
    categoria: "Tráfico",
    formatear: (f) => (f.cpc === undefined ? SIN_DATO : formatMoney(f.cpc)),
  },
  { key: "leads", label: "Leads (Meta)", categoria: "Conversión", formatear: (f) => formatNumber(f.leads) },
  {
    key: "ventas",
    label: "Ventas",
    categoria: "Conversión",
    formatear: (f) => (f.ventas === undefined || sinVentas(f) ? SIN_DATO : formatNumber(f.ventas)),
  },
  {
    key: "roas",
    label: "ROAS",
    categoria: "Conversión",
    formatear: (f) => (f.roas === undefined || sinVentas(f) ? SIN_DATO : `${f.roas.toFixed(2)}x`),
  },
  {
    key: "cpa",
    label: "CPA",
    categoria: "Conversión",
    formatear: (f) => (f.cpa === undefined || sinVentas(f) ? SIN_DATO : formatMoney(f.cpa)),
  },
  {
    key: "vturb_clics_boton",
    label: "Clics en botón (VTurb)",
    categoria: "VTurb",
    formatear: (f) => (f.vturb === undefined ? SIN_DATO : formatNumber(f.vturb.clicsBoton)),
  },
  {
    key: "vturb_play_rate",
    label: "Play rate (VTurb)",
    categoria: "VTurb",
    formatear: (f) => (f.vturb?.playRate == null ? SIN_DATO : formatPercent(f.vturb.playRate)),
  },
  {
    key: "vturb_audiencia_pitch",
    label: "Audiencia en el pitch (VTurb)",
    categoria: "VTurb",
    formatear: (f) => (f.vturb?.audienciaPitch == null ? SIN_DATO : formatPercent(f.vturb.audienciaPitch)),
  },
  {
    key: "vturb_primer_minuto",
    label: "Primer minuto (VTurb)",
    categoria: "VTurb",
    formatear: (f) => (f.vturb?.primerMinuto == null ? SIN_DATO : formatPercent(f.vturb.primerMinuto)),
  },
];

// Una columna por cada conversión personalizada del cliente.
export function columnasDeConversiones(conversiones: { id: number; nombre: string }[]): DefColumna[] {
  return conversiones.map((c) => {
    const key: ColumnaKey = `conv:${c.id}`;
    return {
      key,
      label: c.nombre,
      categoria: "Conversiones personalizadas",
      formatear: (f) => {
        const valor = f.conversiones?.[key];
        return valor === undefined ? SIN_DATO : formatNumber(valor);
      },
    };
  });
}

export const COLUMNAS_POR_DEFECTO: ColumnaKey[] = ["gasto", "impresiones", "clics", "ctr", "cpm", "leads"];

const CLAVES_BASE = new Set<string>(COLUMNAS.map((c) => c.key));
const MAXIMO_COLUMNAS = 12;

// Lo que se guarda en el navegador puede venir alterado: solo se aceptan claves
// conocidas o conversiones con id numérico.
export function sanitizarColumnas(raw: unknown): ColumnaKey[] {
  if (!Array.isArray(raw)) return COLUMNAS_POR_DEFECTO;
  const aceptadas = raw.filter(
    (k): k is ColumnaKey => typeof k === "string" && (CLAVES_BASE.has(k) || /^conv:\d+$/.test(k))
  );
  const limpias = [...new Set(aceptadas)].slice(0, MAXIMO_COLUMNAS);
  return limpias.length > 0 ? limpias : COLUMNAS_POR_DEFECTO;
}

export function columnaDef(key: ColumnaKey, definiciones: DefColumna[]): DefColumna | undefined {
  return definiciones.find((c) => c.key === key);
}
