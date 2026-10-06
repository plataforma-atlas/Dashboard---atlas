"use client";

import { Area, Bar, CartesianGrid, ComposedChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FormatoSerie, MetricaSerie, PuntoDia, metricaSerie } from "@/lib/v3/serie-diaria";
import { formatMoneyEnMoneda } from "@/lib/v3/format";
import { formatNumber } from "@/lib/webinar-os/aggregate";

export type TipoGrafico = "barras" | "linea";

// Primera métrica en el eje izquierdo (color primario), segunda en el derecho (secundario).
const COLOR_IZQ = "var(--color-primary)";
const COLOR_DER = "var(--color-secondary)";

function formatear(valor: number | null, formato: FormatoSerie): string {
  if (valor === null || Number.isNaN(valor)) return "—";
  if (formato === "dinero") return formatMoneyEnMoneda(valor, "USD");
  if (formato === "porcentaje") return `${valor.toFixed(2)}%`;
  if (formato === "roas") return `${valor.toFixed(2)}x`;
  return formatNumber(valor);
}

function formatFecha(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

// Barras: una serie por métrica. Línea: área suave con degradado y puntos huecos
// (el mismo estilo del gráfico de tendencia de Hotmart).
export default function SerieDiariaChart({
  puntos,
  metricas,
  tipo,
}: {
  puntos: PuntoDia[];
  metricas: MetricaSerie[];
  tipo: TipoGrafico;
}) {
  if (metricas.length === 0) {
    return <p className="text-sm text-on-surface-faint">Elegí al menos una métrica para ver la evolución.</p>;
  }
  if (puntos.length === 0) {
    return <p className="text-sm text-on-surface-faint">Sin datos diarios en los últimos 30 días para lo seleccionado.</p>;
  }

  const [izq, der] = metricas;
  const mIzq = metricaSerie(izq);
  const mDer = der ? metricaSerie(der) : null;
  const data = puntos.map((p) => ({ ...p, fechaLabel: formatFecha(p.fecha) }));
  const valorMax = Math.max(0, ...data.map((p) => p[izq] ?? 0));
  const anchoEje = Math.max(48, formatNumber(valorMax).length * 7 + 12);

  const series = [
    { key: izq, metrica: mIzq, eje: "izq", color: COLOR_IZQ },
    ...(mDer && der ? [{ key: der, metrica: mDer, eje: "der", color: COLOR_DER }] : []),
  ];

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline)" vertical={false} />
          <XAxis
            dataKey="fechaLabel"
            tick={{ fill: "var(--color-on-surface-faint)", fontSize: 11 }}
            axisLine={{ stroke: "var(--color-outline)" }}
            tickLine={false}
          />
          <YAxis
            yAxisId="izq"
            tick={{ fill: "var(--color-on-surface-faint)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={anchoEje}
            tickFormatter={(v) => formatear(v, mIzq.formato)}
          />
          {mDer && (
            <YAxis
              yAxisId="der"
              orientation="right"
              tick={{ fill: "var(--color-on-surface-faint)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={56}
              tickFormatter={(v) => formatear(v, mDer.formato)}
            />
          )}
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-outline)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(valor, nombre) => {
              const m = nombre === mIzq.label ? mIzq : mDer;
              return [formatear(typeof valor === "number" ? valor : null, m?.formato ?? "numero"), nombre];
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />

          {series.map((s) =>
            tipo === "barras" ? (
              <Bar
                key={s.key}
                yAxisId={s.eje}
                dataKey={s.key}
                name={s.metrica.label}
                fill={s.color}
                radius={[4, 4, 0, 0]}
              />
            ) : (
              <Area
                key={s.key}
                yAxisId={s.eje}
                dataKey={s.key}
                name={s.metrica.label}
                type="monotone"
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#grad-${s.key})`}
                dot={{ r: 3, fill: "var(--color-surface)", stroke: s.color, strokeWidth: 2 }}
                activeDot={{ r: 5 }}
              />
            )
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
