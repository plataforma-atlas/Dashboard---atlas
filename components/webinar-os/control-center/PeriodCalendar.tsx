"use client";

import "react-day-picker/style.css";
import { DayPicker, type DateRange } from "react-day-picker";
import { es } from "react-day-picker/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  selected: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
  defaultMonth?: Date;
};

// Reescala los tokens de color/tamaño de react-day-picker a las variables de
// tema de Webinar OS (--wos-*) en vez del azul por defecto de la librería —
// así el calendario se ve como el resto del Control Center, con soporte de
// theming por cliente y modo oscuro incluido gratis (--wos-* ya lo resuelve).
const RDP_VARS = {
  "--rdp-accent-color": "var(--wos-primary)",
  "--rdp-accent-background-color": "var(--wos-primary-soft)",
  "--rdp-range_start-date-background-color": "var(--wos-primary)",
  "--rdp-range_end-date-background-color": "var(--wos-primary)",
  "--rdp-range_start-color": "var(--wos-on-primary)",
  "--rdp-range_end-color": "var(--wos-on-primary)",
  "--rdp-today-color": "var(--wos-primary)",
  "--rdp-day-width": "34px",
  "--rdp-day-height": "34px",
  "--rdp-day_button-width": "32px",
  "--rdp-day_button-height": "32px",
  "--rdp-nav_button-width": "28px",
  "--rdp-nav_button-height": "28px",
} as React.CSSProperties;

export default function PeriodCalendar({ selected, onSelect, defaultMonth }: Props) {
  return (
    <DayPicker
      mode="range"
      locale={es}
      defaultMonth={defaultMonth ?? selected?.from}
      selected={selected}
      onSelect={onSelect}
      style={RDP_VARS}
      className="text-[13px] text-[color:var(--wos-ink)]"
      classNames={{
        month_caption: "flex items-center justify-center font-semibold text-[13px] text-[color:var(--wos-ink)] mb-1 capitalize",
        weekday: "text-[11px] font-medium text-[color:var(--wos-ink-muted)]",
        button_previous: "rounded-full text-[color:var(--wos-ink-muted)] hover:bg-[var(--wos-surface-alt)]",
        button_next: "rounded-full text-[color:var(--wos-ink-muted)] hover:bg-[var(--wos-surface-alt)]",
        day_button: "rounded-full hover:bg-[var(--wos-surface-alt)]",
      }}
      components={{
        Chevron: ({ orientation, ...props }) =>
          orientation === "left" ? <ChevronLeft size={16} {...props} /> : <ChevronRight size={16} {...props} />,
      }}
    />
  );
}
