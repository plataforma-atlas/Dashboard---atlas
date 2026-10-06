import { FilaTabla } from "@/lib/v3/columnas-tabla";

// Totales de las filas seleccionadas. Las razones (CTR, CPM, ROAS, CPA) se calculan
// sobre los totales, no como promedio de las filas: así un anuncio con mucho gasto
// pesa lo que realmente pesa. Si ninguna fila trae el dato, queda null ("—").
export type Totales = {
  gasto: number;
  impresiones: number;
  clics: number;
  leads: number;
  ventas: number | null;
  ctr: number | null;
  cpm: number | null;
  roas: number | null;
  cpa: number | null;
};

export function totalesDe(filas: FilaTabla[]): Totales {
  const gasto = filas.reduce((acc, f) => acc + f.spend, 0);
  const impresiones = filas.reduce((acc, f) => acc + f.impressions, 0);
  const clics = filas.reduce((acc, f) => acc + f.clicks, 0);
  const leads = filas.reduce((acc, f) => acc + f.leads, 0);

  const conVentas = filas.filter((f) => f.ventas !== undefined);
  const ventas = conVentas.length > 0 ? conVentas.reduce((acc, f) => acc + (f.ventas ?? 0), 0) : null;
  const gastoConVentas = conVentas.reduce((acc, f) => acc + f.spend, 0);

  // ROAS de cada fila = ingreso / gasto, así que el ingreso total es roas × gasto.
  const conRoas = filas.filter((f) => f.roas !== undefined);
  const ingreso = conRoas.reduce((acc, f) => acc + (f.roas ?? 0) * f.spend, 0);
  const gastoConRoas = conRoas.reduce((acc, f) => acc + f.spend, 0);

  return {
    gasto,
    impresiones,
    clics,
    leads,
    ventas,
    ctr: impresiones > 0 ? (clics / impresiones) * 100 : null,
    cpm: impresiones > 0 ? (gasto / impresiones) * 1000 : null,
    roas: ventas && ventas > 0 && gastoConRoas > 0 ? ingreso / gastoConRoas : null,
    cpa: ventas && ventas > 0 ? gastoConVentas / ventas : null,
  };
}
