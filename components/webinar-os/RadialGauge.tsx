"use client";

import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

export default function RadialGauge({ label, value, max, formatted }: { label: string; value: number; max: number; formatted: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const data = [{ name: label, value: pct, fill: "var(--wos-primary)" }];

  return (
    <div className="rounded-lg border border-[var(--wos-border)] bg-[var(--wos-surface-alt)] px-4 py-3.5 flex items-center gap-4">
      <div className="w-16 h-16 shrink-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="70%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
            <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "var(--wos-border)" }} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <div className="text-xs uppercase tracking-[0.08em] text-[var(--wos-ink-muted)] font-medium mb-1">{label}</div>
        <div className="text-lg font-semibold text-[var(--wos-ink)] tabular-nums">{formatted}</div>
      </div>
    </div>
  );
}
