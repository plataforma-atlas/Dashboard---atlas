import { toNivelatoriosSeries, formatNumber, formatPercent } from "@/lib/webinar-os/aggregate";
import { WebinarMetrics } from "@/lib/webinar-os/types";
import ModuleShell from "./ModuleShell";

export default function NivelatoriosStaggeredBars({ metrics }: { metrics: WebinarMetrics["nivelatorios"] }) {
  const sesiones = toNivelatoriosSeries(metrics);
  const max = Math.max(1, ...sesiones.map((s) => s.asistentes ?? 0));

  return (
    <ModuleShell icon="📈" title="Nivelatorios">
      <div className="flex items-end gap-4 h-40 mb-4">
        {sesiones.map((s) => {
          const heightPct = s.asistentes === undefined ? 0 : Math.max(4, (s.asistentes / max) * 100);
          return (
            <div key={s.sesion} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
              <span className="text-xs font-mono text-[var(--wos-ink-muted)] tabular-nums">{formatNumber(s.asistentes)}</span>
              <div className="w-full rounded-t-md bg-[var(--wos-primary)] transition-all" style={{ height: `${heightPct}%`, minHeight: 4 }} />
              <span className="text-xs text-[var(--wos-ink-faint)]">Sesión {s.sesion}</span>
            </div>
          );
        })}
      </div>
      <div className="pt-4 border-t border-[var(--wos-border)] flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-[0.08em] text-[var(--wos-ink-muted)] font-medium">Asistencia promedio</span>
        <span className="text-sm font-mono text-[var(--wos-ink)] tabular-nums">{formatPercent(metrics.asistencia_promedio)}</span>
      </div>
    </ModuleShell>
  );
}
