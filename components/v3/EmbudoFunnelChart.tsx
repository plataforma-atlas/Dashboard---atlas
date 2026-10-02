"use client";

import { formatNumber } from "@/lib/webinar-os/aggregate";
import { EmbudoEtapa } from "@/lib/v3/embudo";

const ALTO_FRANJA = 44;
const ESPACIO_FRANJA = 6;
const ANCHO_MINIMO = 18;

export default function EmbudoFunnelChart({ etapas, compraron }: { etapas: EmbudoEtapa[]; compraron: number }) {
  const max = etapas[0]?.count ?? 0;

  if (max === 0) {
    return (
      <div className="bg-surface border border-outline rounded-xl p-4 flex flex-col gap-3">
        <h3 className="text-[11px] uppercase tracking-wide text-on-surface-variant font-medium">Embudo de lanzamiento</h3>
        <p className="text-sm text-on-surface-faint">Sin datos todavía en el período.</p>
      </div>
    );
  }

  // Un solo gradiente "de verdad" cubre todo el alto del cono (de primary a
  // secondary); cada franja solo muestra su propia porción vía
  // backgroundPosition, en vez de tener su propio color sólido — así el
  // degradé se ve continuo entre franjas aunque cada una sea su propio div.
  const alturaTotal = etapas.length * (ALTO_FRANJA + ESPACIO_FRANJA);

  return (
    <div className="bg-surface border border-outline rounded-xl p-4 flex flex-col gap-4">
      <h3 className="text-[11px] uppercase tracking-wide text-on-surface-variant font-medium">Embudo de lanzamiento</h3>

      <div className="flex flex-col items-center" style={{ gap: ESPACIO_FRANJA }}>
        {etapas.map((etapa, i) => {
          const ancho = Math.max(ANCHO_MINIMO, (etapa.count / max) * 100);
          const porcentaje = max > 0 ? (etapa.count / max) * 100 : null;
          return (
            <div key={etapa.key} className="w-full flex flex-col items-center gap-1">
              <div
                className="flex items-center justify-center"
                style={{
                  width: `${ancho}%`,
                  height: ALTO_FRANJA,
                  clipPath: "polygon(0 0, 100% 0, 92% 100%, 8% 100%)",
                  backgroundImage: "linear-gradient(to bottom, var(--color-primary), var(--color-secondary))",
                  backgroundSize: `100% ${alturaTotal}px`,
                  backgroundPosition: `0 -${i * (ALTO_FRANJA + ESPACIO_FRANJA)}px`,
                }}
              >
                <span className="text-on-primary text-xs font-medium px-2 truncate" title={etapa.label}>
                  {etapa.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-on-surface-faint">
                <span className="text-on-surface font-medium tabular">{formatNumber(etapa.count)}</span>
                <span>· {porcentaje == null ? "—" : `${porcentaje.toFixed(0)}%`}</span>
              </div>
              {etapa.sinMatch ? (
                <p className="text-[11px] text-on-surface-faint text-center">
                  {formatNumber(etapa.count)} con match + {formatNumber(etapa.sinMatch)} sin match ={" "}
                  {formatNumber(etapa.count + etapa.sinMatch)} ingresos totales
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-1 pt-1">
        <div className="min-w-[128px] rounded-full bg-success py-2.5 px-5 flex items-center justify-center">
          <span className="text-on-primary text-xs font-semibold">Compraron</span>
        </div>
        <span className="text-on-surface font-medium text-sm tabular">{formatNumber(compraron)}</span>
      </div>
    </div>
  );
}
