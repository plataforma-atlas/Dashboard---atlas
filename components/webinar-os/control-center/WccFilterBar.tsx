"use client";

import { useState } from "react";
import { type DateRange } from "react-day-picker";
import { ChevronDown } from "lucide-react";
import { Campaign } from "@/lib/types";
import { CampanaCartera } from "@/lib/webinar-os/control-center/types";
import { rangoRapido, semanasEspecificas, RangoRapido, RANGO_RAPIDO_LABEL } from "@/lib/webinar-os/control-center/dateRanges";
import PrintButton from "./PrintButton";
import PeriodCalendar from "./PeriodCalendar";

const PRESETS_RAPIDOS: Exclude<RangoRapido, "custom">[] = ["all", "today", "7days", "1month"];

function fechaCorta(iso: string): string {
  // new Date("2026-09-17") se interpreta en UTC — partimos el string a mano
  // para no correr el riesgo de que se muestre un día antes por timezone.
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

function isoDeDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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
  const [periodo, setPeriodo] = useState<RangoRapido>("all");
  const [rangoPersonalizado, setRangoPersonalizado] = useState<{ fecha_inicio: string; fecha_fin: string } | null>(null);
  const [rangoBorrador, setRangoBorrador] = useState<DateRange | undefined>(undefined);
  const [panelAbierto, setPanelAbierto] = useState<"periodo" | "avanzado" | null>(null);
  const [semanaSeleccionada, setSemanaSeleccionada] = useState(semanasEspecificas()[0]?.value ?? "");

  function aplicarPeriodoRapido(p: Exclude<RangoRapido, "custom">) {
    setPeriodo(p);
    setRangoPersonalizado(null);
    const { fecha_inicio, fecha_fin } = rangoRapido(p);
    onAplicar(fecha_inicio, fecha_fin);
    setPanelAbierto(null);
  }

  function aplicarRangoPersonalizado() {
    if (!rangoBorrador?.from || !rangoBorrador?.to) return;
    const fecha_inicio = isoDeDate(rangoBorrador.from);
    const fecha_fin = isoDeDate(rangoBorrador.to);
    setPeriodo("custom");
    setRangoPersonalizado({ fecha_inicio, fecha_fin });
    onAplicar(fecha_inicio, fecha_fin);
    setPanelAbierto(null);
  }

  function abrirPanelPeriodo() {
    setRangoBorrador(
      rangoPersonalizado
        ? { from: new Date(`${rangoPersonalizado.fecha_inicio}T00:00:00`), to: new Date(`${rangoPersonalizado.fecha_fin}T00:00:00`) }
        : undefined
    );
    setPanelAbierto((v) => (v === "periodo" ? null : "periodo"));
  }

  function aplicarSemanaEspecifica() {
    const semana = semanasEspecificas().find((s) => s.value === semanaSeleccionada);
    if (semana) onAplicar(semana.fecha_inicio, semana.fecha_fin);
    setPanelAbierto(null);
  }

  const semanas = semanasEspecificas();

  const etiquetaPeriodo =
    periodo === "custom" && rangoPersonalizado
      ? `${fechaCorta(rangoPersonalizado.fecha_inicio)} – ${fechaCorta(rangoPersonalizado.fecha_fin)}`
      : RANGO_RAPIDO_LABEL[periodo as Exclude<RangoRapido, "custom">];

  return (
    <div className="wcc-no-print relative flex items-center gap-2 flex-wrap w-full min-w-0 md:w-auto">
      <select
        value={campanaSeleccionada}
        onChange={(e) => onCampanaChange(e.target.value)}
        className="w-full sm:w-auto max-w-full border border-[var(--wos-border)] bg-[var(--wos-surface)] text-[var(--wos-ink)] rounded-lg px-3 py-2 text-[13px]"
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

      <div className="relative">
        <button
          onClick={abrirPanelPeriodo}
          className="flex items-center gap-1.5 border border-[var(--wos-border)] bg-[var(--wos-surface)] text-[var(--wos-ink)] rounded-lg px-3 py-2 text-[13px] hover:bg-[var(--wos-surface-alt)]"
        >
          {etiquetaPeriodo}
          <ChevronDown size={14} className="text-[color:var(--wos-ink-muted)]" />
        </button>

        {panelAbierto === "periodo" && (
          <div className="absolute left-0 top-[calc(100%+8px)] z-40 w-[min(320px,calc(100vw-32px))] bg-[var(--wos-surface)] border border-[var(--wos-border)] rounded-2xl shadow-[var(--wos-shadow-lg)] p-4">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {PRESETS_RAPIDOS.map((p) => (
                <button
                  key={p}
                  onClick={() => aplicarPeriodoRapido(p)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-medium border transition ${
                    periodo === p
                      ? "bg-[var(--wos-primary)] text-[var(--wos-on-primary)] border-[var(--wos-primary)]"
                      : "border-[var(--wos-border)] text-[color:var(--wos-ink-muted)] hover:bg-[var(--wos-surface-alt)]"
                  }`}
                >
                  {RANGO_RAPIDO_LABEL[p]}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-[color:var(--wos-ink-muted)] mb-2">O elige un rango personalizado:</p>
            <div className="flex justify-center">
              <PeriodCalendar selected={rangoBorrador} onSelect={setRangoBorrador} />
            </div>

            <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-[var(--wos-border)]">
              <button onClick={() => setPanelAbierto(null)} className="text-[13px] text-[color:var(--wos-ink-muted)] px-3 py-2">
                Cancelar
              </button>
              <button
                onClick={aplicarRangoPersonalizado}
                disabled={!rangoBorrador?.from || !rangoBorrador?.to}
                className="bg-[var(--wos-primary)] text-[var(--wos-on-primary)] rounded-lg px-4 py-2 text-[13px] font-semibold disabled:opacity-40"
              >
                Aplicar rango
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setPanelAbierto((v) => (v === "avanzado" ? null : "avanzado"))}
        className="border border-[var(--wos-border)] bg-[var(--wos-surface)] text-[var(--wos-ink)] rounded-lg px-3 py-2 text-[13px] hover:bg-[var(--wos-surface-alt)]"
      >
        ⚙ Filtro
      </button>

      <PrintButton />

      {panelAbierto === "avanzado" && (
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
            <button onClick={() => setPanelAbierto(null)} className="text-[13px] text-[var(--wos-ink-muted)] px-3 py-2">
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
