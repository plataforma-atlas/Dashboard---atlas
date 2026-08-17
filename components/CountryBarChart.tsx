"use client";

import { CountryRow } from "@/lib/types";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function CountryBarChart({ data }: { data: CountryRow[] }) {
  return (
    <div className="rounded-lg border border-outline bg-surface p-5 md:p-6 h-full flex flex-col">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-lg text-on-surface">Registros por país</h2>
        <span className="text-[11px] uppercase tracking-[0.14em] text-on-surface-faint font-mono">{data.length} países</span>
      </div>
      <div className="flex-1 min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid horizontal={false} stroke="var(--color-outline)" />
            <XAxis type="number" tick={{ fill: "var(--color-on-surface-variant)", fontSize: 11 }} axisLine={{ stroke: "var(--color-outline)" }} tickLine={false} />
            <YAxis type="category" dataKey="country" tick={{ fill: "var(--color-on-surface)", fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
            <Tooltip
              cursor={{ fill: "var(--color-outline)", fillOpacity: 0.4 }}
              contentStyle={{ background: "var(--color-surface-high)", border: "1px solid var(--color-outline)", borderRadius: 8, fontSize: 12, color: "var(--color-on-surface)" }}
              labelStyle={{ color: "var(--color-on-surface-variant)" }}
            />
            <Bar dataKey="leads" name="Registros" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
