"use client";

import { V3PreguntaTipo } from "@/lib/v3/types";

export default function EncuestaPreguntaPanel({
  pregunta,
  tipo,
  opciones,
  respuestasLibres,
  total,
}: {
  pregunta: string;
  tipo: V3PreguntaTipo;
  opciones: { label: string; count: number }[];
  respuestasLibres: string[];
  total: number;
}) {
  const max = Math.max(1, ...opciones.map((o) => o.count));

  return (
    <div className="bg-surface border border-outline rounded-xl p-4 flex flex-col gap-3">
      <h3 className="text-sm font-medium text-on-surface">{pregunta}</h3>
      {total === 0 ? (
        <p className="text-sm text-on-surface-faint">Sin respuestas todavía.</p>
      ) : tipo === "libre" ? (
        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
          {respuestasLibres.map((r, i) => (
            <p key={i} className="text-xs text-on-surface-variant border-l-2 border-outline pl-2">
              {r}
            </p>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {opciones.map((o) => (
            <div key={o.label} className="flex flex-col gap-1">
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs text-on-surface-variant">{o.label}</span>
                <span className="text-xs text-on-surface tabular shrink-0">
                  {((o.count / total) * 100).toFixed(1)}% ({o.count})
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-high overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, (o.count / max) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
