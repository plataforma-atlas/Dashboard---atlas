"use client";

import { EventoDailyPerformanceRow } from "@/lib/evento/types";
import { formatMoney } from "@/lib/webinar-os/aggregate";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function formatFecha(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso.slice(0, 10) + "T00:00:00");
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

export default function PerformanceChart({ rows }: { rows: EventoDailyPerformanceRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-on-surface-faint">Sin datos todavía.</p>;
  }

  const data = rows.map((r) => ({ ...r, fecha: formatFecha(r.entry_date) }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline)" vertical={false} />
          <XAxis
            dataKey="fecha"
            tick={{ fill: "var(--color-on-surface-faint)", fontSize: 11 }}
            axisLine={{ stroke: "var(--color-outline)" }}
            tickLine={false}
          />
          <YAxis
            yAxisId="dinero"
            tick={{ fill: "var(--color-on-surface-faint)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={52}
            tickFormatter={(v) => formatMoney(v)}
          />
          <YAxis
            yAxisId="roas"
            orientation="right"
            tick={{ fill: "var(--color-on-surface-faint)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={(v) => `${v}x`}
          />
          <Tooltip
            contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-outline)", borderRadius: 8, fontSize: 12, color: "var(--color-on-surface)" }}
            labelStyle={{ color: "var(--color-on-surface-variant)" }}
            formatter={(value: number, name: string) => {
              if (name === "ROAS") return [value != null ? `${value.toFixed(2)}x` : "—", name];
              return [formatMoney(value), name];
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-on-surface-variant)" }} />
          <Bar yAxisId="dinero" dataKey="faturamento" name="Faturamento" fill="var(--color-secondary)" radius={[3, 3, 0, 0]} />
          <Bar yAxisId="dinero" dataKey="investimento" name="Investimento" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
          <Line
            yAxisId="roas"
            type="monotone"
            dataKey="roas"
            name="ROAS"
            stroke="var(--color-success)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-success)" }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
