"use client";

import { useState } from "react";
import { Check, Eye, ImageOff } from "lucide-react";
import { AnuncioAnalisis, METRICAS_POR_DEFECTO, MetricaKey, metricaDef } from "@/lib/v3/analisis-anuncios";
import VistaPreviaAnuncio from "@/components/v3/VistaPreviaAnuncio";

export default function AdCreativeCard({
  clienteId,
  ad,
  selected,
  onToggle,
  metricas = METRICAS_POR_DEFECTO,
}: {
  clienteId: string;
  ad: AnuncioAnalisis;
  selected: boolean;
  onToggle: () => void;
  metricas?: MetricaKey[];
}) {
  const [verAbierto, setVerAbierto] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`card-hover w-full text-left bg-surface border rounded-2xl overflow-hidden flex flex-col shadow-sm ${
          selected ? "border-primary" : "border-outline"
        }`}
      >
        <div className="relative aspect-square bg-surface-high overflow-hidden">
          {ad.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ad.thumbnail_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center">
              <ImageOff size={22} strokeWidth={1.5} className="text-on-surface-faint" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-[13px] text-white font-medium truncate" title={ad.ad_name}>
              {ad.ad_name}
            </p>
            <p className="text-[11px] text-white/70 truncate" title={`${ad.ad_account_label} · ${ad.campaign_name} · ${ad.adset_name}`}>
              {ad.ad_account_label} · {ad.campaign_name} · {ad.adset_name}
            </p>
          </div>

          {selected && (
            <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-primary text-on-primary grid place-items-center shadow-sm animate-pop-in">
              <Check size={13} strokeWidth={2.5} />
            </span>
          )}
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {metricas.map((key) => {
              const def = metricaDef(key);
              const vacio = def.sinDatos?.(ad) ?? false;
              return (
                <div key={key} className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] uppercase tracking-wide text-on-surface-faint truncate">{def.label}</span>
                  <span className="text-[13px] text-on-surface font-medium tabular">{vacio ? "—" : def.formatear(ad)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setVerAbierto(true);
        }}
        aria-label="Ver anuncio"
        title="Ver anuncio"
        className="press absolute top-2.5 left-2.5 z-10 h-8 px-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-[12px] inline-flex items-center gap-1.5 transition-colors duration-150"
      >
        <Eye size={14} strokeWidth={2} />
        Ver anuncio
      </button>

      {verAbierto && (
        <VistaPreviaAnuncio clienteId={clienteId} adId={ad.ad_id} adName={ad.ad_name} onClose={() => setVerAbierto(false)} />
      )}
    </div>
  );
}
