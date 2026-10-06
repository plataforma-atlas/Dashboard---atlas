"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { EVENTOS, EventoKey, ReglaConversion, TIPOS_COMBINACION, TipoCombinacion } from "@/lib/v3/conversiones";

// Constructor de conversiones personalizadas: la persona combina dos eventos de sus
// leads, les pone nombre y la conversión queda disponible como columna.
export default function CrearConversion({
  onGuardar,
  onClose,
}: {
  onGuardar: (nombre: string, config: ReglaConversion) => Promise<string | null>;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoCombinacion>("y");
  const [a, setA] = useState<EventoKey>("encuesta");
  const [b, setB] = useState<EventoKey>("comprado");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const etiqueta = (k: EventoKey) => EVENTOS.find((e) => e.key === k)?.label ?? k;
  const resumen =
    tipo === "y"
      ? `${etiqueta(a)} Y ${etiqueta(b)}`
      : tipo === "luego"
        ? `${etiqueta(a)}, y después ${etiqueta(b).toLowerCase()}`
        : `${etiqueta(a)}, pero no ${etiqueta(b).toLowerCase()}`;
  const ayudaTipo = TIPOS_COMBINACION.find((t) => t.key === tipo)?.ayuda;
  const mismosEventos = a === b;

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || mismosEventos) return;
    setGuardando(true);
    const err = await onGuardar(nombre.trim(), { tipo, a, b });
    setGuardando(false);
    setError(err);
    if (!err) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="crear-conversion-titulo"
        onSubmit={guardar}
        className="animate-fade-in-up relative w-full max-w-lg bg-surface border border-outline rounded-2xl shadow-lg p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="crear-conversion-titulo" className="text-[15px] font-semibold text-on-surface">
              Crear conversión
            </h3>
            <p className="text-[13px] text-on-surface-variant">Combiná dos eventos de tus leads y dale un nombre.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="press text-on-surface-faint hover:text-on-surface shrink-0">
            <X size={18} />
          </button>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] text-on-surface-variant">Nombre</span>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={60}
            placeholder="Ej. Compradores con encuesta"
            autoFocus
            className="bg-surface-high border border-outline rounded-lg px-3 py-2 text-[13px] text-on-surface"
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-[12px] text-on-surface-variant">Combinación</span>
          <div className="flex flex-wrap gap-2">
            {TIPOS_COMBINACION.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTipo(t.key)}
                aria-pressed={tipo === t.key}
                className={`press px-3.5 py-1.5 rounded-full border text-[13px] transition-colors duration-150 ${
                  tipo === t.key ? "border-primary bg-primary/10 text-on-surface" : "border-outline text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-[12px] text-on-surface-faint">{ayudaTipo}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] text-on-surface-variant">Primer evento</span>
            <select
              value={a}
              onChange={(e) => setA(e.target.value as EventoKey)}
              className="bg-surface-high border border-outline rounded-lg px-3 py-2 text-[13px] text-on-surface"
            >
              {EVENTOS.map((ev) => (
                <option key={ev.key} value={ev.key}>
                  {ev.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] text-on-surface-variant">Segundo evento</span>
            <select
              value={b}
              onChange={(e) => setB(e.target.value as EventoKey)}
              className="bg-surface-high border border-outline rounded-lg px-3 py-2 text-[13px] text-on-surface"
            >
              {EVENTOS.map((ev) => (
                <option key={ev.key} value={ev.key}>
                  {ev.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-lg border border-outline bg-surface-high px-4 py-3">
          <p className="text-[12px] text-on-surface-faint">Se cuenta cuando el lead cumple:</p>
          <p className="text-[13px] text-on-surface font-medium">{resumen}</p>
        </div>

        {mismosEventos && <p className="text-[13px] text-error">Elegí dos eventos distintos.</p>}
        {error && <p className="text-[13px] text-error">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="press px-4 py-2 rounded-lg border border-outline text-[13px] text-on-surface-variant hover:text-on-surface transition-colors duration-150"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!nombre.trim() || mismosEventos || guardando}
            className="press px-4 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-medium disabled:opacity-50 transition-opacity duration-150"
          >
            Guardar conversión
          </button>
        </div>
      </form>
    </div>
  );
}
