export type CarteraCliente = {
  cliente_id: string;
  cliente_name: string;
  facturacion_bruta: number;
  facturacion_neta: number;
  inversion: number;
  ventas: number;
  registros: number;
  asistentes: number | null;
  roas_bruto: number | null;
  roas_neto: number | null;
  registro_a_venta: number | null;
  estado: "Escalar" | "Estable" | "Revisar" | "Atención" | "Sin datos de inversión";
};

export function estadoBadgeClass(estado: CarteraCliente["estado"]) {
  if (estado === "Escalar") return "text-success bg-success-container border-outline-success";
  if (estado === "Estable") return "text-primary bg-[var(--wos-primary-soft)] border-[var(--wos-primary)]";
  if (estado === "Revisar") return "text-warning bg-warning-container border-outline-warning";
  if (estado === "Atención") return "text-error bg-error-container border-outline-error";
  return "text-[var(--wos-ink-faint)] bg-[var(--wos-surface-alt)] border-[var(--wos-border)]";
}

/** Prioridad alta: el estado más urgente primero (Atención > Revisar > Estable > Escalar > Sin datos). */
export function ordenPrioridad(cartera: CarteraCliente[]): CarteraCliente[] {
  const rango: Record<CarteraCliente["estado"], number> = {
    "Atención": 0,
    Revisar: 1,
    Estable: 2,
    Escalar: 3,
    "Sin datos de inversión": 4,
  };
  return [...cartera].sort((a, b) => rango[a.estado] - rango[b.estado]);
}

export function clienteConMayorFacturacion(cartera: CarteraCliente[]): CarteraCliente | null {
  if (cartera.length === 0) return null;
  return cartera.reduce((max, c) => (c.facturacion_bruta > max.facturacion_bruta ? c : max), cartera[0]);
}

export function clienteConMayorOportunidad(cartera: CarteraCliente[]): CarteraCliente | null {
  const conRoas = cartera.filter((c) => c.roas_neto !== null);
  if (conRoas.length === 0) return null;
  return conRoas.reduce((max, c) => (c.roas_neto! > max.roas_neto! ? c : max), conRoas[0]);
}
