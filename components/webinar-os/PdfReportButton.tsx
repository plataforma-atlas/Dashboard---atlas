"use client";

import { useState } from "react";
import { WebinarDetail } from "@/lib/webinar-os/types";

export default function PdfReportButton({ detail }: { detail: WebinarDetail }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const { generateWebinarReport } = await import("@/lib/webinar-os/pdf");
      await generateWebinarReport(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#F59E0B] to-[#EA580C] transition disabled:opacity-60"
      >
        {loading ? "Generando…" : "Descargar reporte PDF"}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
