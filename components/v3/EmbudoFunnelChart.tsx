"use client";

import { useEffect, useId, useState } from "react";
import { formatNumber } from "@/lib/webinar-os/aggregate";
import { EmbudoEtapa } from "@/lib/v3/embudo";

// Forma del cono/cilindro 3D portada de un proyecto propio del usuario
// (dashboard-m33, src/app/dashboard/page.tsx, función `renderFunnel`) — cada
// franja es un path con dos arcos elípticos (arriba/abajo) en vez de un
// trapecio recto, lo que da el efecto de "aro" en 3D; la etapa final
// (Compraron) es un cilindro aparte (rect + elipses de tapa), no una franja
// más del cono.

function hexARgb(hex: string): [number, number, number] {
  const limpio = hex.replace("#", "").trim();
  const completo = limpio.length === 3
    ? limpio.split("").map((c) => c + c).join("")
    : limpio.padEnd(6, "0").slice(0, 6);
  const bigint = parseInt(completo, 16) || 0;
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function rgbAHex(r: number, g: number, b: number) {
  const canal = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${canal(r)}${canal(g)}${canal(b)}`;
}

function mezclarHex(a: string, b: string, t: number) {
  const [r1, g1, b1] = hexARgb(a);
  const [r2, g2, b2] = hexARgb(b);
  return rgbAHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

function oscurecerHex(hex: string, factor = 0.78) {
  const [r, g, b] = hexARgb(hex);
  return rgbAHex(r * factor, g * factor, b * factor);
}

function leerVariableColor(nombre: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const valor = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  return valor || fallback;
}

// Lee --color-primary/--color-secondary/--color-success en vivo (no hardcodea
// hex) y se re-lee si ThemeSwitch cambia el estilo inline al tocar el switch
// de claro/oscuro — así el degradé del embudo nunca queda con el color del
// modo anterior.
function useColoresMarca() {
  const [colores, setColores] = useState(() => ({
    primary: leerVariableColor("--color-primary", "#00A7B9"),
    secondary: leerVariableColor("--color-secondary", "#6EFFF4"),
    success: leerVariableColor("--color-success", "#16834A"),
  }));

  useEffect(() => {
    const actualizar = () =>
      setColores({
        primary: leerVariableColor("--color-primary", "#00A7B9"),
        secondary: leerVariableColor("--color-secondary", "#6EFFF4"),
        success: leerVariableColor("--color-success", "#16834A"),
      });
    actualizar();
    const observer = new MutationObserver(actualizar);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, []);

  return colores;
}

function fmtPct(n: number | null) {
  return n == null ? null : `${Math.round(n * 10) / 10}%`;
}

export default function EmbudoFunnelChart({ etapas, compraron }: { etapas: EmbudoEtapa[]; compraron: number }) {
  const suffix = useId().replace(/[^a-zA-Z0-9]/g, "");
  const { primary, secondary, success } = useColoresMarca();
  const max = etapas[0]?.count ?? 0;

  if (max === 0) {
    return (
      <div className="bg-surface border border-outline rounded-xl p-4 flex flex-col gap-3">
        <h3 className="text-[11px] uppercase tracking-wide text-on-surface-variant font-medium">Embudo de lanzamiento</h3>
        <p className="text-sm text-on-surface-faint">Sin datos todavía en el período.</p>
      </div>
    );
  }

  const n = etapas.length;
  const pasos = etapas.map((e, i) => ({
    label: e.label,
    value: e.count,
    pct: i === 0 ? 100 : fmtPct((e.count / max) * 100),
  }));
  const ultimo = { label: "Compraron", value: compraron, pct: fmtPct((compraron / max) * 100) };
  const etapaConSinMatch = etapas.find((e) => e.sinMatch);

  const svgW = 320;
  const cx = svgW / 2;
  const topW = 280;
  const botW = 90;
  const segH = 48;
  const ery = 11;
  const funnelH = n * segH + ery * 2;
  const boxGap = 16;
  const boxH = 52;
  const boxW = 110;
  const boxEry = 9;
  const svgH = funnelH + boxGap + boxH + boxEry + 8;

  const colores = Array.from({ length: n }, (_, i) => mezclarHex(primary, secondary, n > 1 ? i / (n - 1) : 0));
  const rims = colores.map((c) => oscurecerHex(c));
  const rimSuccess = oscurecerHex(success);

  const wAt = (i: number) => topW - (i / Math.max(1, n - 1)) * (topW - botW);

  return (
    <div className="bg-surface border border-outline rounded-xl p-4 flex flex-col gap-3">
      <h3 className="text-[11px] uppercase tracking-wide text-on-surface-variant font-medium">Embudo de lanzamiento</h3>

      <div className="flex justify-center">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: "100%", maxWidth: 320 }} role="img" aria-label="Embudo de lanzamiento">
          <defs>
            {colores.map((c, i) => (
              <linearGradient key={`fg${suffix}${i}`} id={`fg${suffix}${i}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={rims[i]} />
                <stop offset="35%" stopColor={c} />
                <stop offset="65%" stopColor={c} />
                <stop offset="100%" stopColor={rims[i]} />
              </linearGradient>
            ))}
            <linearGradient id={`fgLast${suffix}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={rimSuccess} />
              <stop offset="35%" stopColor={success} />
              <stop offset="65%" stopColor={success} />
              <stop offset="100%" stopColor={rimSuccess} />
            </linearGradient>
            <radialGradient id={`fgTop${suffix}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={colores[0]} stopOpacity="0.15" />
              <stop offset="60%" stopColor={rims[0]} stopOpacity="0.35" />
              <stop offset="100%" stopColor={rims[0]} stopOpacity="0.55" />
            </radialGradient>
          </defs>

          {[...pasos].reverse().map((_, ri) => {
            const i = n - 1 - ri;
            const tW = wAt(i);
            const bW = wAt(i + 1 < n ? i + 1 : i) * (i === n - 1 ? 0.85 : 1);
            const tY = i * segH + ery;
            const bY = (i + 1) * segH + ery;
            const bEry = (ery * bW) / topW + 3;
            const path = `M${cx - tW / 2},${tY} A${tW / 2},${ery} 0 0,1 ${cx + tW / 2},${tY} L${cx + bW / 2},${bY} A${bW / 2},${bEry} 0 0,1 ${cx - bW / 2},${bY} Z`;
            return (
              <g key={`shape-${i}`}>
                <path d={path} fill={`url(#fg${suffix}${i})`} />
                {i === 0 && <ellipse cx={cx} cy={tY} rx={tW / 2} ry={ery} fill={`url(#fgTop${suffix})`} />}
                {i > 0 && <ellipse cx={cx} cy={tY} rx={tW / 2} ry={ery} fill={rims[i]} opacity="0.35" />}
              </g>
            );
          })}

          {pasos.map((s, i) => {
            const tY = i * segH + ery;
            return (
              <g key={`text-${i}`}>
                <text x={cx} y={tY + segH / 2 - 7} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="10.5" fontWeight={500} style={{ pointerEvents: "none" }}>
                  {s.label}
                </text>
                <text x={cx} y={tY + segH / 2 + 11} textAnchor="middle" fill="white" fontSize="18" fontWeight={700} style={{ pointerEvents: "none" }}>
                  {formatNumber(s.value)}
                </text>
                {s.pct && (
                  <text x={cx} y={tY + segH / 2 + 23} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9" style={{ pointerEvents: "none" }}>
                    {s.pct}
                  </text>
                )}
              </g>
            );
          })}

          <g>
            <rect x={cx - boxW / 2} y={funnelH + boxGap} width={boxW} height={boxH} rx={8} fill={`url(#fgLast${suffix})`} />
            <ellipse cx={cx} cy={funnelH + boxGap} rx={boxW / 2} ry={boxEry} fill={rimSuccess} opacity="0.6" />
            <ellipse cx={cx} cy={funnelH + boxGap + boxH} rx={boxW / 2} ry={boxEry} fill={rimSuccess} opacity="0.3" />
            <text x={cx} y={funnelH + boxGap + boxH / 2 - 7} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="10.5" fontWeight={500} style={{ pointerEvents: "none" }}>
              {ultimo.label}
            </text>
            <text x={cx} y={funnelH + boxGap + boxH / 2 + 12} textAnchor="middle" fill="white" fontSize="19" fontWeight={700} style={{ pointerEvents: "none" }}>
              {formatNumber(ultimo.value)}
            </text>
            {ultimo.pct && (
              <text x={cx} y={funnelH + boxGap + boxH / 2 + 25} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="9" style={{ pointerEvents: "none" }}>
                {ultimo.pct}
              </text>
            )}
          </g>
        </svg>
      </div>

      {etapaConSinMatch && (
        <div className="pt-2 border-t border-outline text-center text-[11px] text-on-surface-faint">
          <span>Ingresos a &quot;{etapaConSinMatch.label}&quot; totales: </span>
          <span className="text-on-surface font-medium">{formatNumber(etapaConSinMatch.count)}</span>
          <span> con match + </span>
          <span className="text-warning font-medium">{formatNumber(etapaConSinMatch.sinMatch ?? 0)}</span>
          <span> sin match = </span>
          <span className="text-on-surface font-semibold">{formatNumber(etapaConSinMatch.count + (etapaConSinMatch.sinMatch ?? 0))}</span>
        </div>
      )}
    </div>
  );
}
