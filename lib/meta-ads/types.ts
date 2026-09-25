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

export type MetaAdsResponse =
  | { conectado: true; campanas: MetaCampaignRow[]; conjuntos: MetaAdsetRow[]; anuncios: MetaAdRow[] }
  | { conectado: false };
