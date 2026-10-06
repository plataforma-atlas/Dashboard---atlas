"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { ConfigAnalisis, CONFIG_POR_DEFECTO, EstadoFiltro, GRUPOS, GrupoKey, METRICAS, MetricaKey } from "@/lib/v3/analisis-anuncios";

const ESTADOS: { key: EstadoFiltro; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "activos", label: "Activos" },
  { key: "pausados", label: "Pausados" },
];

export default function AnalisisFiltrosModal({
  config,
  campanas,
  onAplicar,
  onClose,
}: {
  config: ConfigAnalisis;
  campanas: { id: string; nombre: string }[];
  onAplicar: (config: ConfigAnalisis) => void;
  onClose: () => void;
}) {
  const [borrador, setBorrador] = useState<ConfigAnalisis>(config);

  function toggleMetrica(key: MetricaKey) {
    setBorrador((b) => ({
      ...b,
      metricas: b.metricas.includes(key) ? b.metricas.filter((m) => m !== key) : [...b.metricas, key],
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="analisis-filtros-titulo"
        className="animate-fade-in-up relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-surface border border-outline rounded-2xl shadow-lg p-6 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="analisis-filtros-titulo" className="text-[15px] font-semibold text-on-surface">
              Filtros y métricas
            </h3>
            <p className="text-[13px] text-on-surface-variant">Elegí qué ver en cada anuncio y cómo ordenarlos.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="press text-on-surface-faint hover:text-on-surface shrink-0">
            <X size={18} />
          </button>
        </div>

        <section className="flex flex-col gap-2.5">
          <h4 className="text-[12px] uppercase tracking-wide text-on-surface-faint">Grupo</h4>
          <div className="flex flex-wrap gap-2">
            {GRUPOS.map((g) => (
              <Pildora
                key={g.key}
                activo={borrador.grupo === (g.key as GrupoKey)}
                deshabilitado={!g.disponible}
                etiquetaExtra={g.disponible ? undefined : "Pronto"}
                onClick={() => setBorrador((b) => ({ ...b, grupo: g.key }))}
              >
                {g.label}
              </Pildora>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2.5">
          <h4 className="text-[12px] uppercase tracking-wide text-on-surface-faint">Métricas</h4>
          <div className="grid grid-cols-2 gap-2">
            {METRICAS.map((m) => {
              const marcada = borrador.metricas.includes(m.key);
              return (
                <button
                  key={m.key}
                  type="button"
                  disabled={!m.disponible}
                  onClick={() => toggleMetrica(m.key)}
                  aria-pressed={marcada}
                  className={`press flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left text-[13px] transition-colors duration-150 ${
                    !m.disponible
                      ? "border-outline text-on-surface-faint cursor-not-allowed"
                      : marcada
                        ? "border-primary bg-primary/10 text-on-surface"
                        : "border-outline text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded grid place-items-center border shrink-0 ${
                      marcada && m.disponible ? "bg-primary border-primary text-on-primary" : "border-outline"
                    }`}
                  >
                    {marcada && m.disponible && <Check size={11} strokeWidth={3} />}
                  </span>
                  <span className="flex-1">{m.label}</span>
                  {!m.disponible && <span className="text-[10px] uppercase tracking-wide text-on-surface-faint">Pronto</span>}
                </button>
              );
            })}
          </div>
          {borrador.metricas.length === 0 && (
            <p className="text-[12px] text-on-surface-faint">Elegí al menos una métrica para ver en las tarjetas.</p>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h4 className="text-[12px] uppercase tracking-wide text-on-surface-faint">Filtros</h4>

          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] text-on-surface-variant">Estado del anuncio</span>
            <div className="flex flex-wrap gap-2">
              {ESTADOS.map((e) => (
                <Pildora key={e.key} activo={borrador.estado === e.key} onClick={() => setBorrador((b) => ({ ...b, estado: e.key }))}>
                  {e.label}
                </Pildora>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] text-on-surface-variant">Campaña</span>
            <select
              value={borrador.campana}
              onChange={(e) => setBorrador((b) => ({ ...b, campana: e.target.value }))}
              className="bg-surface-high border border-outline rounded-lg px-3 py-2 text-[13px] text-on-surface"
            >
              <option value="">Todas las campañas</option>
              {campanas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] text-on-surface-variant">Gasto mínimo</span>
            <input
              type="number"
              min={0}
              value={borrador.gastoMinimo || ""}
              placeholder="0"
              onChange={(e) => setBorrador((b) => ({ ...b, gastoMinimo: Math.max(0, Number(e.target.value) || 0) }))}
              className="bg-surface-high border border-outline rounded-lg px-3 py-2 text-[13px] text-on-surface tabular"
            />
          </label>
        </section>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-outline">
          <button
            type="button"
            onClick={() => setBorrador(CONFIG_POR_DEFECTO)}
            className="press text-[13px] text-on-surface-variant hover:text-on-surface transition-colors duration-150"
          >
            Restablecer
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="press px-4 py-2 rounded-lg border border-outline text-[13px] text-on-surface-variant hover:text-on-surface transition-colors duration-150"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={borrador.metricas.length === 0}
              onClick={() => onAplicar(borrador)}
              className="press px-4 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-medium disabled:opacity-50 transition-opacity duration-150"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pildora({
  activo,
  deshabilitado,
  etiquetaExtra,
  onClick,
  children,
}: {
  activo: boolean;
  deshabilitado?: boolean;
  etiquetaExtra?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={deshabilitado}
      onClick={onClick}
      aria-pressed={activo}
      className={`press inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[13px] transition-colors duration-150 ${
        deshabilitado
          ? "border-outline text-on-surface-faint cursor-not-allowed"
          : activo
            ? "border-primary bg-primary/10 text-on-surface"
            : "border-outline text-on-surface-variant hover:text-on-surface"
      }`}
    >
      {children}
      {etiquetaExtra && <span className="text-[10px] uppercase tracking-wide text-on-surface-faint">{etiquetaExtra}</span>}
    </button>
  );
}
