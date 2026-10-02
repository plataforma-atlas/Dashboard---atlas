"use client";

import { useState } from "react";
import Pagination from "@/components/ui/pagination";
import { formatNumber } from "@/lib/webinar-os/aggregate";

export type GeoRankingRow = { label: string; sublabel?: string; count: number };

const PAGE_SIZE_OPTIONS = [5, 10, 25];

// Reusado para "Leads por país" y "Leads por ciudad" en el Home — misma
// mecánica de paginación que ya usan Base de datos/Administrador de
// Anuncios/Análisis de Anuncios (components/ui/pagination.tsx).
export default function GeoRankingTable({ columnaLabel, rows }: { columnaLabel: string; rows: GeoRankingRow[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  if (rows.length === 0) {
    return <p className="text-sm text-on-surface-faint">Sin datos todavía en el período.</p>;
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const visibles = rows.slice((pageClamped - 1) * pageSize, pageClamped * pageSize);

  return (
    <div className="flex flex-col gap-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-on-surface-faint text-[11px] uppercase tracking-wide">
            <th className="py-2 pr-4 font-medium">{columnaLabel}</th>
            <th className="py-2 pr-4 font-medium text-right">Leads</th>
          </tr>
        </thead>
        <tbody>
          {visibles.map((r) => (
            <tr key={`${r.label}__${r.sublabel ?? ""}`} className="border-t border-outline">
              <td className="py-2 pr-4">
                <div className="text-on-surface">{r.label}</div>
                {r.sublabel && <div className="text-[11px] text-on-surface-faint">{r.sublabel}</div>}
              </td>
              <td className="py-2 pr-4 text-on-surface tabular text-right">{formatNumber(r.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination
        page={pageClamped}
        pageCount={totalPages}
        pageSize={pageSize}
        total={rows.length}
        onPageChange={setPage}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
      />
    </div>
  );
}
