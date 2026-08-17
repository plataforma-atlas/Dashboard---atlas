import { VslDailyRow } from "@/lib/vsl/types";
import { formatMoney, formatPercent } from "@/lib/webinar-os/aggregate";

function formatDayLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-CO", { weekday: "long", day: "2-digit", month: "short" });
}

export default function VslDailyTable({ rows }: { rows: VslDailyRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-[var(--wos-ink-faint)]">Sin registros con fecha todavía.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-separate border-spacing-y-1.5 min-w-[640px]">
        <thead>
          <tr className="text-[10px] uppercase tracking-[0.06em] text-[var(--wos-ink-faint)]">
            <th className="text-left px-2 pb-1">Día</th>
            <th className="text-right px-2 pb-1">Registros</th>
            <th className="text-right px-2 pb-1">Depósitos</th>
            <th className="text-right px-2 pb-1">Capital depositado</th>
            <th className="text-right px-2 pb-1">Conv. registro → depósito</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const conv = r.registros > 0 ? (r.depositos / r.registros) * 100 : null;
            return (
              <tr key={r.date} className="bg-[var(--wos-surface)] border border-[var(--wos-border)]">
                <td className="px-3 py-2.5 rounded-l-lg capitalize text-[var(--wos-ink)] font-medium">{formatDayLabel(r.date)}</td>
                <td className="px-3 py-2.5 text-right text-[var(--wos-ink)] tabular-nums">{r.registros}</td>
                <td className="px-3 py-2.5 text-right text-[var(--wos-ink)] tabular-nums font-semibold">{r.depositos}</td>
                <td className="px-3 py-2.5 text-right text-emerald-500 tabular-nums">{formatMoney(r.capitalDepositado)}</td>
                <td className="px-3 py-2.5 rounded-r-lg text-right text-[var(--wos-ink-muted)] tabular-nums">{formatPercent(conv ?? undefined)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
