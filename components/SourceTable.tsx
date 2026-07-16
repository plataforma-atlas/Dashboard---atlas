import { SourceRow } from "@/lib/types";

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function SourceTable({ data }: { data: SourceRow[] }) {
  const maxIngresos = Math.max(1, ...data.map((d) => d.ingresos));

  return (
    <div className="rounded-lg border border-stroke bg-panel p-5 md:p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-lg text-ink">Ingresos por fuente (UTM)</h2>
        <span className="text-[11px] uppercase tracking-[0.14em] text-faint font-mono">
          {data.length} fuentes
        </span>
      </div>

      <div className="flex flex-col">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 pb-2 border-b border-stroke text-[11px] uppercase tracking-[0.1em] text-faint">
          <span>Fuente</span>
          <span className="text-right">Registros</span>
          <span className="text-right">Ingresos</span>
        </div>
        {data.map((row) => (
          <div key={row.source} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center py-2.5 border-b border-stroke/50 last:border-0">
            <div>
              <span className="text-sm text-ink">{row.source}</span>
              <div className="h-1 mt-1.5 rounded-full bg-hull overflow-hidden">
                <div
                  className="h-full bg-go rounded-full"
                  style={{ width: `${Math.max(3, (row.ingresos / maxIngresos) * 100)}%` }}
                />
              </div>
            </div>
            <span className="font-mono text-sm text-mute tabular text-right">
              {row.leads.toLocaleString("es-CO")}
            </span>
            <span className="font-mono text-sm text-go tabular text-right">{formatMoney(row.ingresos)}</span>
          </div>
        ))}
        {data.length === 0 && <p className="text-sm text-mute py-4">Sin datos para el filtro actual.</p>}
      </div>
    </div>
  );
}
