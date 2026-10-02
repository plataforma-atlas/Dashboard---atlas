// Fila real devuelta por el webhook "Integraciones — Pull Meta Ads (Cliente)"
// (n8n), a nivel de campaña — spend/impresiones/clics vienen de la Graph API
// de Meta, "leads" es lo que Meta reporta vía su array `actions` (no confundir
// con las ventas reales de Vermetricas, que vienen del funnel propio).
export type MetaCampaignRow = {
  campaign_id: string;
  campaign_name: string;
  spend: number;
  impressions: number;
  clicks: number;
  // "Clics en el enlace" (Meta: inline_link_clicks) — a diferencia de `clicks`
  // (todo clic sobre el anuncio, incluye likes/comentarios/etc.), esto es lo
  // que de verdad llevó a alguien a la página de destino. Usado por "Páginas
  // de testeo" (lib/v3/embudo.ts) como proxy de "visitas" cuando un punto de
  // captación está vinculado a esta campaña/conjunto/anuncio.
  link_clicks: number;
  ctr: number;
  cpm: number;
  cpc: number;
  leads: number;
  status: string;
  ad_account_id: string;
  ad_account_label: string;
};

// Misma fuente, a nivel de conjunto de anuncios (adset) — entre campaña y anuncio.
export type MetaAdsetRow = {
  adset_id: string;
  adset_name: string;
  campaign_id: string;
  campaign_name: string;
  spend: number;
  impressions: number;
  clicks: number;
  link_clicks: number;
  ctr: number;
  cpm: number;
  cpc: number;
  leads: number;
  status: string;
  ad_account_id: string;
  ad_account_label: string;
};

// Misma fuente, a nivel de anuncio individual. roas/ventas/cpa dependen de que
// la cuenta tenga tracking de compra configurado en Meta (pixel/CAPI) — si no
// lo tiene, Meta simplemente no reporta esas conversiones y quedan en 0.
export type MetaAdRow = {
  ad_id: string;
  ad_name: string;
  adset_id: string;
  adset_name: string;
  campaign_id: string;
  campaign_name: string;
  spend: number;
  impressions: number;
  clicks: number;
  link_clicks: number;
  ctr: number;
  cpm: number;
  leads: number;
  ventas: number;
  roas: number;
  cpa: number;
  thumbnail_url: string;
  status: string;
  ad_account_id: string;
  ad_account_label: string;
};

// Inversión/impresiones/clics por día, sumados entre todas las campañas que
// matchean la nomenclatura — siempre últimos 30 días (misma ventana fija que
// usa el resto del pull), independiente del filtro de fecha de la V3.
export type MetaDiarioRow = {
  fecha: string;
  inversion: number;
  impresiones: number;
  clics: number;
};

export type MetaAdsResponse =
  | { conectado: true; campanas: MetaCampaignRow[]; conjuntos: MetaAdsetRow[]; anuncios: MetaAdRow[]; diario: MetaDiarioRow[] }
  | { conectado: false };
