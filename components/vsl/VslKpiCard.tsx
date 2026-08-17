export default function VslKpiCard({
  label,
  value,
  note,
  tone = "neutral",
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "up" | "warn" | "down" | "neutral";
}) {
  const toneClass =
    tone === "up" ? "text-emerald-500" : tone === "warn" ? "text-amber-500" : tone === "down" ? "text-red-500" : "text-[var(--wos-ink-faint)]";

  return (
    <div className="rounded-xl border border-[var(--wos-border)] bg-[var(--wos-surface)] shadow-[var(--wos-shadow)] px-4 py-4">
      <div className="text-[10px] uppercase tracking-[0.09em] text-[var(--wos-ink-muted)] font-medium">{label}</div>
      <div className="text-2xl font-semibold text-[var(--wos-ink)] tabular-nums mt-2">{value}</div>
      {note && <div className={`text-xs font-medium mt-1 ${toneClass}`}>{note}</div>}
    </div>
  );
}
