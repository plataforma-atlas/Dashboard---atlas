import { VslFunnelStage } from "@/lib/vsl/types";
import { formatNumber } from "@/lib/webinar-os/aggregate";

export default function VslFunnel({ stages }: { stages: VslFunnelStage[] }) {
  const max = Math.max(1, ...stages.map((s) => s.value ?? 0));

  return (
    <div className="flex flex-col gap-3">
      {stages.map((s, i) => {
        const widthPct = s.value == null ? 0 : Math.max(4, (s.value / max) * 100);
        return (
          <div key={s.label} className="flex items-center gap-3">
            <div className="w-6 shrink-0 text-right font-mono text-xs text-[var(--wos-ink-faint)] tabular-nums">{String(i + 1).padStart(2, "0")}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between mb-1.5 gap-2">
                <span className="text-sm text-[var(--wos-ink)] font-medium truncate">{s.label}</span>
                <span className="text-sm font-mono text-[var(--wos-primary)] tabular-nums">{formatNumber(s.value ?? undefined)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-[var(--wos-surface-alt)] border border-[var(--wos-border)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--wos-primary)] transition-all" style={{ width: `${widthPct}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
