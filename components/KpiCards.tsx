type Props = { totalLeads: number; totalIngresos: number; conversionGlobal: number; ticketPromedio: number };

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function Card({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: "primary" | "secondary" }) {
  return (
    <div className="rounded-lg border border-outline bg-surface px-5 py-4 flex flex-col gap-1">
      <span className="text-xs uppercase tracking-[0.14em] text-on-surface-faint font-medium">{label}</span>
      <span
        className={`font-mono tabular text-2xl md:text-3xl font-semibold ${
          accent === "primary" ? "text-primary" : accent === "secondary" ? "text-secondary" : "text-on-surface"
        }`}
      >
        {value}
      </span>
      {sub && <span className="text-[13px] text-on-surface-variant">{sub}</span>}
    </div>
  );
}

export default function KpiCards({ totalLeads, totalIngresos, conversionGlobal, ticketPromedio }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card label="Registros totales" value={totalLeads.toLocaleString("es-CO")} accent="primary" />
      <Card label="Ingresos totales" value={formatMoney(totalIngresos)} accent="secondary" />
      <Card label="Conversión global" value={`${conversionGlobal.toFixed(1)}%`} sub="Registro → cualquier compra" />
      <Card label="Ticket promedio" value={formatMoney(ticketPromedio)} sub="Por transacción" />
    </div>
  );
}
