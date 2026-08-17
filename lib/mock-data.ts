import { FunnelRow } from "./types";

// Mismo shape que devuelve el nodo "Consulta BD *Query" de n8n.
// Sirve para ver el dashboard funcionando antes de conectar el webhook real.
const sources = ["facebook", "google", "organico", "instagram"];
const countries = ["Colombia", "Mexico", "Peru", "Argentina", "Chile"];

const stageDef: { sort_order: number; stagename: string }[] = [
  { sort_order: 1, stagename: "Registro Inicial" },
  { sort_order: 2, stagename: "Asistentes Webinar" },
  { sort_order: 3, stagename: "Compra Tripwire" },
  { sort_order: 7, stagename: "Compra Método Floppy" },
];

function seeded(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateMockFunnel(): FunnelRow[] {
  const rows: FunnelRow[] = [];
  let seed = 1;
  countries.forEach((country, ci) => {
    sources.forEach((source, si) => {
      const base = 80 + Math.floor(seeded(seed++) * 220) - ci * 8;
      const webinar = Math.floor(base * (0.35 + seeded(seed++) * 0.2));
      const tripwire = Math.floor(webinar * (0.12 + seeded(seed++) * 0.08));
      const metodo = Math.floor(tripwire * (0.2 + seeded(seed++) * 0.15));

      const counts: Record<number, number> = {
        1: Math.max(base, 1),
        2: Math.max(webinar, 0),
        3: Math.max(tripwire, 0),
        7: Math.max(metodo, 0),
      };
      const ingresoUnitTripwire = 47;
      const ingresoUnitMetodo = 397;

      stageDef.forEach((s) => {
        const leads = counts[s.sort_order];
        const ingresos =
          s.sort_order === 3
            ? leads * ingresoUnitTripwire
            : s.sort_order === 7
            ? leads * ingresoUnitMetodo
            : 0;
        rows.push({
          sort_order: s.sort_order,
          stagename: s.stagename,
          utm_source: source,
          country,
          total_leads: String(leads),
          total_ingresos: String(ingresos),
        });
      });
    });
  });
  return rows;
}
