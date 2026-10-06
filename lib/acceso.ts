export const TIPOS_ACCESO = ["vitalicio", "prueba_7", "demo_15"] as const;
export type TipoAcceso = (typeof TIPOS_ACCESO)[number];

const DIAS_POR_TIPO: Record<TipoAcceso, number | null> = {
  vitalicio: null,
  prueba_7: 7,
  demo_15: 15,
};

export function esTipoAcceso(valor: string): valor is TipoAcceso {
  return (TIPOS_ACCESO as readonly string[]).includes(valor);
}

// Devuelve el timestamp de vencimiento para el tipo dado ("" = sin vencimiento).
export function vencimientoParaTipo(tipo: TipoAcceso): string {
  const dias = DIAS_POR_TIPO[tipo];
  return dias === null ? "" : new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();
}
