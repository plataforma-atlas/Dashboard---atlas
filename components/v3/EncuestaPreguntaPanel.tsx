"use client";

export default function EncuestaPreguntaPanel({
  pregunta,
  opciones,
  total,
}: {
  pregunta: string;
  opciones: { label: string; count: number }[];
  total: number;
}) {
  const max = Math.max(1, ...opciones.map((o) => o.count));

  return (
    <div className="bg-surface border border-outline rounded-xl p-4 flex flex-col gap-3">
      <h3 className="text-sm font-medium text-on-surface">{pregunta}</h3>
      {total === 0 ? (
        <p className="text-sm text-on-surface-faint">Sin respuestas todavía.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {opciones.map((o) => (
            <div key={o.label} className="flex flex-col gap-1">
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs text-on-surface-variant">{o.label}</span>
                <span className="text-xs text-on-surface tabular shrink-0">
                  {((o.count / total) * 100).toFixed(1)}% ({o.count})
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-high overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, (o.count / max) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
