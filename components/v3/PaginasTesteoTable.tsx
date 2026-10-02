"use client";

import { PaginaTesteo } from "@/lib/v3/embudo";
import { formatNumber, formatPercent } from "@/lib/webinar-os/aggregate";

// Compara páginas de testeo (A/B) de un mismo lanzamiento. "Visitas" viene
// del pixel propio (cada página siempre tiene su endpoint de visita, ver
// Endpoints) — si da 0 con registrados > 0, lo más probable es que todavía
// no se haya pegado el snippet en la página, no que nadie la haya visitado.
export default function PaginasTesteoTable({ rows }: { rows: PaginaTesteo[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-on-surface-faint">Todavía no hay páginas de testeo (puntos de captación) en este dashboard.</p>;
  }

  const ordenadas = [...rows].sort((a, b) => b.registrados - a.registrados);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-on-surface-faint text-[11px] uppercase tracking-wide">
            <th className="py-2 pr-4 font-medium">Página</th>
            <th className="py-2 pr-4 font-medium">Visitas</th>
            <th className="py-2 pr-4 font-medium">Registrados</th>
            <th className="py-2 pr-4 font-medium">% Conversión</th>
            <th className="py-2 pr-4 font-medium">Encuesta</th>
            <th className="py-2 pr-4 font-medium">Entró al grupo</th>
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((r) => (
            <tr key={r.id} className="border-t border-outline">
              <td className="py-2 pr-4">
                <div className="text-on-surface">{r.nombre}</div>
                {r.visitas === 0 && r.registrados > 0 && (
                  <div className="text-[11px] text-on-surface-faint">¿Ya pegaste el pixel de visitas en esta página?</div>
                )}
              </td>
              <td className="py-2 pr-4 text-on-surface tabular">{formatNumber(r.visitas)}</td>
              <td className="py-2 pr-4 text-on-surface tabular">{formatNumber(r.registrados)}</td>
              <td className="py-2 pr-4 text-on-surface tabular">{formatPercent(r.conversion ?? undefined)}</td>
              <td className="py-2 pr-4 text-on-surface tabular">{formatNumber(r.encuesta)}</td>
              <td className="py-2 pr-4 text-on-surface tabular">{formatNumber(r.grupo)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
