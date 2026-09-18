import { EventoAdSpendRow } from "@/lib/evento/types";
import { formatMoney } from "@/lib/webinar-os/aggregate";

function formatFecha(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso.slice(0, 10) + "T00:00:00");
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

export default function EventoAdSpendDailyTable({ rows }: { rows: EventoAdSpendRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-[var(--wos-ink-faint)]">Sin gasto de pauta registrado todavía.</p>;
  }

  const byCampaign = new Map<number, { name: string; rows: EventoAdSpendRow[] }>();
  for (const row of rows) {
    if (!byCampaign.has(row.campaign_id)) byCampaign.set(row.campaign_id, { name: row.campaign_name, rows: [] });
    byCampaign.get(row.campaign_id)!.rows.push(row);
  }

  return (
    <div className="flex flex-col gap-5">
      {Array.from(byCampaign.values()).map((group) => (
        <div key={group.name}>
          <h4 className="text-sm font-semibold text-[var(--wos-ink)] mb-2">{group.name}</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-y-1.5 min-w-[640px]">
              <thead>
                <tr className="text-xs uppercase tracking-[0.06em] text-[var(--wos-ink-faint)]">
                  <th className="text-left px-2 pb-1">Fecha</th>
                  <th className="text-right px-2 pb-1">Importe gastado</th>
                  <th className="text-right px-2 pb-1">Leads</th>
                  <th className="text-right px-2 pb-1">CPL</th>
                  <th className="text-right px-2 pb-1">CPM</th>
                  <th className="text-right px-2 pb-1">CTR único</th>
                  <th className="text-right px-2 pb-1">WhatsApp</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((r) => {
                  const spend = Number(r.spend);
                  const leads = Number(r.leads);
                  const cpl = leads > 0 ? spend / leads : null;
                  return (
                    <tr key={r.entry_date} className="bg-[var(--wos-surface)] border border-[var(--wos-border)]">
                      <td className="px-3 py-2 rounded-l-lg text-[var(--wos-ink)]">{formatFecha(r.entry_date)}</td>
                      <td className="px-3 py-2 text-right text-[var(--wos-ink)] tabular-nums">{formatMoney(spend)}</td>
                      <td className="px-3 py-2 text-right text-[var(--wos-ink)] tabular-nums font-semibold">{leads}</td>
                      <td className="px-3 py-2 text-right text-[var(--wos-ink-muted)] tabular-nums">{cpl != null ? formatMoney(cpl) : "—"}</td>
                      <td className="px-3 py-2 text-right text-[var(--wos-ink-muted)] tabular-nums">{formatMoney(Number(r.cpm))}</td>
                      <td className="px-3 py-2 text-right text-[var(--wos-ink-muted)] tabular-nums">{Number(r.unique_ctr).toFixed(2)}%</td>
                      <td className="px-3 py-2 rounded-r-lg text-right text-[var(--wos-ink)] tabular-nums">{Number(r.whatsapp)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
