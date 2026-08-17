import { VslDailyRow } from "@/lib/vsl/types";
import { formatMoney } from "@/lib/webinar-os/aggregate";

function formatDayLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

export default function VslDailyChart({ rows }: { rows: VslDailyRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-[var(--wos-ink-faint)]">Todavía no hay registros con fecha para graficar.</p>;
  }

  const max = Math.max(1, ...rows.map((r) => Math.max(r.registros, r.capitalDepositado)));

  return (
    <div>
      <div className="flex items-end gap-2 h-56 border-b border-[var(--wos-border)] pb-1">
        {rows.map((r) => (
          <div key={r.date} className="flex-1 min-w-0 h-full flex flex-col justify-end items-center gap-1.5">
            <div className="w-full h-full flex items-end justify-center gap-1">
              <div
                className="w-2.5 rounded-t-sm bg-[var(--wos-primary)]"
                style={{ height: `${Math.max(2, (r.registros / max) * 100)}%` }}
                title={`Registros: ${r.registros}`}
              />
              <div
                className="w-2.5 rounded-t-sm bg-emerald-500"
                style={{ height: `${Math.max(2, (r.capitalDepositado / max) * 100)}%` }}
                title={`Capital depositado: ${formatMoney(r.capitalDepositado)}`}
              />
            </div>
            {r.depositos > 0 && <span className="text-[9px] font-semibold text-amber-500">{r.depositos} dep.</span>}
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-1.5">
        {rows.map((r) => (
          <div key={r.date} className="flex-1 min-w-0 text-center text-[9px] text-[var(--wos-ink-faint)]">
            {formatDayLabel(r.date)}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[11px] text-[var(--wos-ink-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-[var(--wos-primary)]" /> Registros
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-emerald-500" /> Capital depositado
        </span>
      </div>
    </div>
  );
}
