"use client";

export default function HorizontalBarPanel({
  title,
  rows,
  formatValue,
}: {
  title: string;
  rows: { label: string; value: number }[];
  formatValue: (n: number) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <div className="bg-surface border border-outline rounded-xl p-4 flex flex-col gap-3">
      <h3 className="text-[11px] uppercase tracking-wide text-on-surface-variant font-medium">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-on-surface-faint">Sin datos todavía.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-3">
              <span className="text-xs text-on-surface-variant w-28 truncate shrink-0" title={r.label}>
                {r.label}
              </span>
              <div className="flex-1 h-2 rounded-full bg-surface-high overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, (r.value / max) * 100)}%` }} />
              </div>
              <span className="text-xs text-on-surface tabular shrink-0">{formatValue(r.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
