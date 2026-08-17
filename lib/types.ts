// Forma exacta de cada fila que devuelve el webhook "Calcular Embudo" de n8n
export type FunnelRow = {
  sort_order: number;
  stagename: string;
  utm_source: string | null;
  country: string | null;
  event_date: string | null;
  total_leads: string;
  total_ingresos: string;
};

export type DailyPoint = { date: string; sort_order: number; stage: string; leads: number; ingresos: number };

export type StageSummary = {
  sort_order: number;
  stage: string;
  leads: number;
  ingresos: number;
  dropFromPrev: number | null;
};

export type CountryRow = { country: string; leads: number };
export type SourceRow = { source: string; leads: number; ingresos: number };

export type Campaign = {
  id: number;
  cliente_id: string;
  name: string;
  strategy_type: "lanzamiento" | "webinar_automatizado" | "vsl" | "evento_presencial";
  status: "draft" | "active" | "paused" | "archived";
  slug: string | null;
};
