"use client";

import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoneyEnMoneda } from "@/lib/v3/format";
import { formatNumber } from "@/lib/webinar-os/aggregate";

export type DesempenoDiaRow = { fecha: string; inversion: number; facturacion: number; roas: number | null };

function formatFecha(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso.slice(0, 10) + "T00:00:00");
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

export default function DesempenoDiarioChart({ rows, moneda }: { rows: DesempenoDiaRow[]; moneda: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-on-surface-faint">Sin datos todavía en el período.</p>;
  }

  const data = rows.map((r) => ({ ...r, fechaLabel: formatFecha(r.fecha) }));

  // Ancho del eje de dinero calculado a partir del valor más grande que de
  // verdad va a mostrar (no un ancho fijo) — así, si la facturación/inversión
  // crece a 6-7 cifras, la etiqueta sigue cabiendo en vez de cortarse contra
  // el borde izquierdo.
  const valorMax = Math.max(0, ...data.map((r) => Math.max(r.inversion, r.facturacion)));
  const anchoEjeDinero = Math.max(48, formatNumber(valorMax).length * 7 + 12);

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
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
            width={anchoEjeDinero}
            tickFormatter={(v) => formatNumber(v)}
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
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-outline)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--color-on-surface)",
            }}
            labelStyle={{ color: "var(--color-on-surface-variant)" }}
            formatter={(value: number, name: string) => {
              if (name === "ROAS") return [value != null ? `${value.toFixed(2)}x` : "—", name];
              return [formatMoneyEnMoneda(value, moneda), name];
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-on-surface-variant)" }} />
          <Bar yAxisId="dinero" dataKey="facturacion" name="Facturación" fill="var(--color-secondary)" radius={[3, 3, 0, 0]} />
          <Bar yAxisId="dinero" dataKey="inversion" name="Inversión" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
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
