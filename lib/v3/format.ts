// formatMoney (lib/webinar-os/aggregate.ts) fuerza USD — las ventas de Hotmart
// traen su propia moneda real (extra.moneda), así que acá formateamos con esa.
export function formatMoneyEnMoneda(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("es-CO")}`;
  }
}
