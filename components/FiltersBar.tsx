"use client";

type Props = {
  fechaInicio: string;
  fechaFin: string;
  pais: string;
  paisesDisponibles: string[];
  onChange: (next: { fechaInicio?: string; fechaFin?: string; pais?: string }) => void;
  onRefresh: () => void;
  loading: boolean;
  source: "n8n" | "error" | null;
};

export default function FiltersBar({ fechaInicio, fechaFin, pais, paisesDisponibles, onChange, onRefresh, loading, source }: Props) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-outline bg-surface px-4 py-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Desde</label>
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => onChange({ fechaInicio: e.target.value })}
          className="bg-background border border-outline rounded-md px-2.5 py-1.5 text-[14px] text-on-surface font-mono focus:border-primary outline-none transition-colors duration-150"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Hasta</label>
        <input
          type="date"
          value={fechaFin}
          onChange={(e) => onChange({ fechaFin: e.target.value })}
          className="bg-background border border-outline rounded-md px-2.5 py-1.5 text-[14px] text-on-surface font-mono focus:border-primary outline-none transition-colors duration-150"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">País</label>
        <select
          value={pais}
          onChange={(e) => onChange({ pais: e.target.value })}
          className="bg-background border border-outline rounded-md px-2.5 py-1.5 text-[14px] text-on-surface focus:border-primary outline-none min-w-[140px] transition-colors duration-150"
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
        className="press ml-auto rounded-md bg-primary text-on-primary text-[14px] font-medium px-4 py-2 hover:brightness-110 disabled:opacity-50 disabled:active:scale-100 transition-[transform,filter] duration-150"
      >
        {loading ? "Actualizando…" : "Actualizar"}
      </button>

      <div className="flex items-center gap-1.5 text-[13px] font-mono">
        <span className={`h-1.5 w-1.5 rounded-full ${source === "n8n" ? "bg-secondary" : source === "error" ? "bg-error" : "bg-on-surface-faint"}`} />
        <span className="text-on-surface-variant">{source === "n8n" ? "Datos en vivo" : source === "error" ? "Error de conexión" : "Sin datos"}</span>
      </div>
    </div>
  );
}
