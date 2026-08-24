import { EventoAdPerformanceRow } from "@/lib/evento/types";
import { formatMoney } from "@/lib/webinar-os/aggregate";

function formatFecha(iso: string) {
  const d = new Date(iso.slice(0, 10) + "T00:00:00");
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

function sumRows(rows: EventoAdPerformanceRow[]) {
  let spend = 0;
  let leads = 0;
  for (const r of rows) {
    spend += Number(r.spend);
    leads += Number(r.leads);
  }
  return { spend, leads };
}

export default function EventoAdPerformanceTable({ rows }: { rows: EventoAdPerformanceRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-[var(--wos-ink-faint)]">Sin gasto de pauta por anuncio registrado todavía.</p>;
  }

  const byAdset = new Map<string, EventoAdPerformanceRow[]>();
  for (const row of rows) {
    if (!byAdset.has(row.adset_name)) byAdset.set(row.adset_name, []);
    byAdset.get(row.adset_name)!.push(row);
  }

  return (
    <div className="flex flex-col gap-2">
      {Array.from(byAdset.entries()).map(([adsetName, adsetRows]) => {
        const adGroups = new Map<string, EventoAdPerformanceRow[]>();
        for (const row of adsetRows) {
          if (!adGroups.has(row.ad_name)) adGroups.set(row.ad_name, []);
          adGroups.get(row.ad_name)!.push(row);
        }
        const adsetTotals = sumRows(adsetRows);

        return (
          <details key={adsetName} className="group rounded-lg border border-[var(--wos-border)] bg-[var(--wos-surface)]" open>
            <summary className="cursor-pointer select-none list-none px-3 py-2.5 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 min-w-0">
                <span className="text-[var(--wos-ink-faint)] text-xs transition-transform duration-150 group-open:rotate-90 shrink-0">▶</span>
                <span className="text-sm font-semibold text-[var(--wos-ink)] truncate">{adsetName}</span>
              </span>
              <span className="text-xs text-[var(--wos-ink-muted)] tabular-nums shrink-0">
                {formatMoney(adsetTotals.spend)} · {adsetTotals.leads} leads
              </span>
            </summary>
            <div className="px-3 pb-3 flex flex-col gap-2 border-t border-[var(--wos-border)] pt-2">
              {Array.from(adGroups.entries()).map(([adName, adRows]) => {
                const adTotals = sumRows(adRows);
                return (
                  <details key={adName} className="group/ad rounded-md border border-[var(--wos-border)]/70">
                    <summary className="cursor-pointer select-none list-none px-3 py-1.5 flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="text-[var(--wos-ink-faint)] text-[10px] transition-transform duration-150 group-open/ad:rotate-90 shrink-0">▶</span>
                        <span className="text-xs font-medium text-[var(--wos-ink-muted)] truncate">{adName}</span>
                      </span>
                      <span className="text-[11px] text-[var(--wos-ink-faint)] tabular-nums shrink-0">
                        {formatMoney(adTotals.spend)} · {adTotals.leads} leads
                      </span>
                    </summary>
                    <div className="px-3 pb-2 pt-1 overflow-x-auto">
                      <table className="w-full text-sm border-separate border-spacing-y-1.5 min-w-[640px]">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-[0.06em] text-[var(--wos-ink-faint)]">
                            <th className="text-left px-2 pb-1">Fecha</th>
                            <th className="text-right px-2 pb-1">Importe gastado</th>
                            <th className="text-right px-2 pb-1">Leads</th>
                            <th className="text-right px-2 pb-1">CPL</th>
                            <th className="text-right px-2 pb-1">CPM</th>
                            <th className="text-right px-2 pb-1">CTR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adRows.map((r) => {
                            const spend = Number(r.spend);
                            const leads = Number(r.leads);
                            const impressions = Number(r.impressions);
                            const clicks = Number(r.clicks);
                            const cpl = leads > 0 ? spend / leads : null;
                            const cpm = impressions > 0 ? (spend / impressions) * 1000 : null;
                            const ctr = impressions > 0 ? (clicks / impressions) * 100 : null;
                            return (
                              <tr key={r.entry_date} className="bg-[var(--wos-surface-alt)] border border-[var(--wos-border)]">
                                <td className="px-3 py-2 rounded-l-lg text-[var(--wos-ink)]">{formatFecha(r.entry_date)}</td>
                                <td className="px-3 py-2 text-right text-[var(--wos-ink)] tabular-nums">{formatMoney(spend)}</td>
                                <td className="px-3 py-2 text-right text-[var(--wos-ink)] tabular-nums font-semibold">{leads}</td>
                                <td className="px-3 py-2 text-right text-[var(--wos-ink-muted)] tabular-nums">{cpl != null ? formatMoney(cpl) : "—"}</td>
                                <td className="px-3 py-2 text-right text-[var(--wos-ink-muted)] tabular-nums">{cpm != null ? formatMoney(cpm) : "—"}</td>
                                <td className="px-3 py-2 rounded-r-lg text-right text-[var(--wos-ink-muted)] tabular-nums">{ctr != null ? `${ctr.toFixed(2)}%` : "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </details>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}
