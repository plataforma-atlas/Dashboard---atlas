export default function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--wos-border)] bg-[var(--wos-surface-alt)] px-4 py-3.5">
      <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--wos-ink-muted)] font-medium mb-1.5">{label}</div>
      <div className="text-lg font-semibold text-[var(--wos-ink)] tabular-nums">{value}</div>
    </div>
  );
}
