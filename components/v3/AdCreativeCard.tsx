"use client";

import { Check, ImageOff } from "lucide-react";
import { MetaAdRow } from "@/lib/meta-ads/types";
import { formatMoney, formatNumber } from "@/lib/webinar-os/aggregate";

export default function AdCreativeCard({
  ad,
  selected,
  onToggle,
}: {
  ad: MetaAdRow;
  selected: boolean;
  onToggle: () => void;
}) {
  const sinDatos = ad.roas === 0 && ad.ventas === 0;

  return (
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

      <div className="p-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-y-2.5">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wide text-on-surface-faint">Gasto</span>
            <span className="text-[13px] text-on-surface font-medium tabular">{formatMoney(ad.spend)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wide text-on-surface-faint">Impresiones</span>
            <span className="text-[13px] text-on-surface font-medium tabular">{formatNumber(ad.impressions)}</span>
          </div>
        </div>

        <div className="h-px w-full bg-outline" />

        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wide text-on-surface-faint">ROAS</span>
            <span className="text-[13px] text-on-surface font-medium tabular">{sinDatos ? "—" : `${ad.roas.toFixed(2)}x`}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wide text-on-surface-faint">CPA</span>
            <span className="text-[13px] text-on-surface font-medium tabular">{sinDatos ? "—" : formatMoney(ad.cpa)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wide text-on-surface-faint">Ventas</span>
            <span className="text-[13px] text-on-surface font-medium tabular">{formatNumber(ad.ventas)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
