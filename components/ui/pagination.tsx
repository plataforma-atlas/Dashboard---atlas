"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const ICON_BTN =
  "inline-flex items-center justify-center w-8 h-8 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-high transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none";

export default function Pagination({
  page,
  pageCount,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-[13px] text-on-surface-variant">
      {onPageSizeChange ? (
        <div className="flex items-center gap-2">
          <span>Filas por página</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-background border border-outline rounded-md px-2 py-1 text-[13px] text-on-surface outline-none focus:border-primary transition-colors duration-150"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <span />
      )}

      <span className="font-mono tabular-nums">
        {start}-{end} de {total}
      </span>

      <div className="flex items-center gap-1">
        <button type="button" className={`press ${ICON_BTN}`} onClick={() => onPageChange(1)} disabled={page <= 1} aria-label="Primera página">
          <ChevronsLeft size={14} />
        </button>
        <button
          type="button"
          className={`press ${ICON_BTN}`}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          className={`press ${ICON_BTN}`}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Página siguiente"
        >
          <ChevronRight size={14} />
        </button>
        <button
          type="button"
          className={`press ${ICON_BTN}`}
          onClick={() => onPageChange(pageCount)}
          disabled={page >= pageCount}
          aria-label="Última página"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}
