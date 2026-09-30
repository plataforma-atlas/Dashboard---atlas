"use client";

import { RangoRapido, RANGO_RAPIDO_LABEL, rangoRapido } from "@/lib/webinar-os/control-center/dateRanges";

const PRESETS: Exclude<RangoRapido, "custom">[] = ["today", "7days", "30days", "90days", "all"];

// Filtra por fecha lo que es 100% nuestro (leads/ventas propios, vía
// client_leads.created_at) — Meta Ads sigue fijo en "últimos 30 días" porque
// el pull de n8n todavía no acepta un rango de fechas custom.
export default function V3PeriodFilter({
  value,
  onChange,
}: {
  value: Exclude<RangoRapido, "custom">;
  onChange: (preset: Exclude<RangoRapido, "custom">, rango: { fecha_inicio: string; fecha_fin: string }) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {PRESETS.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p, rangoRapido(p))}
          className={`press rounded-full px-3 py-1.5 text-[13px] font-medium border transition-colors duration-150 ${
            value === p
              ? "bg-primary text-on-primary border-primary"
              : "border-outline text-on-surface-variant hover:text-on-surface hover:border-primary"
          }`}
        >
          {RANGO_RAPIDO_LABEL[p]}
        </button>
      ))}
    </div>
  );
}
