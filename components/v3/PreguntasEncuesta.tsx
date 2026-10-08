"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { V3PreguntaEncuesta, V3PreguntaTipo } from "@/lib/v3/types";

export default function PreguntasEncuesta({
  clienteId,
  dashboardId,
  preguntas,
  puedeEscribir,
  onGuardadas,
}: {
  clienteId: string;
  dashboardId: number;
  preguntas: V3PreguntaEncuesta[];
  puedeEscribir: boolean;
  onGuardadas: (preguntas: V3PreguntaEncuesta[]) => void;
}) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [textoNuevo, setTextoNuevo] = useState("");
  const [tipoNuevo, setTipoNuevo] = useState<V3PreguntaTipo>("opcion_multiple");
  const [opcionesNuevas, setOpcionesNuevas] = useState<string[]>([""]);

  async function guardar(siguientes: V3PreguntaEncuesta[]) {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch("/api/v3/dashboards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, dashboard_id: dashboardId, preguntas_encuesta: siguientes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "No se pudo guardar");
        return;
      }
      onGuardadas(siguientes);
    } catch {
      setError("No se pudo conectar al servidor");
    } finally {
      setGuardando(false);
    }
  }

  function borrar(texto: string) {
    guardar(preguntas.filter((p) => p.texto !== texto));
  }

  function agregar(e: React.FormEvent) {
    e.preventDefault();
    const texto = textoNuevo.trim();
    if (!texto) return;
    const opciones = tipoNuevo === "opcion_multiple" ? opcionesNuevas.map((o) => o.trim()).filter(Boolean) : undefined;
    const nueva: V3PreguntaEncuesta = opciones ? { texto, tipo: tipoNuevo, opciones } : { texto, tipo: tipoNuevo };
    guardar([...preguntas, nueva]).then(() => {
      setTextoNuevo("");
      setTipoNuevo("opcion_multiple");
      setOpcionesNuevas([""]);
    });
  }

  return (
    <div className="rounded-lg border border-outline bg-surface p-4 flex flex-col gap-3">
      <div>
        <div className="text-[14px] font-medium text-on-surface">Preguntas de la encuesta</div>
        <div className="text-[12px] text-on-surface-variant">
          El webhook de Encuesta usa esto para filtrar la respuesta real en medio de lo que mande tu sistema (GHL, ManyChat,
          Google Forms...) — el texto tiene que ser <strong>idéntico</strong> (tildes, mayúsculas, puntuación) a como está allá.
        </div>
      </div>

      {preguntas.length === 0 ? (
        <p className="text-[13px] text-on-surface-faint">Todavía no hay preguntas configuradas.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {preguntas.map((p) => (
            <div key={p.texto} className="flex items-start justify-between gap-3 rounded-md bg-background px-3 py-2">
              <div className="min-w-0">
                <p className="text-[13px] text-on-surface">{p.texto}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className="text-[10px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded border border-outline text-on-surface-faint">
                    {p.tipo === "libre" ? "Respuesta libre" : "Opción múltiple"}
                  </span>
                  {p.opciones?.map((o) => (
                    <span key={o} className="text-[11px] px-1.5 py-0.5 rounded bg-surface-high text-on-surface-variant">
                      {o}
                    </span>
                  ))}
                </div>
              </div>
              {puedeEscribir && (
                <button
                  type="button"
                  onClick={() => borrar(p.texto)}
                  disabled={guardando}
                  title="Borrar pregunta"
                  className="press shrink-0 text-on-surface-faint hover:text-error transition-colors duration-150 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-[12px] text-error">{error}</p>}

      {puedeEscribir && (
        <form onSubmit={agregar} className="flex flex-col gap-2.5 pt-1 border-t border-outline">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Texto exacto de la pregunta</label>
            <input
              type="text"
              value={textoNuevo}
              onChange={(e) => setTextoNuevo(e.target.value)}
              placeholder="Ej. ¿En qué rango de edad estás?"
              className="bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface focus:border-primary outline-none transition-colors duration-150"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {(["opcion_multiple", "libre"] as const).map((opcion) => (
              <button
                key={opcion}
                type="button"
                onClick={() => setTipoNuevo(opcion)}
                className={`press text-[12px] px-3 py-1.5 rounded-md border font-medium transition-colors duration-150 ${
                  tipoNuevo === opcion
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-outline text-on-surface-variant hover:border-primary hover:text-on-surface"
                }`}
              >
                {opcion === "libre" ? "Respuesta libre" : "Opción múltiple"}
              </button>
            ))}
          </div>
          {tipoNuevo === "opcion_multiple" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Opciones (texto exacto de cada una)</label>
              {opcionesNuevas.map((o, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={o}
                    onChange={(e) => setOpcionesNuevas((actuales) => actuales.map((x, j) => (j === i ? e.target.value : x)))}
                    placeholder={`Opción ${i + 1}`}
                    className="flex-1 min-w-0 bg-background border border-outline rounded-md px-3 py-1.5 text-[13px] text-on-surface focus:border-primary outline-none transition-colors duration-150"
                  />
                  {opcionesNuevas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setOpcionesNuevas((actuales) => actuales.filter((_, j) => j !== i))}
                      className="press text-on-surface-faint hover:text-error transition-colors duration-150"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setOpcionesNuevas((actuales) => [...actuales, ""])}
                className="press self-start flex items-center gap-1 text-[12px] text-primary hover:underline"
              >
                <Plus size={12} /> Agregar opción
              </button>
            </div>
          )}
          <button
            type="submit"
            disabled={guardando || !textoNuevo.trim()}
            className="press self-start flex items-center gap-1.5 rounded-md bg-primary text-on-primary text-[13px] font-medium px-3 py-2 disabled:opacity-50 transition-transform duration-150"
          >
            <Plus size={13} /> {guardando ? "Guardando…" : "Agregar pregunta"}
          </button>
        </form>
      )}
    </div>
  );
}
