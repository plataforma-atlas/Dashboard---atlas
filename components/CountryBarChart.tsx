"use client";

import { CountryRow } from "@/lib/types";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function CountryBarChart({ data }: { data: CountryRow[] }) {
  return (
    <div className="rounded-lg border border-stroke bg-panel p-5 md:p-6 h-full flex flex-col">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-lg text-ink">Registros por país</h2>
        <span className="text-[11px] uppercase tracking-[0.14em] text-faint font-mono">
          {data.length} países
        </span>
      </div>
      <div className="flex-1 min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid horizontal={false} stroke="var(--c-stroke)" />
            <XAxis
              type="number"
              tick={{ fill: "var(--c-mute)", fontSize: 11 }}
              axisLine={{ stroke: "var(--c-stroke)" }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="country"
              tick={{ fill: "var(--c-text)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={90}
            />
            <Tooltip
              cursor={{ fill: "var(--c-stroke)", fillOpacity: 0.4 }}
              contentStyle={{
                background: "var(--c-panel2)",
                border: "1px solid var(--c-stroke)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--c-text)",
              }}
              labelStyle={{ color: "var(--c-mute)" }}
            />
            <Bar dataKey="leads" name="Registros" fill="var(--c-accent)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
