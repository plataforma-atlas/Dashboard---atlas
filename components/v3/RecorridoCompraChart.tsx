"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { V3AnalisisRecorrido } from "@/lib/v3/types";

export default function RecorridoCompraChart({ datos }: { datos: V3AnalisisRecorrido }) {
  if (datos.total_compradores === 0) {
    return <p className="text-sm text-on-surface-faint">Todavía no hay ventas suficientes para calcular esto.</p>;
  }

  const data = datos.distribucion.map((d) => ({ ...d, label: `${d.interacciones}` }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline)" vertical={false} />
          <XAxis
            dataKey="label"
            label={{ value: "Interacciones antes de comprar", position: "insideBottom", offset: -4, fill: "var(--color-on-surface-faint)", fontSize: 11 }}
            tick={{ fill: "var(--color-on-surface-faint)", fontSize: 11 }}
            axisLine={{ stroke: "var(--color-outline)" }}
            tickLine={false}
            height={36}
          />
          <YAxis
            tick={{ fill: "var(--color-on-surface-faint)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={32}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "var(--color-surface-high)" }}
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-outline)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--color-on-surface)",
            }}
            labelStyle={{ color: "var(--color-on-surface-variant)" }}
            formatter={(value: number) => [`${value} ${value === 1 ? "persona" : "personas"}`, "Compradores"]}
            labelFormatter={(label: string) => `${label} ${label === "1" ? "interacción" : "interacciones"}`}
          />
          <Bar dataKey="cantidad" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
