"use client";

import { Area, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatNumber } from "@/lib/webinar-os/aggregate";

export type TendenciaHotmartRow = { fecha: string; ventas: number; carritoAbandonado: number; tarjetaRechazada: number };

function formatFecha(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso.slice(0, 10) + "T00:00:00");
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

// Línea suave + área con degradé para la serie principal (Ventas), líneas
// punteadas para las dos series de "lo que se perdió" (Carrito/Tarjetas) —
// mismo mecanismo de referencia que pidió el usuario (tipo de gráfico y
// animación, no los colores), con los tokens de marca en vez de la paleta
// rosa/verde del ejemplo.
export default function TendenciaHotmartChart({ rows }: { rows: TendenciaHotmartRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-on-surface-faint">Sin datos todavía en el período.</p>;
  }

  const data = rows.map((r) => ({ ...r, fechaLabel: formatFecha(r.fecha) }));
  const ultimaFecha = data[data.length - 1]?.fechaLabel;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="tendenciaVentasFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline)" vertical={false} />
          <XAxis
            dataKey="fechaLabel"
            tick={{ fill: "var(--color-on-surface-faint)", fontSize: 11 }}
            axisLine={{ stroke: "var(--color-outline)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--color-on-surface-faint)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={32}
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
            formatter={(value: number, name: string) => [formatNumber(value), name]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-on-surface-variant)" }} />
          {ultimaFecha && <ReferenceLine x={ultimaFecha} stroke="var(--color-outline)" strokeDasharray="2 2" />}
          <Area
            type="monotone"
            dataKey="ventas"
            name="Ventas"
            stroke="none"
            fill="url(#tendenciaVentasFill)"
            legendType="none"
            tooltipType="none"
          />
          <Line
            type="monotone"
            dataKey="ventas"
            name="Ventas"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={{ r: 4, fill: "var(--color-surface)", stroke: "var(--color-primary)", strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="carritoAbandonado"
            name="Carrito abandonado"
            stroke="var(--color-secondary)"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={{ r: 3, fill: "var(--color-surface)", stroke: "var(--color-secondary)", strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="tarjetaRechazada"
            name="Tarjetas rechazadas"
            stroke="var(--color-error)"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={{ r: 3, fill: "var(--color-surface)", stroke: "var(--color-error)", strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
