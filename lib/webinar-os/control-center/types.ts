import { Estado } from "@/lib/webinar-os/cartera";

export type CampanaCartera = {
  campaign_id: number;
  campaign_name: string;
  facturacion_bruta: number;
  facturacion_neta: number;
  inversion: number;
  ventas: number;
  registros: number;
  asistentes: number | null;
  roas_bruto: number | null;
  roas_neto: number | null;
  registro_a_venta: number | null;
  ticket_promedio: number | null;
  cac: number | null;
  estado: Estado;
};
