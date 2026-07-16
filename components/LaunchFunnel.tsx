import { StageSummary } from "@/lib/types";

function formatMoney(n: number) {
  if (n === 0) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function LaunchFunnel({ stages }: { stages: StageSummary[] }) {
  const max = Math.max(1, ...stages.map((s) => s.leads));

  return (
    <div className="rounded-lg border border-stroke bg-panel p-5 md:p-6">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="font-display text-lg text-ink">Secuencia de lanzamiento</h2>
        <span className="text-[11px] uppercase tracking-[0.14em] text-faint font-mono">
          {stages.length} etapas registradas
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {stages.map((s, i) => {
          const widthPct = Math.max(4, (s.leads / max) * 100);
          const isFirst = i === 0;
          return (
            <div key={s.sort_order} className="flex items-center gap-4">
              <div className="w-6 shrink-0 text-right font-mono text-xs text-faint tabular">
                {String(s.sort_order).padStart(2, "0")}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between mb-1.5 gap-2">
                  <span className="text-sm text-ink font-medium truncate">{s.stage}</span>
                  <div className="flex items-baseline gap-3 shrink-0">
                    {s.dropFromPrev !== null && (
                      <span className="text-xs font-mono text-mute tabular">
                        {s.dropFromPrev.toFixed(1)}%
                      </span>
                    )}
                    {s.ingresos > 0 && (
                      <span className="text-xs font-mono text-go tabular">{formatMoney(s.ingresos)}</span>
                    )}
                    <span className="text-sm font-mono text-signal tabular w-14 text-right">
                      {s.leads.toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-hull border border-stroke overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isFirst ? "bg-signal" : s.ingresos > 0 ? "bg-go" : "bg-signal/70"
                    }`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
