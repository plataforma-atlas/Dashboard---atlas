"use client";

import { useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { LeadPorPais } from "@/lib/v3/embudo";

// Topología pública estándar (Natural Earth 110m, vía world-atlas) — mismo
// archivo que usa cualquier mapa choropleth de este tipo, no se inventan
// coordenadas a mano. Los nombres de país en `properties.name` están en
// inglés (confirmado contra el archivo real), igual que lo que guarda
// `pais` en client_leads (mismo formato que devuelve ip-api.com).
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Único alias real necesario para los países que este proyecto puede ver —
// ip-api.com da "United States", el mapa usa el nombre largo oficial.
const ALIAS_MAPA_A_DATOS: Record<string, string> = {
  "United States of America": "United States",
};

const PAIS_ES: Record<string, string> = {
  Colombia: "Colombia",
  Mexico: "México",
  "United States": "Estados Unidos",
  Spain: "España",
  Argentina: "Argentina",
  Peru: "Perú",
  Chile: "Chile",
  Ecuador: "Ecuador",
};

export function nombrePaisEs(pais: string): string {
  return PAIS_ES[pais] ?? pais;
}

function hexARgb(hex: string): [number, number, number] {
  const limpio = hex.replace("#", "").trim();
  const bigint = parseInt(limpio.padEnd(6, "0").slice(0, 6), 16) || 0;
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function mezclarHex(a: string, b: string, t: number) {
  const [r1, g1, b1] = hexARgb(a);
  const [r2, g2, b2] = hexARgb(b);
  const canal = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${canal(r1 + (r2 - r1) * t)}${canal(g1 + (g2 - g1) * t)}${canal(b1 + (b2 - b1) * t)}`;
}

function leerVariableColor(nombre: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const valor = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  return valor || fallback;
}

export default function LeadsWorldMap({ porPais }: { porPais: LeadPorPais[] }) {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);
  const [hover, setHover] = useState<{ nombre: string; count: number; x: number; y: number } | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const sinColor = leerVariableColor("--color-surface-high", "#1b2432");
  const colorMin = leerVariableColor("--color-primary", "#00A7B9");
  const colorMax = leerVariableColor("--color-secondary", "#6EFFF4");
  const max = Math.max(1, ...porPais.map((p) => p.count));
  const conteoPorPais = new Map(porPais.map((p) => [p.pais, p.count]));

  function colorDe(nombreGeo: string) {
    const clave = ALIAS_MAPA_A_DATOS[nombreGeo] ?? nombreGeo;
    const count = conteoPorPais.get(clave) ?? 0;
    if (count === 0) return sinColor;
    return mezclarHex(colorMin, colorMax, Math.sqrt(count / max));
  }

  if (porPais.length === 0) {
    return <p className="text-sm text-on-surface-faint">Sin datos todavía en el período.</p>;
  }

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 z-10 flex gap-1.5">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(8, z * 1.5))}
          className="press w-7 h-7 rounded-md border border-outline bg-surface text-on-surface-variant hover:text-on-surface grid place-items-center text-sm font-medium transition-colors duration-150"
          aria-label="Acercar"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(1, z / 1.5))}
          className="press w-7 h-7 rounded-md border border-outline bg-surface text-on-surface-variant hover:text-on-surface grid place-items-center text-sm font-medium transition-colors duration-150"
          aria-label="Alejar"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => {
            setZoom(1);
            setCenter([0, 20]);
          }}
          className="press px-2 h-7 rounded-md border border-outline bg-surface text-on-surface-variant hover:text-on-surface text-[11px] font-medium transition-colors duration-150"
        >
          Reset
        </button>
      </div>

      {hover && (
        <div
          className="pointer-events-none absolute z-20 bg-background border border-outline rounded-md px-3 py-1.5 text-[12px] text-on-surface shadow-lg -translate-x-1/2 -translate-y-[calc(100%+8px)]"
          style={{ left: hover.x, top: hover.y }}
        >
          {hover.nombre} — {hover.count.toLocaleString("es-CO")} leads
        </div>
      )}

      <ComposableMap projection="geoNaturalEarth1" style={{ width: "100%", height: "auto" }}>
        <ZoomableGroup
          zoom={zoom}
          center={center}
          onMoveEnd={({ coordinates, zoom: z }) => {
            if (coordinates) setCenter(coordinates);
            if (z) setZoom(z);
          }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const nombreGeo = (geo.properties?.name as string) ?? "";
                const clave = ALIAS_MAPA_A_DATOS[nombreGeo] ?? nombreGeo;
                const count = conteoPorPais.get(clave) ?? 0;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={colorDe(nombreGeo)}
                    stroke="var(--color-background)"
                    strokeWidth={0.5}
                    fillOpacity={hoveredKey === geo.rsmKey && count > 0 ? 0.85 : 1}
                    onMouseEnter={() => setHoveredKey(geo.rsmKey)}
                    onMouseMove={(e) => {
                      if (count === 0) return;
                      const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                      setHover({ nombre: nombrePaisEs(clave), count, x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }}
                    onMouseLeave={() => {
                      setHoveredKey(null);
                      setHover(null);
                    }}
                    style={{ outline: "none", cursor: count > 0 ? "pointer" : "default" }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      <div className="flex items-center justify-center gap-2 text-[11px] text-on-surface-faint mt-2">
        <span>Menos</span>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <span key={t} className="w-5 h-2.5 rounded-sm" style={{ background: mezclarHex(colorMin, colorMax, t) }} />
        ))}
        <span>Más</span>
      </div>
    </div>
  );
}
