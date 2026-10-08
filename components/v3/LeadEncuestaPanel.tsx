"use client";

import { X } from "lucide-react";
import { ENCUESTA_PREGUNTAS, PREGUNTA_VALOR_ALTO } from "@/lib/v3/embudo";

export default function LeadEncuestaPanel({
  nombre,
  respuestas,
  onClose,
}: {
  nombre: string | null;
  respuestas: Record<string, string>;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="animate-fade-in-up relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-surface border border-outline rounded-2xl shadow-lg p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[15px] font-semibold text-on-surface">Respuestas de la encuesta</h3>
            <p className="text-[13px] text-on-surface-variant">{nombre || "Este lead"}</p>
          </div>
          <button type="button" onClick={onClose} className="press text-on-surface-faint hover:text-on-surface shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {Object.entries(respuestas).map(([clave, respuesta]) => {
            if (!respuesta) return null;
            // La clave ya es el texto real de la pregunta (preguntas registradas
            // por dashboard) — ENCUESTA_PREGUNTAS solo queda como diccionario
            // de respaldo para leads viejos de demo, capturados con el sistema
            // de preguntas fijas anterior.
            const pregunta = ENCUESTA_PREGUNTAS.find((p) => p.clave === clave)?.pregunta ?? clave;
            const esAltoValor = respuesta === PREGUNTA_VALOR_ALTO.opcion;
            return (
              <div key={clave} className="flex flex-col gap-1">
                <p className="text-[12px] text-on-surface-faint">{pregunta}</p>
                <p className={`text-[13px] font-medium ${esAltoValor ? "text-success" : "text-on-surface"}`}>{respuesta}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
