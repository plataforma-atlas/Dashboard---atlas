// Forma exacta de cada fila que devuelve el query de n8n (nodo "Consulta BD *Query")
export type FunnelRow = {
  sort_order: number;
  stagename: string; // ojo: Postgres devuelve minúsculas si no se usa alias con comillas
  utm_source: string | null;
  country: string | null;
  total_leads: string; // Postgres devuelve numeric/bigint como string en JSON
  total_ingresos: string;
};

export type StageSummary = {
  sort_order: number;
  stage: string;
  leads: number;
  ingresos: number;
  dropFromPrev: number | null; // % de caída respecto a la etapa anterior
};

export type CountryRow = {
  country: string;
  leads: number;
};

export type SourceRow = {
  source: string;
  leads: number;
  ingresos: number;
};

export type FunnelFilters = {
  fecha_inicio?: string;
  fecha_fin?: string;
  pais?: string;
};
