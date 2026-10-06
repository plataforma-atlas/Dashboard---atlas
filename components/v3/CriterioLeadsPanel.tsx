"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { V3Lead } from "@/lib/v3/types";
import { formatNumber } from "@/lib/webinar-os/aggregate";
import {
  CRITERIO_POR_DEFECTO,
  CriterioLeads,
  preguntasDisponibles,
  respuestasCalificadas,
  respuestasDePregunta,
  sanitizarCriterio,
} from "@/lib/v3/analisis-anuncios";

// Panel del grupo "Mejores leads": el cliente elige la pregunta de la encuesta y cómo
// decide qué respuesta es calificada: por monto (las N más altas o desde un mínimo)
// o marcando las respuestas a mano. Las respuestas salen de los leads reales del
// dashboard, así sirve con cualquier encuesta.
export default function CriterioLeadsPanel({
  leads,
  criterio,
  dashboardElegido,
  puedeEscribir,
  abierto,
  onToggleAbierto,
  onChange,
  onGuardarGrupo,
}: {
  leads: V3Lead[];
  criterio: CriterioLeads | null;
  dashboardElegido: boolean;
  puedeEscribir: boolean;
  abierto: boolean;
  onToggleAbierto: () => void;
  onChange: (criterio: CriterioLeads) => void;
  onGuardarGrupo: (nombre: string) => Promise<string | null>;
}) {
  const preguntas = useMemo(() => preguntasDisponibles(leads), [leads]);
  const textoPregunta = preguntas.find((p) => p.clave === criterio?.pregunta)?.texto ?? criterio?.pregunta ?? "";
  const [guardandoAbierto, setGuardandoAbierto] = useState(false);
  const [nombreGrupo, setNombreGrupo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!nombreGrupo.trim()) return;
    setGuardando(true);
    const err = await onGuardarGrupo(nombreGrupo.trim());
    setGuardando(false);
    setErrorGuardar(err);
    if (!err) {
      setNombreGrupo("");
      setGuardandoAbierto(false);
    }
  }

  if (!dashboardElegido) {
    return <p className="text-[13px] text-on-surface-faint">Elegí un dashboard para calcular los mejores leads.</p>;
  }
  if (preguntas.length === 0) {
    return <p className="text-[13px] text-on-surface-faint">Todavía no hay respuestas de encuesta en este dashboard.</p>;
  }

  const base = criterio ?? CRITERIO_POR_DEFECTO;
  const respuestas = criterio ? respuestasDePregunta(leads, criterio.pregunta) : [];
  const calificadas = criterio ? respuestasCalificadas(criterio, respuestas) : new Set<string>();
  const sinMonto = respuestas.filter((r) => r.monto === null);

  function cambiar(parcial: Partial<CriterioLeads>) {
    const nuevo = sanitizarCriterio({ ...base, ...parcial });
    if (nuevo) onChange(nuevo);
  }

  // Cambiar pregunta borra las respuestas marcadas: eran de la pregunta anterior.
  function cambiarPregunta(pregunta: string) {
    cambiar({ pregunta, respuestas: [], modo: base.modo === "manual" ? "top" : base.modo });
  }

  // Marcar o desmarcar una respuesta pasa el criterio a "manual", partiendo de lo que
  // ya estaba calificado en el modo anterior.
  function alternar(label: string) {
    const siguiente = new Set(calificadas);
    if (siguiente.has(label)) siguiente.delete(label);
    else siguiente.add(label);
    cambiar({ modo: "manual", respuestas: [...siguiente] });
  }

  const resumen =
    criterio?.modo === "manual"
      ? `${criterio.respuestas.length} respuestas marcadas`
      : criterio?.modo === "minimo"
        ? `monto desde ${formatNumber(criterio.minimo)}`
        : `las ${criterio?.n ?? 0} de mayor monto`;

  if (!abierto && criterio) {
    return (
      <div className="animate-fade-in-up bg-surface border border-outline rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-on-surface-variant min-w-0 truncate">
          <span className="text-on-surface font-medium">Criterio:</span> {textoPregunta} · {resumen}
        </p>
        <button
          type="button"
          onClick={onToggleAbierto}
          className="press px-3 py-1.5 rounded-lg border border-outline text-[13px] text-on-surface-variant hover:text-on-surface transition-colors duration-150 shrink-0"
        >
          Editar criterio
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up bg-surface border border-outline rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-[13px] font-medium text-on-surface">Criterio de leads calificados</h2>
          <p className="text-[12px] text-on-surface-faint">Elegí la pregunta y cuál respuesta cuenta como calificada.</p>
        </div>
        {criterio && (
          <button
            type="button"
            onClick={onToggleAbierto}
            className="press px-3 py-1.5 rounded-lg border border-outline text-[13px] text-on-surface-variant hover:text-on-surface transition-colors duration-150 shrink-0"
          >
            Ocultar
          </button>
        )}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] text-on-surface-variant">Pregunta</span>
        <select
          value={criterio?.pregunta ?? ""}
          onChange={(e) => cambiarPregunta(e.target.value)}
          className="bg-surface-high border border-outline rounded-lg px-3 py-2 text-[13px] text-on-surface"
        >
          {!criterio && <option value="">Elegí una pregunta</option>}
          {preguntas.map((p) => (
            <option key={p.clave} value={p.clave}>
              {p.texto}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-[12px] text-on-surface-variant">Regla</span>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-on-surface">
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="modo-criterio" checked={base.modo === "top"} onChange={() => cambiar({ modo: "top" })} />
            Las
            <input
              type="number"
              min={1}
              max={10}
              value={base.n}
              disabled={!criterio || base.modo !== "top"}
              onChange={(e) => cambiar({ n: Number(e.target.value) })}
              className="w-16 bg-surface-high border border-outline rounded-lg px-2 py-1 text-[13px] text-on-surface tabular disabled:opacity-50"
            />
            de mayor monto
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="modo-criterio" checked={base.modo === "minimo"} onChange={() => cambiar({ modo: "minimo" })} />
            Monto desde
            <input
              type="number"
              min={0}
              value={base.minimo || ""}
              placeholder="0"
              disabled={!criterio || base.modo !== "minimo"}
              onChange={(e) => cambiar({ minimo: Math.max(0, Number(e.target.value) || 0) })}
              className="w-24 bg-surface-high border border-outline rounded-lg px-2 py-1 text-[13px] text-on-surface tabular disabled:opacity-50"
            />
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="modo-criterio"
              checked={base.modo === "manual"}
              disabled={!criterio}
              onChange={() => cambiar({ modo: "manual", respuestas: [...calificadas] })}
            />
            Elegir a mano
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[12px] text-on-surface-variant">Respuestas de esta pregunta · tocá una para marcarla</span>
        {!criterio && <p className="text-[13px] text-on-surface-faint">Elegí una pregunta para ver sus respuestas.</p>}
        {criterio && respuestas.length === 0 && (
          <p className="text-[13px] text-on-surface-faint">Ningún lead respondió esta pregunta.</p>
        )}
        {respuestas.map((r) => {
          const cuenta = calificadas.has(r.label);
          return (
            <button
              key={r.label}
              type="button"
              onClick={() => alternar(r.label)}
              aria-pressed={cuenta}
              className={`press flex items-center gap-3 px-3 py-2 rounded-lg border text-left text-[13px] transition-colors duration-150 ${
                cuenta ? "border-primary bg-primary/10 text-on-surface" : "border-outline text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span
                className={`w-4 h-4 rounded grid place-items-center border shrink-0 ${
                  cuenta ? "bg-primary border-primary text-on-primary" : "border-outline"
                }`}
              >
                {cuenta && <Check size={11} strokeWidth={3} />}
              </span>
              <span className="flex-1 min-w-0 truncate" title={r.label}>
                {r.label}
              </span>
              <span className="text-[12px] text-on-surface-faint tabular shrink-0">
                {r.monto === null ? "sin monto" : `monto ${formatNumber(r.monto)}`}
              </span>
              <span className="text-[12px] text-on-surface-faint tabular shrink-0">{r.count} leads</span>
            </button>
          );
        })}
        {sinMonto.length > 0 && base.modo !== "manual" && (
          <p className="text-[12px] text-on-surface-faint">Las respuestas sin monto solo cuentan si las marcás a mano.</p>
        )}
      </div>

      {criterio && puedeEscribir && (
        <div className="flex flex-col gap-2 pt-3 border-t border-outline">
          {!guardandoAbierto ? (
            <button
              type="button"
              onClick={() => setGuardandoAbierto(true)}
              className="press self-start px-3.5 py-2 rounded-lg border border-primary text-[13px] text-on-surface hover:bg-primary/10 transition-colors duration-150"
            >
              Guardar este criterio como grupo
            </button>
          ) : (
            <form onSubmit={guardar} className="animate-fade-in-up flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={nombreGrupo}
                onChange={(e) => setNombreGrupo(e.target.value)}
                maxLength={60}
                placeholder="Nombre del grupo"
                autoFocus
                className="bg-surface-high border border-outline rounded-lg px-3 py-2 text-[13px] text-on-surface min-w-56"
              />
              <button
                type="submit"
                disabled={!nombreGrupo.trim() || guardando}
                className="press px-3.5 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-medium disabled:opacity-50"
              >
                Guardar grupo
              </button>
              <button
                type="button"
                onClick={() => {
                  setGuardandoAbierto(false);
                  setErrorGuardar(null);
                }}
                className="press text-[13px] text-on-surface-variant hover:text-on-surface"
              >
                Cancelar
              </button>
            </form>
          )}
          {errorGuardar && <p className="text-[13px] text-error">{errorGuardar}</p>}
        </div>
      )}
    </div>
  );
}
