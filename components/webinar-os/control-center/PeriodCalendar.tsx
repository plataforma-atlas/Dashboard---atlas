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
  "--rdp-day-width": "36px",
  "--rdp-day-height": "36px",
  "--rdp-day_button-width": "34px",
  "--rdp-day_button-height": "34px",
  "--rdp-nav_button-width": "28px",
  "--rdp-nav_button-height": "28px",
} as React.CSSProperties;

export default function PeriodCalendar({ selected, onSelect, defaultMonth }: Props) {
  return (
    <DayPicker
      mode="range"
      locale={es}
      numberOfMonths={2}
      defaultMonth={defaultMonth ?? selected?.from}
      selected={selected}
      onSelect={onSelect}
      style={RDP_VARS}
      className="text-[14px] text-[color:var(--wos-ink)]"
      classNames={{
        // OJO: el prop `classNames` de react-day-picker REEMPLAZA la clase
        // base de cada elemento (p.ej. "rdp-day_button") en vez de sumarse a
        // ella — sin agregar esa clase de vuelta, se pierden todas las reglas
        // del stylesheet base que dependen de ella (selectores como
        // ".rdp-range_end .rdp-day_button"), que es justo lo que rellena de
        // color sólido el inicio/fin del rango. Por eso cada valor de abajo
        // empieza reincorporando su clase "rdp-*" por defecto.
        //
        // Además, por defecto pone las dos flechas de navegación juntas
        // arriba a la derecha de todo el calendario — las separamos: una
        // pegada al borde izquierdo y otra al derecho de los dos meses.
        nav: "rdp-nav !absolute !inset-x-0 !top-0.5 flex items-center justify-between px-0.5",
        month_caption: "rdp-month_caption flex items-center justify-center font-semibold text-[14px] text-[color:var(--wos-ink)] mb-1 capitalize",
        weekday: "rdp-weekday text-[12px] font-medium text-[color:var(--wos-ink-muted)]",
        button_previous: "rdp-button_previous press rounded-full text-[color:var(--wos-ink-muted)] hover:bg-[var(--wos-surface-alt)] transition-colors duration-150",
        button_next: "rdp-button_next press rounded-full text-[color:var(--wos-ink-muted)] hover:bg-[var(--wos-surface-alt)] transition-colors duration-150",
        day_button: "rdp-day_button press rounded-full hover:bg-[var(--wos-surface-alt)] transition-colors duration-150",
      }}
      components={{
        Chevron: ({ orientation, ...props }) =>
          orientation === "left" ? <ChevronLeft size={16} {...props} /> : <ChevronRight size={16} {...props} />,
      }}
    />
  );
}
