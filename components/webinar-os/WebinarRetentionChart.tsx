"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatNumber, formatPercent, toRetentionSeries } from "@/lib/webinar-os/aggregate";
import { WebinarMetrics } from "@/lib/webinar-os/types";
import ModuleShell from "./ModuleShell";
import KpiCard from "./KpiCard";

export default function WebinarRetentionChart({ metrics }: { metrics: WebinarMetrics["webinar"] }) {
  const series = toRetentionSeries(metrics);

  return (
    <ModuleShell icon="🎥" title="Webinar">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Registrados" value={formatNumber(metrics.registrados)} />
        <KpiCard label="Asistentes en vivo" value={formatNumber(metrics.asistentes_en_vivo)} />
        <KpiCard label="Tiempo promedio" value={metrics.tiempo_promedio_min !== undefined ? `${metrics.tiempo_promedio_min} min` : "—"} />
        <KpiCard label="Tasa de asistencia" value={formatPercent(metrics.tasa_asistencia)} />
      </div>

      {series.length > 0 ? (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="wosRetentionFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--wos-primary)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--wos-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--wos-border)" />
              <XAxis dataKey="minuto" tick={{ fill: "var(--wos-ink-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--wos-border)" }} tickLine={false} tickFormatter={(v) => `${v}m`} />
              <YAxis tick={{ fill: "var(--wos-ink-muted)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                cursor={{ stroke: "var(--wos-border)" }}
                contentStyle={{ background: "var(--wos-surface)", border: "1px solid var(--wos-border)", borderRadius: 8, fontSize: 12, color: "var(--wos-ink)" }}
                labelStyle={{ color: "var(--wos-ink-muted)" }}
                formatter={(value: number) => [`${value}%`, "Retención"]}
                labelFormatter={(v) => `Minuto ${v}`}
              />
              <Area type="monotone" dataKey="porcentaje" stroke="var(--wos-primary)" fill="url(#wosRetentionFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-sm text-[var(--wos-ink-muted)] py-6 text-center">Sin datos de retención todavía.</p>
      )}
    </ModuleShell>
  );
}
