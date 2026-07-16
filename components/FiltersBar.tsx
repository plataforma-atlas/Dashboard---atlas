"use client";

type Props = {
  fechaInicio: string;
  fechaFin: string;
  pais: string;
  paisesDisponibles: string[];
  onChange: (next: { fechaInicio?: string; fechaFin?: string; pais?: string }) => void;
  onRefresh: () => void;
  loading: boolean;
  source: "mock" | "n8n" | "error" | null;
};

export default function FiltersBar({
  fechaInicio,
  fechaFin,
  pais,
  paisesDisponibles,
  onChange,
  onRefresh,
  loading,
  source,
}: Props) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-stroke bg-panel px-4 py-3">
      <div className="flex flex-col gap-1">
        <label className="text-[11px] uppercase tracking-[0.1em] text-faint">Desde</label>
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => onChange({ fechaInicio: e.target.value })}
          className="bg-hull border border-stroke rounded-md px-2.5 py-1.5 text-sm text-ink font-mono focus:border-signal outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] uppercase tracking-[0.1em] text-faint">Hasta</label>
        <input
          type="date"
          value={fechaFin}
          onChange={(e) => onChange({ fechaFin: e.target.value })}
          className="bg-hull border border-stroke rounded-md px-2.5 py-1.5 text-sm text-ink font-mono focus:border-signal outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] uppercase tracking-[0.1em] text-faint">País</label>
        <select
          value={pais}
          onChange={(e) => onChange({ pais: e.target.value })}
          className="bg-hull border border-stroke rounded-md px-2.5 py-1.5 text-sm text-ink focus:border-signal outline-none min-w-[140px]"
        >
          <option value="">Todos</option>
          {paisesDisponibles.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={onRefresh}
        disabled={loading}
        className="ml-auto rounded-md bg-signal text-hull text-sm font-medium px-4 py-1.5 hover:brightness-110 disabled:opacity-50 transition"
      >
        {loading ? "Actualizando…" : "Actualizar"}
      </button>

      <div className="flex items-center gap-1.5 text-xs font-mono">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            source === "n8n" ? "bg-go" : source === "error" ? "bg-red-400" : "bg-faint"
          }`}
        />
        <span className="text-mute">
          {source === "n8n" ? "Conectado a n8n" : source === "error" ? "Error de conexión" : "Datos de ejemplo"}
        </span>
      </div>
    </div>
  );
}
