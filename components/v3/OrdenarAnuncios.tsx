"use client";

import { ArrowDownUp } from "lucide-react";
import { METRICAS, OrdenAnuncios } from "@/lib/v3/analisis-anuncios";

// Selector "Ordenar" de Análisis de Anuncios: cualquier métrica, en ascendente o
// descendente. "Orden del grupo" deja el orden que trae el grupo activo.
export default function OrdenarAnuncios({
  orden,
  onChange,
}: {
  orden: OrdenAnuncios;
  onChange: (orden: OrdenAnuncios) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="flex items-center gap-2 text-[13px] text-on-surface-variant">
        Ordenar:
        <select
          value={orden.metrica ?? ""}
          onChange={(e) => onChange({ ...orden, metrica: (e.target.value || null) as OrdenAnuncios["metrica"] })}
          className="bg-surface-high border border-outline rounded-lg px-3 py-1.5 text-[13px] text-on-surface"
        >
          <option value="">Orden del grupo</option>
          {METRICAS.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={() => onChange({ ...orden, direccion: orden.direccion === "desc" ? "asc" : "desc" })}
        disabled={!orden.metrica}
        aria-label={orden.direccion === "desc" ? "Ordenar de menor a mayor" : "Ordenar de mayor a menor"}
        title={orden.direccion === "desc" ? "Mayor a menor" : "Menor a mayor"}
        className="press w-8 h-8 rounded-lg border border-outline grid place-items-center text-on-surface-variant hover:text-on-surface disabled:opacity-40 transition-colors duration-150"
      >
        <ArrowDownUp size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
