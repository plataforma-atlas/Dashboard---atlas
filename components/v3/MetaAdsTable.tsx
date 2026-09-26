"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { formatMoney, formatNumber } from "@/lib/webinar-os/aggregate";
import Pagination from "@/components/ui/pagination";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

type Row = {
  id: string;
  nombre: string;
  subtitulo?: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpm: number;
  leads: number;
};

export default function MetaAdsTable({
  rows,
  nombreColumna,
  onToggleEstado,
}: {
  rows: Row[];
  nombreColumna: string;
  onToggleEstado?: (id: string, nuevoEstado: "ACTIVE" | "PAUSED") => Promise<void>;
}) {
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [aplicandoId, setAplicandoId] = useState<string | null>(null);
  const [erroresPorFila, setErroresPorFila] = useState<Record<string, string>>({});
  const [confirmandoLote, setConfirmandoLote] = useState<"ACTIVE" | "PAUSED" | null>(null);
  const [aplicandoLote, setAplicandoLote] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  if (rows.length === 0) {
    return <p className="text-sm text-on-surface-faint py-6">Sin datos en los últimos 30 días.</p>;
  }

  const ordenadas = [...rows].sort((a, b) => b.spend - a.spend);
  const totalPages = Math.max(1, Math.ceil(ordenadas.length / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const visibles = ordenadas.slice((pageClamped - 1) * pageSize, pageClamped * pageSize);
  const puedeAlternar = (r: Row) => r.status === "ACTIVE" || r.status === "PAUSED";
  const alternables = visibles.filter(puedeAlternar);
  const todosSeleccionados = alternables.length > 0 && alternables.every((r) => seleccionados.has(r.id));

  function cambiarPageSize(size: number) {
    setPageSize(size);
    setPage(1);
  }

  function toggleFila(id: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleTodos() {
    setSeleccionados(todosSeleccionados ? new Set() : new Set(alternables.map((r) => r.id)));
  }

  async function aplicarCambio(id: string, nuevoEstado: "ACTIVE" | "PAUSED") {
    if (!onToggleEstado) return;
    setConfirmandoId(null);
    setAplicandoId(id);
    setErroresPorFila((prev) => ({ ...prev, [id]: "" }));
    try {
      await onToggleEstado(id, nuevoEstado);
    } catch (err) {
      setErroresPorFila((prev) => ({ ...prev, [id]: err instanceof Error ? err.message : "No se pudo cambiar el estado" }));
    } finally {
      setAplicandoId(null);
    }
  }

  async function aplicarLote(nuevoEstado: "ACTIVE" | "PAUSED") {
    if (!onToggleEstado) return;
    setConfirmandoLote(null);
    setAplicandoLote(true);
    const ids = Array.from(seleccionados);
    for (const id of ids) {
      try {
        await onToggleEstado(id, nuevoEstado);
      } catch {
        // seguimos con el resto del lote aunque uno falle
      }
    }
    setAplicandoLote(false);
    setSeleccionados(new Set());
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-on-surface-faint text-[11px] uppercase tracking-wide">
              {onToggleEstado && (
                <>
                  <th className="py-2 pr-2 w-8">
                    <input
                      type="checkbox"
                      checked={todosSeleccionados}
                      onChange={toggleTodos}
                      disabled={alternables.length === 0}
                      className="w-4 h-4 rounded accent-primary"
                    />
                  </th>
                  <th className="py-2 pr-3 w-11" />
                </>
              )}
              <th className="py-2 pr-4 font-medium">{nombreColumna}</th>
              <th className="py-2 pr-4 font-medium text-right">Gasto</th>
              <th className="py-2 pr-4 font-medium text-right">Impresiones</th>
              <th className="py-2 pr-4 font-medium text-right">Clics</th>
              <th className="py-2 pr-4 font-medium text-right">CTR</th>
              <th className="py-2 pr-4 font-medium text-right">CPM</th>
              <th className="py-2 pr-4 font-medium text-right">Leads (Meta)</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((r) => (
              <tr key={r.id} className="border-t border-outline align-top">
                {onToggleEstado && (
                  <>
                    <td className="py-2.5 pr-2">
                      {puedeAlternar(r) && (
                        <input
                          type="checkbox"
                          checked={seleccionados.has(r.id)}
                          onChange={() => toggleFila(r.id)}
                          className="w-4 h-4 rounded accent-primary"
                        />
                      )}
                    </td>
                    <td className="py-2.5 pr-3">
                      {aplicandoId === r.id ? (
                        <Loader2 size={16} className="animate-spin text-on-surface-faint" />
                      ) : puedeAlternar(r) ? (
                        <button
                          type="button"
                          onClick={() => setConfirmandoId(r.id)}
                          title={r.status === "ACTIVE" ? "Pausar" : "Activar"}
                          className={`press relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150 ${
                            r.status === "ACTIVE" ? "bg-primary" : "bg-surface-high border border-outline"
                          }`}
                        >
                          <span
                            className={`pointer-events-none block size-5 rounded-full bg-on-primary shadow-sm transition-transform duration-150 ${
                              r.status === "ACTIVE" ? "translate-x-5" : "translate-x-0.5 bg-on-surface-faint"
                            }`}
                          />
                        </button>
                      ) : (
                        r.status && <span className="text-[10px] text-on-surface-faint uppercase">{r.status}</span>
                      )}
                    </td>
                  </>
                )}
                <td className="py-2.5 pr-4 max-w-[280px]">
                  <div className="text-on-surface truncate" title={r.nombre}>
                    {r.nombre}
                  </div>
                  {r.subtitulo && (
                    <div className="text-on-surface-faint text-xs truncate" title={r.subtitulo}>
                      {r.subtitulo}
                    </div>
                  )}
                  {confirmandoId === r.id && (
                    <div className="flex items-center gap-1.5 mt-1 whitespace-nowrap">
                      <span className="text-[12px] text-on-surface-variant">
                        ¿{r.status === "ACTIVE" ? "Pausar" : "Activar"} esto?
                      </span>
                      <button
                        type="button"
                        onClick={() => aplicarCambio(r.id, r.status === "ACTIVE" ? "PAUSED" : "ACTIVE")}
                        className="press text-[12px] font-medium text-primary hover:underline"
                      >
                        Sí
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmandoId(null)}
                        className="press text-[12px] text-on-surface-faint hover:text-on-surface-variant"
                      >
                        No
                      </button>
                    </div>
                  )}
                  {erroresPorFila[r.id] && <p className="text-[11px] text-error mt-1 max-w-[220px]">{erroresPorFila[r.id]}</p>}
                </td>
                <td className="py-2.5 pr-4 text-right text-on-surface tabular">{formatMoney(r.spend)}</td>
                <td className="py-2.5 pr-4 text-right text-on-surface-variant tabular">{formatNumber(r.impressions)}</td>
                <td className="py-2.5 pr-4 text-right text-on-surface-variant tabular">{formatNumber(r.clicks)}</td>
                <td className="py-2.5 pr-4 text-right text-on-surface-variant tabular">{r.ctr.toFixed(2)}%</td>
                <td className="py-2.5 pr-4 text-right text-on-surface-variant tabular">{formatMoney(r.cpm)}</td>
                <td className="py-2.5 pr-4 text-right text-on-surface-variant tabular">{formatNumber(r.leads)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={pageClamped}
        pageCount={totalPages}
        pageSize={pageSize}
        total={ordenadas.length}
        onPageChange={setPage}
        onPageSizeChange={cambiarPageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
      />

      {onToggleEstado && seleccionados.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 animate-fade-in-up">
          <div className="bg-surface border border-outline rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-4">
            {confirmandoLote ? (
              <>
                <span className="text-[13px] text-on-surface">
                  ¿{confirmandoLote === "PAUSED" ? "Pausar" : "Activar"} {seleccionados.size} seleccionados?
                </span>
                <button
                  type="button"
                  disabled={aplicandoLote}
                  onClick={() => aplicarLote(confirmandoLote)}
                  className="press text-[13px] font-medium text-primary hover:underline disabled:opacity-50"
                >
                  {aplicandoLote ? "Aplicando…" : "Sí"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmandoLote(null)}
                  className="press text-[13px] text-on-surface-faint hover:text-on-surface-variant"
                >
                  No
                </button>
              </>
            ) : (
              <>
                <span className="text-[13px] text-on-surface font-medium">{seleccionados.size} seleccionados</span>
                <button
                  type="button"
                  onClick={() => setConfirmandoLote("PAUSED")}
                  className="press text-[13px] px-3 py-1.5 rounded-md border border-outline hover:border-primary text-on-surface transition-colors duration-150"
                >
                  Pausar seleccionados
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmandoLote("ACTIVE")}
                  className="press text-[13px] px-3 py-1.5 rounded-md border border-outline hover:border-primary text-on-surface transition-colors duration-150"
                >
                  Activar seleccionados
                </button>
                <button
                  type="button"
                  onClick={() => setSeleccionados(new Set())}
                  className="press text-[13px] text-on-surface-faint hover:text-on-surface-variant"
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
