export default function KpiCard({
  label,
  value,
  meta,
  miniBarPct,
}: {
  label: string;
  value: string;
  meta?: React.ReactNode;
  miniBarPct?: number;
}) {
  return (
    <div className="rounded-lg border border-[var(--wos-border)] bg-[var(--wos-surface-alt)] px-4 py-3.5 flex flex-col">
      <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--wos-ink-muted)] font-medium mb-1.5">{label}</div>
      <div className="text-lg font-semibold text-[var(--wos-ink)] tabular-nums">{value}</div>
      {meta && <div className="text-[11px] text-[var(--wos-ink-muted)] mt-1">{meta}</div>}
      {typeof miniBarPct === "number" && (
        <div className="mt-auto pt-2.5">
          <div className="h-[5px] rounded-full bg-[var(--wos-border)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--wos-primary)]"
              style={{ width: `${Math.min(Math.max(miniBarPct, 0), 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
