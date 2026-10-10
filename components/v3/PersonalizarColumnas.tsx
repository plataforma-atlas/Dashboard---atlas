"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, Search, Trash2, X } from "lucide-react";
import { COLUMNAS_POR_DEFECTO, CategoriaColumna, ColumnaKey, DefColumna, columnaDef } from "@/lib/v3/columnas-tabla";

const CATEGORIAS: CategoriaColumna[] = ["Tráfico", "Conversión", "VTurb", "Conversiones personalizadas"];

// Popup para elegir qué columnas ve la persona en las tablas del Administrador de
// Anuncios, y en qué orden. Los cambios se aplican al tocar "Activar".
export default function PersonalizarColumnas({
  columnas,
  definiciones,
  onAplicar,
  onCrearConversion,
  onEliminarConversion,
  onClose,
}: {
  columnas: ColumnaKey[];
  definiciones: DefColumna[];
  onAplicar: (columnas: ColumnaKey[]) => void;
  onCrearConversion: () => void;
  onEliminarConversion: (key: ColumnaKey) => Promise<string | null>;
  onClose: () => void;
}) {
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  async function eliminar(key: ColumnaKey) {
    setErrorEliminar(null);
    const err = await onEliminarConversion(key);
    if (err) setErrorEliminar(err);
  }

  const etiqueta = (key: ColumnaKey) => columnaDef(key, definiciones)?.label ?? key;
  const [borrador, setBorrador] = useState<ColumnaKey[]>(columnas);
  const [busqueda, setBusqueda] = useState("");

  const texto = busqueda.trim().toLowerCase();
  const coincide = (label: string) => !texto || label.toLowerCase().includes(texto);

  const seleccionadas = useMemo(() => new Set(borrador), [borrador]);

  function alternar(key: ColumnaKey) {
    setBorrador((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function mover(index: number, direccion: -1 | 1) {
    setBorrador((prev) => {
      const destino = index + direccion;
      if (destino < 0 || destino >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[destino]] = [next[destino], next[index]];
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="personalizar-columnas-titulo"
        className="animate-fade-in-up relative w-full max-w-3xl max-h-[85vh] bg-surface border border-outline rounded-2xl shadow-lg flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-outline">
          <h3 id="personalizar-columnas-titulo" className="text-[15px] font-semibold text-on-surface">
            Personalizar columnas
          </h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="press text-on-surface-faint hover:text-on-surface">
            <X size={18} />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-0 min-h-0 flex-1 overflow-hidden">
          <div className="flex flex-col gap-4 p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-outline">
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-outline bg-surface-high">
              <Search size={15} className="text-on-surface-faint" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar métricas"
                className="flex-1 bg-transparent text-[13px] text-on-surface outline-none placeholder:text-on-surface-faint"
              />
            </label>

            {CATEGORIAS.map((categoria) => {
              const items = definiciones.filter((c) => c.categoria === categoria && coincide(c.label));
              if (items.length === 0 && categoria !== "Conversiones personalizadas") return null;
              return (
                <section key={categoria} className="flex flex-col gap-2">
                  <h4 className="text-[11px] uppercase tracking-wide text-on-surface-faint">{categoria}</h4>
                  {items.map((c) => {
                    const marcada = seleccionadas.has(c.key);
                    const esConversion = c.key.startsWith("conv:");
                    return (
                      <div key={c.key} className="flex items-center gap-2">
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => alternar(c.key)}
                        aria-pressed={marcada}
                        className={`press flex items-center gap-3 px-3 py-2 rounded-lg border text-left text-[13px] transition-colors duration-150 ${
                          marcada ? "border-primary bg-primary/10 text-on-surface" : "border-outline text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded grid place-items-center border shrink-0 ${
                            marcada ? "bg-primary border-primary text-on-primary" : "border-outline"
                          }`}
                        >
                          {marcada && <Check size={11} strokeWidth={3} />}
                        </span>
                        {c.label}
                      </button>
                      {esConversion && (
                        <button
                          type="button"
                          onClick={() => eliminar(c.key)}
                          aria-label={`Eliminar ${c.label}`}
                          className="press w-8 h-8 shrink-0 grid place-items-center rounded-md text-on-surface-faint hover:text-error"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      </div>
                    );
                  })}
                </section>
              );
            })}

            {errorEliminar && <p className="text-[13px] text-error">{errorEliminar}</p>}

            <button
              type="button"
              onClick={onCrearConversion}
              className="press self-start inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-outline text-[13px] text-on-surface-variant hover:text-on-surface transition-colors duration-150"
            >
              + Crear conversión
            </button>
          </div>

          <div className="flex flex-col gap-3 p-6 overflow-y-auto">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] text-on-surface font-medium">
                {borrador.length} {borrador.length === 1 ? "columna seleccionada" : "columnas seleccionadas"}
              </span>
              <button
                type="button"
                onClick={() => setBorrador(COLUMNAS_POR_DEFECTO)}
                className="press text-[12px] text-on-surface-variant hover:text-on-surface"
              >
                Restablecer
              </button>
            </div>
            <p className="text-[12px] text-on-surface-faint">Las columnas se muestran en este orden, de izquierda a derecha.</p>

            {borrador.length === 0 && <p className="text-[13px] text-on-surface-faint">Elegí al menos una columna.</p>}

            {borrador.map((key, index) => (
              <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-outline text-[13px] text-on-surface">
                <span className="flex-1 min-w-0 truncate">{etiqueta(key)}</span>
                <button
                  type="button"
                  onClick={() => mover(index, -1)}
                  disabled={index === 0}
                  aria-label={`Mover ${etiqueta(key)} a la izquierda`}
                  className="press w-7 h-7 grid place-items-center rounded-md text-on-surface-faint hover:text-on-surface disabled:opacity-30"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => mover(index, 1)}
                  disabled={index === borrador.length - 1}
                  aria-label={`Mover ${etiqueta(key)} a la derecha`}
                  className="press w-7 h-7 grid place-items-center rounded-md text-on-surface-faint hover:text-on-surface disabled:opacity-30"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => alternar(key)}
                  aria-label={`Quitar ${etiqueta(key)}`}
                  className="press w-7 h-7 grid place-items-center rounded-md text-on-surface-faint hover:text-on-surface"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-outline">
          <button
            type="button"
            onClick={onClose}
            className="press px-4 py-2 rounded-lg border border-outline text-[13px] text-on-surface-variant hover:text-on-surface transition-colors duration-150"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={borrador.length === 0}
            onClick={() => onAplicar(borrador)}
            className="press px-4 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-medium disabled:opacity-50 transition-opacity duration-150"
          >
            Activar
          </button>
        </div>
      </div>
    </div>
  );
}
