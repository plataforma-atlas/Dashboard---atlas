export type EventoKpis = {
  registros: number;
  checkins: number;
  ventas: number;
  capitalVendido: number;
  conversionRegistroVenta: number | null;
  conversionCheckin: number | null;
};

export type EventoAngleStat = {
  campaignId: number;
  campaignName: string;
  registros: number;
  checkins: number;
  ventas: number;
  conversionRegistroVenta: number | null;
};
