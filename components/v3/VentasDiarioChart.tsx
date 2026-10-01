"use client";

import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoneyEnMoneda } from "@/lib/v3/format";
import { formatNumber } from "@/lib/webinar-os/aggregate";

export type VentaPorDia = { fecha: string; ventas: number; facturacion: number };

function formatFecha(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso.slice(0, 10) + "T00:00:00");
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

export default function VentasDiarioChart({ rows, moneda }: { rows: VentaPorDia[]; moneda: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-on-surface-faint">Sin ventas todavía en el período.</p>;
  }

  const data = rows.map((r) => ({ ...r, fechaLabel: formatFecha(r.fecha) }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline)" vertical={false} />
          <XAxis
            dataKey="fechaLabel"
            tick={{ fill: "var(--color-on-surface-faint)", fontSize: 11 }}
            axisLine={{ stroke: "var(--color-outline)" }}
            tickLine={false}
          />
          <YAxis
            yAxisId="dinero"
            tick={{ fill: "var(--color-on-surface-faint)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={60}
            tickFormatter={(v) => formatMoneyEnMoneda(v, moneda)}
          />
          <YAxis
            yAxisId="ventas"
            orientation="right"
            tick={{ fill: "var(--color-on-surface-faint)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-outline)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--color-on-surface)",
            }}
            labelStyle={{ color: "var(--color-on-surface-variant)" }}
            formatter={(value: number, name: string) => {
              if (name === "Ventas") return [formatNumber(value), name];
              return [formatMoneyEnMoneda(value, moneda), name];
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-on-surface-variant)" }} />
          <Bar yAxisId="dinero" dataKey="facturacion" name="Facturación" fill="var(--color-success)" radius={[3, 3, 0, 0]} />
          <Line
            yAxisId="ventas"
            type="monotone"
            dataKey="ventas"
            name="Ventas"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-primary)" }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
