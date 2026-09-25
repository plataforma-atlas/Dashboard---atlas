"use client";

import { EventoDailyPerformanceRow } from "@/lib/evento/types";
import { formatMoney } from "@/lib/webinar-os/aggregate";

function formatFecha(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso.slice(0, 10) + "T00:00:00");
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DailyDetailTable({ rows }: { rows: EventoDailyPerformanceRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-on-surface-faint py-6">Sin datos todavía.</p>;
  }

  const sorted = [...rows].sort((a, b) => b.entry_date.localeCompare(a.entry_date));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-on-surface-faint text-[11px] uppercase tracking-wide">
            <th className="py-2 pr-4 font-medium">Fecha</th>
            <th className="py-2 pr-4 font-medium">Faturamento</th>
            <th className="py-2 pr-4 font-medium">Investimento</th>
            <th className="py-2 pr-4 font-medium">ROAS</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.entry_date} className="border-t border-outline">
              <td className="py-2 pr-4 text-on-surface-variant">{formatFecha(r.entry_date)}</td>
              <td className="py-2 pr-4 text-on-surface tabular">{formatMoney(r.faturamento)}</td>
              <td className="py-2 pr-4 text-on-surface tabular">{formatMoney(r.investimento)}</td>
              <td className="py-2 pr-4 text-on-surface tabular">{r.roas != null ? `${r.roas.toFixed(2)}x` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
