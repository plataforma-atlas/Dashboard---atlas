export type EventoKpis = {
  registros: number;
  llegaronWp: number;
  checkins: number;
  confirmados: number;
  capitalVendido: number;
  conversionWp: number | null;
  conversionConfirmado: number | null;
  conversionCheckin: number | null;
};

export type EventoAngleStat = {
  campaignId: number;
  campaignName: string;
  registros: number;
  llegaronWp: number;
  checkins: number;
  confirmados: number;
  conversionConfirmado: number | null;
};

// Clasificación tibio/frío según el origen del ángulo: campañas "orgánica" (redes propias
// de los expertos) cuentan como tibio; el resto (pauta paga: estructura/operativa/etc.) como frío.
export type EventoTemperaturaRow = { temperatura: "Tráfico Tibio" | "Tráfico Frío"; registros: number };

// Combina el gasto de pauta consolidado (leads pagos + CPL) con los registros orgánicos
// del mismo día, para la gráfica combinada de barras + línea de CPL.
export type EventoDailyTraficoRow = {
  entry_date: string;
  leadsPauta: number;
  leadsOrganico: number;
  cpl: number | null;
};

// Fila real del webhook "Resumen Pagos" — desglose por tier de la etapa "Confirmación".
export type EventoTierRow = { tier: string; total: number; ingresos: string };

// Fila real del webhook "Ver Gasto por Ángulo" — una fila por campaña + fecha con pauta activa.
export type EventoAdSpendRow = {
  campaign_id: number;
  campaign_name: string;
  slug: string;
  entry_date: string;
  spend: string | number;
  clicks: string | number;
  impressions: string | number;
  ctr: string | number;
  cpm: string | number;
  cpc: string | number;
  unique_link_clicks: string | number;
  reach: string | number;
  unique_ctr: string | number;
  leads: string | number;
  whatsapp: string | number;
};

// Fila real del webhook "Ver Gasto Consolidado" — todas las campañas con pauta combinadas por fecha.
export type EventoAdSpendConsolidatedRow = {
  entry_date: string;
  spend: string | number;
  clicks: string | number;
  impressions: string | number;
  unique_link_clicks: string | number;
  reach: string | number;
  leads: string | number;
  whatsapp: string | number;
};

// Fila real del webhook "Ver Rendimiento por Anuncio" — una fila por conjunto de anuncios + anuncio + fecha.
export type EventoAdPerformanceRow = {
  adset_name: string;
  ad_name: string;
  campaign_name: string;
  entry_date: string;
  spend: string | number;
  clicks: string | number;
  impressions: string | number;
  unique_link_clicks: string | number;
  reach: string | number;
  leads: string | number;
};
