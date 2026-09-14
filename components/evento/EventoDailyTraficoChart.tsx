"use client";

import { EventoDailyTraficoRow } from "@/lib/evento/types";
import { formatMoney } from "@/lib/webinar-os/aggregate";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function formatFecha(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso.slice(0, 10) + "T00:00:00");
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

export default function EventoDailyTraficoChart({ rows }: { rows: EventoDailyTraficoRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-[var(--wos-ink-faint)]">Sin datos todavía.</p>;
  }

  const data = rows.map((r) => ({ ...r, fecha: formatFecha(r.entry_date) }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--wos-border)" vertical={false} />
          <XAxis dataKey="fecha" tick={{ fill: "var(--wos-ink-faint)", fontSize: 11 }} axisLine={{ stroke: "var(--wos-border)" }} tickLine={false} />
          <YAxis
            yAxisId="leads"
            tick={{ fill: "var(--wos-ink-faint)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
            allowDecimals={false}
          />
          <YAxis
            yAxisId="cpl"
            orientation="right"
            tick={{ fill: "var(--wos-ink-faint)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={(v) => formatMoney(v)}
          />
          <Tooltip
            contentStyle={{ background: "var(--wos-surface)", border: "1px solid var(--wos-border)", borderRadius: 8, fontSize: 12, color: "var(--wos-ink)" }}
            labelStyle={{ color: "var(--wos-ink-muted)" }}
            formatter={(value: number, name: string) => {
              if (name === "CPL") return [value != null ? formatMoney(value) : "—", name];
              return [value, name];
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--wos-ink-muted)" }} />
          <Bar yAxisId="leads" dataKey="leadsPauta" name="Leads Pauta" fill="var(--wos-primary)" radius={[3, 3, 0, 0]} />
          <Bar yAxisId="leads" dataKey="leadsOrganico" name="Leads Orgánico" fill="var(--wos-ink-faint)" radius={[3, 3, 0, 0]} />
          <Line
            yAxisId="cpl"
            type="monotone"
            dataKey="cpl"
            name="CPL"
            stroke="var(--wos-positive)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--wos-positive)" }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
