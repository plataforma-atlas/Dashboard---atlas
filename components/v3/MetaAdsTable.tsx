"use client";

import { useEffect, useState } from "react";
import Pagination from "@/components/ui/pagination";
import { ColumnaKey, DefColumna, FilaTabla, columnaDef } from "@/lib/v3/columnas-tabla";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function MetaAdsTable({
  rows,
  nombreColumna,
  columnas,
  definiciones,
  onSeleccionChange,
}: {
  rows: FilaTabla[];
  nombreColumna: string;
  columnas: ColumnaKey[];
  definiciones: DefColumna[];
  // Avisa a quien usa la tabla cada vez que cambia la selección (por ejemplo, para el gráfico).
  onSeleccionChange?: (ids: Set<string>) => void;
}) {
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  useEffect(() => {
    onSeleccionChange?.(seleccionados);
  }, [seleccionados]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  if (rows.length === 0) {
    return <p className="text-sm text-on-surface-faint py-6">Sin datos en los últimos 30 días.</p>;
  }

  const ordenadas = [...rows].sort((a, b) => b.spend - a.spend);
  const totalPages = Math.max(1, Math.ceil(ordenadas.length / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const visibles = ordenadas.slice((pageClamped - 1) * pageSize, pageClamped * pageSize);
  const todosSeleccionados = visibles.length > 0 && visibles.every((r) => seleccionados.has(r.id));

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
    setSeleccionados(todosSeleccionados ? new Set() : new Set(visibles.map((r) => r.id)));
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-on-surface-faint text-[11px] uppercase tracking-wide">
              <th className="py-2 pr-2 w-8">
                <input
                  type="checkbox"
                  checked={todosSeleccionados}
                  onChange={toggleTodos}
                  disabled={visibles.length === 0}
                  className="w-4 h-4 rounded accent-primary"
                />
              </th>
              <th className="py-2 pr-3 font-medium">Estado</th>
              <th className="py-2 pr-4 font-medium">{nombreColumna}</th>
              {columnas.map((key) => (
                <th key={key} className="py-2 pr-4 font-medium text-right whitespace-nowrap">
                  {columnaDef(key, definiciones)?.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibles.map((r) => (
              <tr key={r.id} className="border-t border-outline align-top">
                <td className="py-2.5 pr-2">
                  <input
                    type="checkbox"
                    checked={seleccionados.has(r.id)}
                    onChange={() => toggleFila(r.id)}
                    className="w-4 h-4 rounded accent-primary"
                  />
                </td>
                <td className="py-2.5 pr-3">
                  {r.status && (
                    <span
                      className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${
                        r.status === "ACTIVE"
                          ? "text-success bg-success-container"
                          : r.status === "PAUSED"
                            ? "text-on-surface-faint bg-surface-high"
                            : "text-on-surface-faint border border-outline"
                      }`}
                    >
                      {r.status === "ACTIVE" ? "Activo" : r.status === "PAUSED" ? "Pausado" : r.status}
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-4 max-w-[280px]">
                  <div className="text-on-surface truncate" title={r.nombre}>
                    {r.nombre}
                  </div>
                  {r.subtitulo && (
                    <div className="text-on-surface-faint text-xs truncate" title={r.subtitulo}>
                      {r.subtitulo}
                    </div>
                  )}
                </td>
                {columnas.map((key) => {
                  const def = columnaDef(key, definiciones);
                  return (
                    <td key={key} className="py-2.5 pr-4 text-right text-on-surface-variant tabular">
                      {def ? def.formatear(r) : "—"}
                    </td>
                  );
                })}
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

    </div>
  );
}
