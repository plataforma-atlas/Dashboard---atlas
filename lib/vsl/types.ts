export type VslDailyRow = {
  date: string;
  registros: number;
  depositos: number;
  capitalDepositado: number;
};

// Todo lo marcado como `number | null` es real cuando no es null; null significa que
// esa fuente de datos (inversión publicitaria, tracking de clics a la oferta, tracking
// de reproducción del VSL) todavía no existe — se muestra "—", nunca se fabrica.
export type VslKpis = {
  registros: number;
  depositos: number;
  capitalDepositado: number;
  ticketPromedioDepositado: number | null;
  conversionRegistroDeposito: number | null;
  inversion: number | null;
  clicsOferta: number | null;
  ctrOferta: number | null;
  costoClicOferta: number | null;
  costoPorDepositante: number | null;
  inicioVsl: number | null;
};

export type VslFunnelStage = { label: string; value: number | null };
