import { EventoTemperaturaRow } from "@/lib/evento/types";

const COLORS: Record<string, string> = {
  "Tráfico Tibio": "var(--wos-primary)",
  "Tráfico Frío": "var(--wos-ink-faint)",
};

export default function EventoTemperaturaChart({ rows }: { rows: EventoTemperaturaRow[] }) {
  const total = rows.reduce((sum, r) => sum + r.registros, 0);
  if (total === 0) {
    return <p className="text-sm text-[var(--wos-ink-faint)]">Sin registros todavía.</p>;
  }

  const max = Math.max(1, ...rows.map((r) => r.registros));

  return (
    <div className="flex flex-col gap-4">
      {rows.map((r) => {
        const widthPct = r.registros === 0 ? 0 : Math.max(4, (r.registros / max) * 100);
        const pct = (r.registros / total) * 100;
        return (
          <div key={r.temperatura}>
            <div className="flex items-baseline justify-between mb-1.5 gap-2">
              <span className="text-sm text-[var(--wos-ink)] font-medium">{r.temperatura}</span>
              <div className="flex items-baseline gap-2.5 shrink-0">
                <span className="text-xs text-[var(--wos-ink-muted)] tabular-nums">{pct.toFixed(1)}%</span>
                <span className="text-sm font-mono text-[var(--wos-ink)] tabular-nums w-12 text-right">
                  {r.registros.toLocaleString("es-CO")}
                </span>
              </div>
            </div>
            <div className="h-3 rounded-full bg-[var(--wos-surface-alt)] border border-[var(--wos-border)] overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{ width: `${widthPct}%`, background: COLORS[r.temperatura] ?? "var(--wos-primary)" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
