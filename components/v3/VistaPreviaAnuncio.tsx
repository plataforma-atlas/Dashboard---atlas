"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import VermetricasLoader from "@/components/VermetricasLoader";

// Envuelve la vista previa de Meta. Meta la entrega a su tamaño natural (540 × 690):
// se mantiene ese tamaño, sin estirarla, y solo se permite bajar con la barra
// vertical. La barra horizontal se oculta.
function documentoVista(html: string): string {
  // El desplazamiento lo hace este documento, no el iframe de Meta: sin esto salen dos barras.
  const sinBarraPropia = html.replace(/scrolling="[a-z]+"/i, 'scrolling="no"');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;background:#fff;overflow-x:hidden;overflow-y:auto}
iframe{display:block;width:100%!important;height:820px!important;border:0!important}
</style></head><body>${sinBarraPropia}</body></html>`;
}

// Popup con la vista previa del anuncio, pedida a través de Vermetricas (no hace
// falta que quien la ve tenga cuenta de Meta).
export default function VistaPreviaAnuncio({
  clienteId,
  adId,
  adName,
  onClose,
}: {
  clienteId: string;
  adId: string;
  adName: string;
  onClose: () => void;
}) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/anuncios/meta/vista-previa?cliente_id=${encodeURIComponent(clienteId)}&ad_id=${encodeURIComponent(adId)}`, {
      cache: "no-store",
    })
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => {
        if (cancelled) return;
        if (!ok || typeof body.html !== "string") setError(body.error || "No se pudo cargar la vista previa");
        else setHtml(body.html);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo conectar al servidor");
      });
    return () => {
      cancelled = true;
    };
  }, [clienteId, adId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Vista previa de ${adName}`}
        className="animate-fade-in-up relative bg-surface border border-outline rounded-2xl shadow-lg p-5 flex flex-col gap-4"
        style={{ width: "min(92vw, calc(555px + 2.5rem))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-on-surface">Vista previa del anuncio</h3>
            <p className="text-[12px] text-on-surface-variant truncate" title={adName}>
              {adName}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="press text-on-surface-faint hover:text-on-surface shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="mx-auto min-h-[360px] grid place-items-center w-full">
          {!html && !error && <VermetricasLoader />}
          {error && <p className="text-[13px] text-error text-center">{error}</p>}
          {html && (
            <div className="w-full rounded-lg overflow-hidden" style={{ width: "min(100%, 555px)", height: "70vh" }}>
              <iframe
                title={`Vista previa de ${adName}`}
                srcDoc={documentoVista(html)}
                sandbox="allow-scripts allow-same-origin allow-popups"
                className="w-full h-full bg-white"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
