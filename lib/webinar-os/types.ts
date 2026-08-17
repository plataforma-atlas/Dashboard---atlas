// Forma exacta de cada fila que devuelve el webhook "webinars-os" de n8n
export type WebinarSummary = {
  id: number;
  cliente_id: string;
  campaign_id: number | null;
  country: string;
  label: string;
  webinar_date: string;
  sort_order: number;
};

export type PublicidadMetrics = { inversion?: number; leads?: number; cpl?: number; impresiones?: number; alcance?: number };
export type LandingMetrics = { visitas?: number; leads?: number; tasa_conversion?: number };
export type GraciasMetrics = { visitas?: number; confirmados?: number; tasa_confirmacion?: number };
export type NivelatorioSesion = { sesion: number; asistentes: number };
export type NivelatoriosMetrics = { sesiones?: NivelatorioSesion[]; asistencia_promedio?: number; llegaron?: number; vieron_3?: number };
export type RetencionPunto = { minuto: number; porcentaje: number };
export type WebinarMetrics_ = {
  registrados?: number;
  asistentes_en_vivo?: number;
  tiempo_promedio_min?: number;
  tasa_asistencia?: number;
  retencion?: RetencionPunto[];
};
export type OfertaMetrics = { clics_oferta?: number; checkout_iniciado?: number; tasa_conversion?: number; llegaron_pitch?: number };
export type GestionComercialMetrics = { leads_contactados?: number; llamadas_agendadas?: number; llamadas_realizadas?: number };
export type VentasMetrics = { ventas?: number; ingresos?: number; ticket_promedio?: number };
export type DownsellMetrics = { ofrecidos?: number; aceptados?: number; ingresos?: number };
export type RecuperacionMetrics = { contactados?: number; recuperados?: number; ingresos?: number };
export type ResultadosMetrics = { inversion_total?: number; ingresos_totales?: number; roas?: number; roi?: number };

export type WebinarMetrics = {
  publicidad: PublicidadMetrics;
  landing: LandingMetrics;
  gracias: GraciasMetrics;
  nivelatorios: NivelatoriosMetrics;
  webinar: WebinarMetrics_;
  oferta: OfertaMetrics;
  gestion_comercial: GestionComercialMetrics;
  ventas: VentasMetrics;
  downsell: DownsellMetrics;
  recuperacion: RecuperacionMetrics;
  resultados: ResultadosMetrics;
};

export type MetaAdsEntry = {
  id: number;
  entry_date: string;
  spend: string;
  scroll_stop_rate: string | null;
  ctr: string | null;
  cpm: string | null;
  cpc: string | null;
  cpl: string | null;
  frequency: string | null;
};

// Forma exacta de la respuesta del webhook "webinar-os-detalle" cuando el webinar existe
export type WebinarDetail = {
  webinar: WebinarSummary;
  metrics: WebinarMetrics;
  meta_ads: MetaAdsEntry[];
};
