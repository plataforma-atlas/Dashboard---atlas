"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDecimal, formatMoney, formatPercent, toMetaAdsTotals } from "@/lib/webinar-os/aggregate";
import { MetaAdsEntry } from "@/lib/webinar-os/types";
import ModuleShell from "./ModuleShell";

export default function MetaAdsSection({ entries }: { entries: MetaAdsEntry[] }) {
  const totals = toMetaAdsTotals(entries);
  const chartData = entries.map((e) => ({ fecha: new Date(e.entry_date).toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit" }), spend: Number(e.spend) || 0 }));

  return (
    <ModuleShell icon="📊" title="Meta Ads">
      {entries.length === 0 ? (
        <p className="text-sm text-[var(--wos-ink-muted)] py-6 text-center">Sin registros de Meta Ads todavía.</p>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--wos-border)" />
                <XAxis dataKey="fecha" tick={{ fill: "var(--wos-ink-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--wos-border)" }} tickLine={false} />
                <YAxis tick={{ fill: "var(--wos-ink-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "var(--wos-border)", fillOpacity: 0.4 }}
                  contentStyle={{ background: "var(--wos-surface)", border: "1px solid var(--wos-border)", borderRadius: 8, fontSize: 12, color: "var(--wos-ink)" }}
                  labelStyle={{ color: "var(--wos-ink-muted)" }}
                  formatter={(value: number) => [formatMoney(value), "Inversión"]}
                />
                <Bar dataKey="spend" fill="var(--wos-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.06em] text-[var(--wos-ink-muted)] border-b border-[var(--wos-border)]">
                  <th className="py-2 pr-3 font-medium">Fecha</th>
                  <th className="py-2 px-3 font-medium text-right">Inversión</th>
                  <th className="py-2 px-3 font-medium text-right">Scroll Stop</th>
                  <th className="py-2 px-3 font-medium text-right">CTR</th>
                  <th className="py-2 px-3 font-medium text-right">CPM</th>
                  <th className="py-2 px-3 font-medium text-right">CPC</th>
                  <th className="py-2 px-3 font-medium text-right">CPL</th>
                  <th className="py-2 pl-3 font-medium text-right">Frecuencia</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-[var(--wos-border)] last:border-0">
                    <td className="py-2 pr-3 text-[var(--wos-ink)]">{new Date(e.entry_date).toLocaleDateString("es-CO")}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-[var(--wos-ink)]">{formatMoney(Number(e.spend))}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-[var(--wos-ink-muted)]">{e.scroll_stop_rate ? formatPercent(Number(e.scroll_stop_rate)) : "—"}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-[var(--wos-ink-muted)]">{e.ctr ? formatPercent(Number(e.ctr)) : "—"}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-[var(--wos-ink-muted)]">{e.cpm ? formatMoney(Number(e.cpm)) : "—"}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-[var(--wos-ink-muted)]">{e.cpc ? formatMoney(Number(e.cpc)) : "—"}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-[var(--wos-ink-muted)]">{e.cpl ? formatMoney(Number(e.cpl)) : "—"}</td>
                    <td className="py-2 pl-3 text-right tabular-nums text-[var(--wos-ink-muted)]">{e.frequency ? formatDecimal(Number(e.frequency)) : "—"}</td>
                  </tr>
                ))}
              </tbody>
              {totals && (
                <tfoot>
                  <tr className="border-t-2 border-[var(--wos-border)] font-semibold">
                    <td className="py-2 pr-3 text-[var(--wos-ink)]">Totales / Promedios</td>
                    <td className="py-2 px-3 text-right tabular-nums text-[var(--wos-ink)]">{formatMoney(totals.spend)}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-[var(--wos-ink)]">{formatPercent(totals.scroll_stop_rate)}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-[var(--wos-ink)]">{formatPercent(totals.ctr)}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-[var(--wos-ink)]">{formatMoney(totals.cpm)}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-[var(--wos-ink)]">{formatMoney(totals.cpc)}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-[var(--wos-ink)]">{formatMoney(totals.cpl)}</td>
                    <td className="py-2 pl-3 text-right tabular-nums text-[var(--wos-ink)]">{formatDecimal(totals.frequency)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </ModuleShell>
  );
}
