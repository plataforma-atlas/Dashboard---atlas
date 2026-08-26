import { EventoAdSpendConsolidatedRow } from "@/lib/evento/types";
import { formatMoney } from "@/lib/webinar-os/aggregate";

function formatFecha(iso: string) {
  const d = new Date(iso.slice(0, 10) + "T00:00:00");
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

export default function EventoAdSpendConsolidatedTable({ rows }: { rows: EventoAdSpendConsolidatedRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-[var(--wos-ink-faint)]">Sin gasto de pauta registrado todavía.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-separate border-spacing-y-1.5 min-w-[640px]">
        <thead>
          <tr className="text-[10px] uppercase tracking-[0.06em] text-[var(--wos-ink-faint)]">
            <th className="text-left px-2 pb-1">Fecha</th>
            <th className="text-right px-2 pb-1">Importe gastado</th>
            <th className="text-right px-2 pb-1">Leads</th>
            <th className="text-right px-2 pb-1">CPL</th>
            <th className="text-right px-2 pb-1">CPM</th>
            <th className="text-right px-2 pb-1">CTR</th>
            <th className="text-right px-2 pb-1">CTR único</th>
            <th className="text-right px-2 pb-1">WhatsApp</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const spend = Number(r.spend);
            const leads = Number(r.leads);
            const impressions = Number(r.impressions);
            const clicks = Number(r.clicks);
            const reach = Number(r.reach);
            const uniqueLinkClicks = Number(r.unique_link_clicks);
            const cpl = leads > 0 ? spend / leads : null;
            const cpm = impressions > 0 ? (spend / impressions) * 1000 : null;
            const ctr = impressions > 0 ? (clicks / impressions) * 100 : null;
            const uniqueCtr = reach > 0 ? (uniqueLinkClicks / reach) * 100 : null;
            return (
              <tr key={r.entry_date} className="bg-[var(--wos-surface)] border border-[var(--wos-border)]">
                <td className="px-3 py-2 rounded-l-lg text-[var(--wos-ink)] font-medium">{formatFecha(r.entry_date)}</td>
                <td className="px-3 py-2 text-right text-[var(--wos-ink)] tabular-nums">{formatMoney(spend)}</td>
                <td className="px-3 py-2 text-right text-[var(--wos-ink)] tabular-nums font-semibold">{leads}</td>
                <td className="px-3 py-2 text-right text-[var(--wos-ink-muted)] tabular-nums">{cpl != null ? formatMoney(cpl) : "—"}</td>
                <td className="px-3 py-2 text-right text-[var(--wos-ink-muted)] tabular-nums">{cpm != null ? formatMoney(cpm) : "—"}</td>
                <td className="px-3 py-2 text-right text-[var(--wos-ink-muted)] tabular-nums">{ctr != null ? `${ctr.toFixed(2)}%` : "—"}</td>
                <td className="px-3 py-2 text-right text-[var(--wos-ink-muted)] tabular-nums">{uniqueCtr != null ? `${uniqueCtr.toFixed(2)}%` : "—"}</td>
                <td className="px-3 py-2 rounded-r-lg text-right text-[var(--wos-ink)] tabular-nums">{Number(r.whatsapp)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
