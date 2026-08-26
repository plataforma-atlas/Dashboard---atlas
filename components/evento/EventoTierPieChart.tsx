"use client";

import { EventoTierRow } from "@/lib/evento/types";
import { formatMoney } from "@/lib/webinar-os/aggregate";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const TIER_COLORS: Record<string, string> = {
  Confirmado: "var(--wos-ink-faint)",
  Platino: "var(--wos-primary)",
  VIP: "var(--wos-positive)",
};

function tierLabel(tier: string) {
  return tier === "Platino" ? "Platinum" : tier;
}

function colorFor(tier: string) {
  return TIER_COLORS[tier] ?? "var(--wos-negative)";
}

export default function EventoTierPieChart({ tiers }: { tiers: EventoTierRow[] }) {
  const total = tiers.reduce((sum, t) => sum + Number(t.total), 0);
  if (total === 0) {
    return <p className="text-sm text-[var(--wos-ink-faint)]">Sin confirmados todavía.</p>;
  }

  const data = tiers.map((t) => ({ tier: t.tier, total: Number(t.total), ingresos: Number(t.ingresos) }));

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="w-full sm:w-48 h-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="total" nameKey="tier" innerRadius="60%" outerRadius="100%" paddingAngle={2} strokeWidth={0}>
              {data.map((d) => (
                <Cell key={d.tier} fill={colorFor(d.tier)} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "var(--wos-surface)", border: "1px solid var(--wos-border)", borderRadius: 8, fontSize: 12, color: "var(--wos-ink)" }}
              labelStyle={{ color: "var(--wos-ink-muted)" }}
              formatter={(value: number, _name, item) => [`${value} (${((value / total) * 100).toFixed(1)}%)`, tierLabel(item.payload.tier)]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-2 w-full">
        {data.map((d) => (
          <div key={d.tier} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colorFor(d.tier) }} />
              <span className="text-[var(--wos-ink)] font-medium truncate">{tierLabel(d.tier)}</span>
            </span>
            <span className="text-[var(--wos-ink-muted)] tabular-nums shrink-0">
              {d.total} · {((d.total / total) * 100).toFixed(1)}%{d.ingresos > 0 ? ` · ${formatMoney(d.ingresos)}` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
