"use client";

import { Campaign } from "@/lib/types";

const STRATEGY_LABELS: Record<Campaign["strategy_type"], string> = {
  lanzamiento: "Lanzamiento",
  webinar_automatizado: "Webinar Automático",
  vsl: "VSL",
  evento_presencial: "Evento Presencial",
};

const STATUS_LABELS: Record<Campaign["status"], string> = {
  active: "Activa",
  draft: "Borrador",
  paused: "Pausada",
  archived: "Cerrada",
};

// Estas estrategias ya traen su propio selector de país/edición/ángulo dentro
// del módulo (sidebar de Webinar OS, VslSelector, EventoSelector), así que aquí
// basta una sola entrada por estrategia en vez de listar cada campaña.
const COLLAPSED_STRATEGIES: Campaign["strategy_type"][] = ["webinar_automatizado", "vsl", "evento_presencial"];

export default function CampaignSelector({
  campaigns,
  selectedId,
  onSelect,
  loading,
}: {
  campaigns: Campaign[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  loading: boolean;
}) {
  const grouped = campaigns.reduce<Record<string, Campaign[]>>((acc, c) => {
    (acc[c.strategy_type] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] uppercase tracking-[0.1em] text-on-surface-faint">Campaña / Edición</label>
      <select
        value={selectedId ?? ""}
        disabled={loading || campaigns.length === 0}
        onChange={(e) => onSelect(Number(e.target.value))}
        className="bg-background border border-outline rounded-md px-2.5 py-1.5 text-sm text-on-surface focus:border-primary outline-none min-w-[220px] disabled:opacity-50"
      >
        {campaigns.length === 0 && <option value="">Sin campañas</option>}
        {Object.entries(grouped).map(([strategy, items]) => {
          const label = STRATEGY_LABELS[strategy as Campaign["strategy_type"]];
          if (COLLAPSED_STRATEGIES.includes(strategy as Campaign["strategy_type"])) {
            // El value normalmente es la primera campaña del grupo (el resto
            // de la selección de país/edición/ángulo vive dentro del módulo),
            // pero si ya estamos viendo otra campaña de este mismo grupo (ej.
            // llegamos por un link directo a un ángulo de VSL que no es el
            // primero), respetamos esa para que el <select> no muestre una
            // opción distinta a la que realmente está activa.
            const activa = items.find((c) => c.id === selectedId);
            return (
              <optgroup key={strategy} label={label}>
                <option value={(activa ?? items[0]).id}>{label}</option>
              </optgroup>
            );
          }
          return (
            <optgroup key={strategy} label={label}>
              {items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({STATUS_LABELS[c.status]})
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </div>
  );
}
