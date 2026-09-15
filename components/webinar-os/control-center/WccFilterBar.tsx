"use client";

import { useState } from "react";
import { Campaign } from "@/lib/types";
import { CampanaCartera } from "@/lib/webinar-os/control-center/types";
import { rangoRapido, semanasEspecificas, RangoRapido } from "@/lib/webinar-os/control-center/dateRanges";
import PrintButton from "./PrintButton";

const ESTRATEGIA_LABEL: Record<string, string> = {
  vsl: "VSL",
  evento_presencial: "Evento presencial",
  lanzamiento: "Lanzamiento",
};

type Props = {
  campanas: CampanaCartera[];
  otrasCampanas?: Campaign[];
  campanaSeleccionada: string;
  onCampanaChange: (v: string) => void;
  onAplicar: (fechaInicio: string, fechaFin: string) => void;
};

export default function WccFilterBar({ campanas, otrasCampanas = [], campanaSeleccionada, onCampanaChange, onAplicar }: Props) {
  const [periodo, setPeriodo] = useState<RangoRapido>("4weeks");
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [semanaSeleccionada, setSemanaSeleccionada] = useState(semanasEspecificas()[0]?.value ?? "");

  function aplicarPeriodoRapido(p: RangoRapido) {
    setPeriodo(p);
    const { fecha_inicio, fecha_fin } = rangoRapido(p);
    onAplicar(fecha_inicio, fecha_fin);
  }

  function aplicarSemanaEspecifica() {
    const semana = semanasEspecificas().find((s) => s.value === semanaSeleccionada);
    if (semana) onAplicar(semana.fecha_inicio, semana.fecha_fin);
    setPanelAbierto(false);
  }

  const semanas = semanasEspecificas();

  return (
    <div className="wcc-no-print relative flex items-center gap-2 flex-wrap">
      <select
        value={campanaSeleccionada}
        onChange={(e) => onCampanaChange(e.target.value)}
        className="border border-[var(--wos-border)] bg-[var(--wos-surface)] text-[var(--wos-ink)] rounded-lg px-3 py-2 text-[13px]"
      >
        <option value="all">Todas las campañas</option>
        {campanas.map((c) => (
          <option key={c.campaign_id} value={c.campaign_id}>
            {c.campaign_name}
          </option>
        ))}
        {otrasCampanas.length > 0 && (
          <optgroup label="Otras estrategias">
            {otrasCampanas.map((c) => (
              <option key={c.id} value={`otra:${c.id}`}>
                {c.name} — {ESTRATEGIA_LABEL[c.strategy_type] ?? c.strategy_type}
              </option>
            ))}
          </optgroup>
        )}
      </select>

      <select
        value={periodo}
        onChange={(e) => aplicarPeriodoRapido(e.target.value as RangoRapido)}
        className="border border-[var(--wos-border)] bg-[var(--wos-surface)] text-[var(--wos-ink)] rounded-lg px-3 py-2 text-[13px]"
      >
        <option value="current">Esta semana</option>
        <option value="previous">Semana anterior</option>
        <option value="4weeks">Últimas 4 semanas</option>
      </select>

      <button
        onClick={() => setPanelAbierto((v) => !v)}
        className="border border-[var(--wos-border)] bg-[var(--wos-surface)] text-[var(--wos-ink)] rounded-lg px-3 py-2 text-[13px] hover:bg-[var(--wos-surface-alt)]"
      >
        ⚙ Filtro
      </button>

      <PrintButton />

      {panelAbierto && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-[min(360px,calc(100vw-32px))] bg-[var(--wos-surface)] border border-[var(--wos-border)] rounded-2xl shadow-[var(--wos-shadow-lg)] p-4">
          <h3 className="text-sm font-semibold text-[var(--wos-ink)] mb-1">Filtro avanzado</h3>
          <p className="text-[11px] text-[var(--wos-ink-muted)] mb-3">
            Úsalo para consultar una semana específica distinta de los periodos rápidos de arriba.
          </p>
          <label className="block text-[11px] font-bold text-[var(--wos-ink-muted)] mb-1.5">Semana específica</label>
          <select
            value={semanaSeleccionada}
            onChange={(e) => setSemanaSeleccionada(e.target.value)}
            className="w-full border border-[var(--wos-border)] bg-[var(--wcc-page-bg)] text-[var(--wos-ink)] rounded-lg px-3 py-2 text-[13px] mb-3"
          >
            {semanas.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <button onClick={() => setPanelAbierto(false)} className="text-[13px] text-[var(--wos-ink-muted)] px-3 py-2">
              Cancelar
            </button>
            <button
              onClick={aplicarSemanaEspecifica}
              className="bg-[var(--wos-primary)] text-[var(--wos-on-primary)] rounded-lg px-4 py-2 text-[13px] font-semibold"
            >
              Ver resultados
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
