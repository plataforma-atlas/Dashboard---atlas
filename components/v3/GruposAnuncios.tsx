"use client";

import { useState } from "react";
import { Bookmark, X } from "lucide-react";
import { GRUPOS, GrupoGuardado, GrupoKey } from "@/lib/v3/analisis-anuncios";

// Barra de grupos de Análisis de Anuncios: predefinidos + los guardados del cliente.
// `activo` es "g:<grupo>" para un predefinido, "s:<id>" para uno guardado, o "libre".
export default function GruposAnuncios({
  guardados,
  activo,
  puedeEscribir,
  hayCambios,
  cantSeleccionados,
  onSeleccionarPredefinido,
  onSeleccionarGuardado,
  onGuardarNuevo,
  onActualizar,
  onEliminar,
}: {
  guardados: GrupoGuardado[];
  activo: string;
  puedeEscribir: boolean;
  hayCambios: boolean;
  cantSeleccionados: number;
  onSeleccionarPredefinido: (key: GrupoKey) => void;
  onSeleccionarGuardado: (grupo: GrupoGuardado) => void;
  onGuardarNuevo: (nombre: string, soloSeleccionados: boolean) => Promise<string | null>;
  onActualizar: () => Promise<string | null>;
  onEliminar: (id: number) => Promise<string | null>;
}) {
  const [formAbierto, setFormAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [soloSeleccionados, setSoloSeleccionados] = useState(false);
  const [confirmarId, setConfirmarId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setGuardando(true);
    const err = await onGuardarNuevo(nombre.trim(), soloSeleccionados && cantSeleccionados > 0);
    setGuardando(false);
    setError(err);
    if (!err) {
      setNombre("");
      setSoloSeleccionados(false);
      setFormAbierto(false);
    }
  }

  async function actualizar() {
    setGuardando(true);
    const err = await onActualizar();
    setGuardando(false);
    setError(err);
  }

  async function eliminar(id: number) {
    setGuardando(true);
    const err = await onEliminar(id);
    setGuardando(false);
    setConfirmarId(null);
    setError(err);
  }

  const grupoGuardadoActivo = activo.startsWith("s:") ? guardados.find((g) => `s:${g.id}` === activo) : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {GRUPOS.map((g) => {
          const esActivo = activo === `g:${g.key}`;
          return (
            <button
              key={g.key}
              type="button"
              disabled={!g.disponible}
              onClick={() => onSeleccionarPredefinido(g.key)}
              aria-pressed={esActivo}
              className={`press inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[13px] transition-colors duration-150 ${
                !g.disponible
                  ? "border-outline text-on-surface-faint cursor-not-allowed"
                  : esActivo
                    ? "border-primary bg-primary/10 text-on-surface"
                    : "border-outline text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {g.label}
              {!g.disponible && <span className="text-[10px] uppercase tracking-wide text-on-surface-faint">Pronto</span>}
            </button>
          );
        })}

        {guardados.length > 0 && <span aria-hidden="true" className="h-6 w-px bg-outline mx-1" />}

        {guardados.map((g) => {
          const esActivo = activo === `s:${g.id}`;
          return (
            <span
              key={g.id}
              className={`inline-flex items-center rounded-full border text-[13px] transition-colors duration-150 ${
                esActivo ? "border-primary bg-primary/10 text-on-surface" : "border-outline text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <button
                type="button"
                onClick={() => onSeleccionarGuardado(g)}
                aria-pressed={esActivo}
                className="press inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5"
              >
                <Bookmark size={12} strokeWidth={2} />
                {g.nombre}
              </button>
              {puedeEscribir && (
                <button
                  type="button"
                  onClick={() => setConfirmarId(g.id)}
                  aria-label={`Eliminar grupo ${g.nombre}`}
                  className="press pr-2.5 pl-0.5 py-1.5 text-on-surface-faint hover:text-on-surface"
                >
                  <X size={13} strokeWidth={2} />
                </button>
              )}
            </span>
          );
        })}

        {puedeEscribir && !formAbierto && (
          <button
            type="button"
            onClick={() => setFormAbierto(true)}
            className="press px-3.5 py-1.5 rounded-full border border-dashed border-outline text-[13px] text-on-surface-variant hover:text-on-surface transition-colors duration-150"
          >
            + Guardar como grupo
          </button>
        )}
      </div>

      {confirmarId !== null && (
        <div className="animate-fade-in-up flex flex-wrap items-center gap-3 text-[13px] text-on-surface-variant">
          <span>
            ¿Eliminar el grupo «{guardados.find((g) => g.id === confirmarId)?.nombre}»?
          </span>
          <button
            type="button"
            disabled={guardando}
            onClick={() => eliminar(confirmarId)}
            className="press px-3 py-1 rounded-lg border border-outline-error bg-error-container text-error font-medium disabled:opacity-50"
          >
            Sí, eliminar
          </button>
          <button type="button" onClick={() => setConfirmarId(null)} className="press hover:text-on-surface transition-colors duration-150">
            Cancelar
          </button>
        </div>
      )}

      {formAbierto && puedeEscribir && (
        <form onSubmit={guardar} className="animate-fade-in-up flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={60}
            placeholder="Nombre del grupo"
            autoFocus
            className="bg-surface-high border border-outline rounded-lg px-3 py-2 text-[13px] text-on-surface min-w-56"
          />
          <label className={`inline-flex items-center gap-2 text-[13px] ${cantSeleccionados === 0 ? "text-on-surface-faint" : "text-on-surface-variant"}`}>
            <input
              type="checkbox"
              checked={soloSeleccionados}
              disabled={cantSeleccionados === 0}
              onChange={(e) => setSoloSeleccionados(e.target.checked)}
            />
            Solo los {cantSeleccionados} anuncios seleccionados
          </label>
          <button
            type="submit"
            disabled={!nombre.trim() || guardando}
            className="press px-3.5 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-medium disabled:opacity-50"
          >
            Guardar grupo
          </button>
          <button
            type="button"
            onClick={() => {
              setFormAbierto(false);
              setError(null);
            }}
            className="press text-[13px] text-on-surface-variant hover:text-on-surface"
          >
            Cancelar
          </button>
        </form>
      )}

      {grupoGuardadoActivo && hayCambios && puedeEscribir && (
        <div className="flex items-center gap-3 text-[13px] text-on-surface-variant">
          <span>Cambiaste la configuración de «{grupoGuardadoActivo.nombre}».</span>
          <button
            type="button"
            disabled={guardando}
            onClick={actualizar}
            className="press px-3 py-1 rounded-lg border border-primary text-on-surface hover:bg-primary/10 transition-colors duration-150 disabled:opacity-50"
          >
            Guardar cambios en el grupo
          </button>
        </div>
      )}

      {error && <p className="text-[13px] text-error">{error}</p>}
    </div>
  );
}
