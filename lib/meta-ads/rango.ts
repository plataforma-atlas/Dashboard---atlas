// Rango de fechas para las consultas a Meta. Meta toma "time_range" como
// {"since": "YYYY-MM-DD", "until": "YYYY-MM-DD"} (ambos días incluidos).

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

function isoDeDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Por defecto, los últimos 30 días completos (sin hoy), como el "last_30d" de Meta.
export function rangoPorDefecto(): { since: string; until: string } {
  const hoy = new Date();
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1);
  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 30);
  return { since: isoDeDate(desde), until: isoDeDate(hasta) };
}

// Meta solo entrega cifras de hasta 37 meses atrás; el inicio se recorta a ese límite.
const MESES_MAXIMOS = 36;

function inicioMaximo(): string {
  const hoy = new Date();
  return isoDeDate(new Date(hoy.getFullYear(), hoy.getMonth() - MESES_MAXIMOS, 1));
}

// Valida el rango que llega en la consulta. Si falta o es inválido, usa el de por defecto.
export function rangoDesdeQuery(fechaInicio: string | null, fechaFin: string | null): { since: string; until: string } {
  if (fechaInicio && fechaFin && FECHA_ISO.test(fechaInicio) && FECHA_ISO.test(fechaFin) && fechaInicio <= fechaFin) {
    const minimo = inicioMaximo();
    return { since: fechaInicio < minimo ? minimo : fechaInicio, until: fechaFin };
  }
  return rangoPorDefecto();
}
