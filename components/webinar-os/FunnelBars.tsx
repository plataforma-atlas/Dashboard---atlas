import { FunnelBarStage, formatNumber, formatPercent } from "@/lib/webinar-os/aggregate";

export default function FunnelBars({ stages }: { stages: FunnelBarStage[] }) {
  const max = Math.max(1, ...stages.map((s) => s.value ?? 0));

  return (
    <div className="flex flex-col gap-3">
      {stages.map((s, i) => {
        const widthPct = s.value === undefined ? 0 : Math.max(4, (s.value / max) * 100);
        return (
          <div key={s.label} className="flex items-center gap-3">
            <div className="w-6 shrink-0 text-right font-mono text-xs text-[var(--wos-ink-faint)] tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between mb-1.5 gap-2">
                <span className="text-sm text-[var(--wos-ink)] font-medium truncate">{s.label}</span>
                <div className="flex items-baseline gap-3 shrink-0">
                  {s.dropFromPrev !== null && (
                    <span className="text-xs font-mono text-[var(--wos-ink-muted)] tabular-nums">{formatPercent(s.dropFromPrev)}</span>
                  )}
                  <span className="text-sm font-mono text-[var(--wos-primary)] tabular-nums w-16 text-right">{formatNumber(s.value)}</span>
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-[var(--wos-surface-alt)] border border-[var(--wos-border)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--wos-primary)] transition-[width] duration-500 ease-out" style={{ width: `${widthPct}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
