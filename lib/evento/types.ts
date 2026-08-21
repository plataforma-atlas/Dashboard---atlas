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

// Fila real del webhook "Resumen Pagos" — desglose por tier de la etapa "Confirmación".
export type EventoTierRow = { tier: string; total: number; ingresos: string };
