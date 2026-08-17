import { toExecutiveSummaryKpis } from "@/lib/webinar-os/aggregate";
import { WebinarMetrics } from "@/lib/webinar-os/types";

const MODULE_DOT_COLOR: Partial<Record<keyof WebinarMetrics, string>> = {
  publicidad: "bg-amber-500",
  landing: "bg-emerald-500",
  gracias: "bg-emerald-500",
  nivelatorios: "bg-[var(--wos-ink-faint)]",
  webinar: "bg-emerald-500",
  oferta: "bg-[var(--wos-ink-faint)]",
  ventas: "bg-blue-500",
  resultados: "bg-[var(--wos-ink-faint)]",
};

export default function ExecutiveSummaryKpis({
  metrics,
  real,
}: {
  metrics: WebinarMetrics;
  real: { totalLeads: number; totalIngresos: number };
}) {
  const kpis = toExecutiveSummaryKpis(metrics, real);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="rounded-xl border border-[var(--wos-border)] bg-[var(--wos-surface)] shadow-[var(--wos-shadow)] px-4 py-3.5"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--wos-ink-muted)] font-medium truncate">{kpi.label}</span>
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${MODULE_DOT_COLOR[kpi.module] ?? "bg-[var(--wos-ink-faint)]"}`} />
          </div>
          <div className="text-xl font-semibold text-[var(--wos-ink)] tabular-nums mb-0.5">{kpi.value}</div>
          <div className="text-[11px] text-[var(--wos-ink-faint)]">{kpi.sublabel}</div>
        </div>
      ))}
    </div>
  );
}
