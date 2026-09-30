"use client";

import { useState } from "react";
import { type DateRange } from "react-day-picker";
import { ChevronDown } from "lucide-react";
import { RangoRapido, RANGO_RAPIDO_LABEL, rangoRapido } from "@/lib/webinar-os/control-center/dateRanges";
import PeriodCalendar from "@/components/webinar-os/control-center/PeriodCalendar";

const PRESETS: Exclude<RangoRapido, "custom">[] = ["today", "7days", "30days", "90days", "all"];

// PeriodCalendar (Control Center clásico) ya existe y es el mismo picker de
// doble mes que pidió el usuario — se reusa tal cual, solo reescalando sus
// variables --wos-* a las --color-* de la V3 en este wrapper, sin duplicar
// el componente.
const WOS_VARS_DESDE_V3 = {
  "--wos-primary": "var(--color-primary)",
  "--wos-primary-soft": "color-mix(in srgb, var(--color-primary) 18%, var(--color-surface))",
  "--wos-on-primary": "var(--color-on-primary)",
  "--wos-ink": "var(--color-on-surface)",
  "--wos-ink-muted": "var(--color-on-surface-variant)",
  "--wos-surface-alt": "var(--color-surface-high)",
} as React.CSSProperties;

function isoDeDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fechaCorta(iso: string): string {
  // new Date("2026-09-17") se interpreta en UTC — partimos el string a mano
  // para no correr el riesgo de que se muestre un día antes por timezone.
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

export default function V3PeriodFilter({
  periodo,
  rango,
  onAplicar,
}: {
  periodo: RangoRapido;
  rango: { fecha_inicio: string; fecha_fin: string };
  onAplicar: (periodo: RangoRapido, rango: { fecha_inicio: string; fecha_fin: string }) => void;
}) {
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [rangoBorrador, setRangoBorrador] = useState<DateRange | undefined>(undefined);

  function aplicarPreset(p: Exclude<RangoRapido, "custom">) {
    onAplicar(p, rangoRapido(p));
    setPanelAbierto(false);
  }

  function abrirPanelPersonalizado() {
    setRangoBorrador(
      periodo === "custom" && rango.fecha_inicio && rango.fecha_fin
        ? { from: new Date(`${rango.fecha_inicio}T00:00:00`), to: new Date(`${rango.fecha_fin}T00:00:00`) }
        : undefined
    );
    setPanelAbierto((v) => !v);
  }

  function aplicarRangoPersonalizado() {
    if (!rangoBorrador?.from || !rangoBorrador?.to) return;
    onAplicar("custom", { fecha_inicio: isoDeDate(rangoBorrador.from), fecha_fin: isoDeDate(rangoBorrador.to) });
    setPanelAbierto(false);
  }

  return (
    <div className="relative flex items-center gap-1.5 flex-wrap">
      {PRESETS.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => aplicarPreset(p)}
          className={`press rounded-full px-3 py-1.5 text-[13px] font-medium border transition-colors duration-150 ${
            periodo === p
              ? "bg-primary text-on-primary border-primary"
              : "border-outline text-on-surface-variant hover:text-on-surface hover:border-primary"
          }`}
        >
          {RANGO_RAPIDO_LABEL[p]}
        </button>
      ))}

      <button
        type="button"
        onClick={abrirPanelPersonalizado}
        className={`press flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium border transition-colors duration-150 ${
          periodo === "custom"
            ? "bg-primary text-on-primary border-primary"
            : "border-outline text-on-surface-variant hover:text-on-surface hover:border-primary"
        }`}
      >
        {periodo === "custom" ? `${fechaCorta(rango.fecha_inicio)} – ${fechaCorta(rango.fecha_fin)}` : "Rango personalizado"}
        <ChevronDown size={14} />
      </button>

      {panelAbierto && (
        <div
          style={WOS_VARS_DESDE_V3}
          className="animate-fade-in-up absolute left-0 top-[calc(100%+8px)] z-40 w-[min(680px,calc(100vw-32px))] origin-top-left bg-surface border border-outline rounded-2xl shadow-lg p-4"
        >
          <div className="flex justify-center overflow-x-auto">
            <PeriodCalendar selected={rangoBorrador} onSelect={setRangoBorrador} />
          </div>

          <div className="flex items-center justify-between gap-2 mt-2 pt-3 border-t border-outline">
            <p className="text-[13px] text-on-surface-variant">
              {rangoBorrador?.from && rangoBorrador?.to
                ? `${fechaCorta(isoDeDate(rangoBorrador.from))} → ${fechaCorta(isoDeDate(rangoBorrador.to))}`
                : "Elige la fecha de inicio y de fin"}
            </p>
            <div className="flex gap-2 shrink-0">
              <button type="button" onClick={() => setPanelAbierto(false)} className="press text-[13px] text-on-surface-variant px-3 py-2">
                Cancelar
              </button>
              <button
                type="button"
                onClick={aplicarRangoPersonalizado}
                disabled={!rangoBorrador?.from || !rangoBorrador?.to}
                className="press bg-primary text-on-primary rounded-lg px-4 py-2 text-[13px] font-semibold disabled:opacity-40 disabled:active:scale-100 transition-[transform,opacity] duration-150"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
