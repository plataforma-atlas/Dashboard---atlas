import { WebinarMetrics } from "./types";

export type FieldFormat = "number" | "money" | "percent" | "decimal";

export type ModuleFieldConfig = { key: string; label: string; format: FieldFormat; variant?: "gauge"; gaugeMax?: number };

export type ModuleConfig = {
  key: keyof WebinarMetrics;
  title: string;
  icon: string;
  fields: ModuleFieldConfig[];
};

// Orden completo de los 11 módulos del funnel, tal como se muestran en la página
export const MODULE_ORDER: (keyof WebinarMetrics)[] = [
  "publicidad",
  "landing",
  "gracias",
  "nivelatorios",
  "webinar",
  "oferta",
  "gestion_comercial",
  "ventas",
  "downsell",
  "recuperacion",
  "resultados",
];

// Los 7 módulos "solo-KPIs" — renderizados por el componente genérico KpiModuleSection.
// landing, oferta (FunnelBars), nivelatorios (NivelatoriosStaggeredBars) y webinar (WebinarRetentionChart)
// tienen su propio componente bespoke y no están aquí.
export const KPI_MODULE_CONFIGS: Partial<Record<keyof WebinarMetrics, ModuleConfig>> = {
  publicidad: {
    key: "publicidad",
    title: "Publicidad",
    icon: "📣",
    fields: [
      { key: "inversion", label: "Inversión", format: "money" },
      { key: "impresiones", label: "Impresiones", format: "number" },
      { key: "alcance", label: "Alcance", format: "number" },
      { key: "leads", label: "Leads generados", format: "number" },
      { key: "cpl", label: "CPL", format: "money" },
    ],
  },
  gracias: {
    key: "gracias",
    title: "Página de Gracias",
    icon: "🙏",
    fields: [
      { key: "visitas", label: "Visitas", format: "number" },
      { key: "confirmados", label: "Confirmados", format: "number" },
      { key: "tasa_confirmacion", label: "Tasa de confirmación", format: "percent" },
    ],
  },
  gestion_comercial: {
    key: "gestion_comercial",
    title: "Gestión Comercial",
    icon: "📞",
    fields: [
      { key: "leads_contactados", label: "Leads contactados", format: "number" },
      { key: "llamadas_agendadas", label: "Llamadas agendadas", format: "number" },
      { key: "llamadas_realizadas", label: "Llamadas realizadas", format: "number" },
    ],
  },
  ventas: {
    key: "ventas",
    title: "Ventas",
    icon: "💳",
    fields: [
      { key: "ventas", label: "Ventas", format: "number" },
      { key: "ingresos", label: "Ingresos", format: "money" },
      { key: "ticket_promedio", label: "Ticket promedio", format: "money" },
    ],
  },
  downsell: {
    key: "downsell",
    title: "Downsell",
    icon: "🔻",
    fields: [
      { key: "ofrecidos", label: "Ofrecidos", format: "number" },
      { key: "aceptados", label: "Aceptados", format: "number" },
      { key: "ingresos", label: "Ingresos", format: "money" },
    ],
  },
  recuperacion: {
    key: "recuperacion",
    title: "Recuperación",
    icon: "♻️",
    fields: [
      { key: "contactados", label: "Contactados", format: "number" },
      { key: "recuperados", label: "Recuperados", format: "number" },
      { key: "ingresos", label: "Ingresos", format: "money" },
    ],
  },
  resultados: {
    key: "resultados",
    title: "Resultados Finales",
    icon: "🏁",
    fields: [
      { key: "inversion_total", label: "Inversión total", format: "money" },
      { key: "ingresos_totales", label: "Ingresos totales", format: "money" },
      { key: "roas", label: "ROAS", format: "decimal", variant: "gauge", gaugeMax: 10 },
      { key: "roi", label: "ROI", format: "percent", variant: "gauge", gaugeMax: 200 },
    ],
  },
};

// Etapas del funnel ejecutivo — un resumen de alto nivel que atraviesa varios módulos.
// "Leads" y "Ventas" se sobreescriben con datos reales (funnel_events) cuando están
// disponibles; las 4 etapas intermedias vienen de webinar_metrics (granular, "—" hasta
// que se cargue esa data).
export const EXECUTIVE_FUNNEL_STAGES: { label: string; module: keyof WebinarMetrics; field: string }[] = [
  { label: "Leads", module: "landing", field: "leads" },
  { label: "Ingresó a WhatsApp", module: "gracias", field: "confirmados" },
  { label: "Llegó a Nivelatorios", module: "nivelatorios", field: "llegaron" },
  { label: "Asistió al Webinar", module: "webinar", field: "asistentes_en_vivo" },
  { label: "Llegó al Pitch", module: "oferta", field: "llegaron_pitch" },
  { label: "Ventas", module: "ventas", field: "ventas" },
];

// Los 10 KPIs del resumen ejecutivo — cada uno apunta al campo granular del que sale,
// más el módulo al que pertenece (para el punto de color junto al valor).
export const EXECUTIVE_SUMMARY_KPIS: { label: string; sublabel: string; module: keyof WebinarMetrics; format: FieldFormat; compute: (m: WebinarMetrics, real: { totalLeads: number; totalIngresos: number }) => number | null }[] = [
  { label: "CPL", sublabel: "Publicidad", module: "publicidad", format: "money", compute: (m) => m.publicidad.cpl ?? null },
  { label: "Conv. Landing → Lead", sublabel: "Landing", module: "landing", format: "percent", compute: (m) => m.landing.tasa_conversion ?? null },
  { label: "% Ingreso al grupo", sublabel: "Página de gracias", module: "gracias", format: "percent", compute: (m) => m.gracias.tasa_confirmacion ?? null },
  { label: "% Vieron 3 Nivelatorios", sublabel: "Nivelatorios", module: "nivelatorios", format: "percent", compute: (m) => m.nivelatorios.vieron_3 ?? null },
  { label: "Show Rate", sublabel: "Webinar", module: "webinar", format: "percent", compute: (m) => m.webinar.tasa_asistencia ?? null },
  { label: "Retención hasta pitch", sublabel: "Webinar", module: "webinar", format: "percent", compute: (m) => (m.webinar.asistentes_en_vivo && m.oferta.llegaron_pitch ? (m.oferta.llegaron_pitch / m.webinar.asistentes_en_vivo) * 100 : null) },
  { label: "Conversión checkout", sublabel: "Oferta", module: "oferta", format: "percent", compute: (m) => m.oferta.tasa_conversion ?? null },
  { label: "Facturación", sublabel: "Ventas", module: "ventas", format: "money", compute: (m, real) => (m.ventas.ingresos ?? (real.totalIngresos || null)) },
  { label: "ROAS", sublabel: "Ventas", module: "resultados", format: "decimal", compute: (m) => m.resultados.roas ?? null },
  { label: "CAC", sublabel: "Ventas", module: "resultados", format: "money", compute: (m) => (m.resultados.inversion_total && m.ventas.ventas ? m.resultados.inversion_total / m.ventas.ventas : null) },
];
