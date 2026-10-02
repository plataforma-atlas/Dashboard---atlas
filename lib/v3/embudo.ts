import { V3Lead } from "@/lib/v3/types";

export type EmbudoEtapa = { key: string; label: string; count: number; sinMatch?: number };

// Para Carrito abandonado / Tarjeta rechazada: el lead queda marcado con el
// timestamp del evento para siempre (es un hecho histórico real), pero si
// después sí compró (status === 'comprado') ya no debe contarse como un
// carrito/tarjeta "perdido" — por eso `count` excluye a los recuperados y
// `recuperados`/`porcentajeRecuperacion` quedan aparte.
export type EventoHotmart = { count: number; recuperados: number; porcentajeRecuperacion: number | null };

const tieneExtra = (campo: string) => (l: V3Lead) => Boolean(l.extra?.[campo]);

function calcularEventoHotmart(leads: V3Lead[], campo: string): EventoHotmart {
  const conEvento = leads.filter(tieneExtra(campo));
  const recuperados = conEvento.filter((l) => l.status === "comprado").length;
  const total = conEvento.length;
  return {
    count: total - recuperados,
    recuperados,
    porcentajeRecuperacion: total > 0 ? (recuperados / total) * 100 : null,
  };
}

// "Cuotas pendientes": boleto/cuota vencida (evento PURCHASE_DELAYED o
// purchase.status OVERDUE de Hotmart) — mismo criterio de "se excluye si ya
// compró" que carrito/tarjeta, más la suma del monto todavía sin cobrar de
// los que siguen pendientes (no se suma el de los que ya se recuperaron).
export type PagoPendiente = EventoHotmart & { montoPendiente: number };

function calcularPagoPendiente(leads: V3Lead[]): PagoPendiente {
  const base = calcularEventoHotmart(leads, "cuota_pendiente_at");
  const montoPendiente = leads
    .filter((l) => tieneExtra("cuota_pendiente_at")(l) && l.status !== "comprado")
    .reduce((acc, l) => acc + (typeof l.extra?.monto_pendiente === "number" ? l.extra.monto_pendiente : 0), 0);
  return { ...base, montoPendiente };
}

// Las filas `sin_match: true` son pings (hoy solo de "Entró al grupo") que no
// matchearon ningún lead por teléfono/correo — se guardan igual (ver
// Integraciones — Eventos de Embudo) para no perder el dato, pero nunca deben
// contarse como un registro real: por eso quedan afuera de `reales` y de
// `etapas[].count`, y solo aparecen en el campo aparte `sinMatch`.
export function calcularEmbudo(leads: V3Lead[]) {
  const reales = leads.filter((l) => l.extra?.sin_match !== true);
  const sinMatchRows = leads.filter((l) => l.extra?.sin_match === true);

  const etapas: EmbudoEtapa[] = [
    { key: "registrados", label: "Registrados", count: reales.length },
    { key: "encuesta", label: "Encuesta", count: reales.filter(tieneExtra("encuesta_at")).length },
    // "Página de gracias" no se trackea: el botón de esa página manda directo
    // a entrar al grupo, nunca hay un ping propio que la confirme — mostrar
    // esta etapa siempre en 0 sería fabricar un dato sin fuente real.
    { key: "mensaje", label: "Mensaje 1a1 recibido", count: reales.filter(tieneExtra("mensaje_1a1_recibido_at")).length },
    {
      key: "grupo",
      label: "Entró al grupo",
      count: reales.filter(tieneExtra("grupo_ingresado_at")).length,
      sinMatch: sinMatchRows.filter(tieneExtra("grupo_ingresado_at")).length,
    },
    // Agregar una etapa nueva acá cuando se sume un endpoint nuevo al embudo.
  ];

  const compraron = reales.filter((l) => l.status === "comprado").length;
  const carritoAbandonado = calcularEventoHotmart(leads, "carrito_abandonado_at");
  const tarjetaRechazada = calcularEventoHotmart(leads, "tarjeta_rechazada_at");
  // extra.cuotas = purchase.payment.installments_number de Hotmart — 1 cuota
  // es pago único, así que solo cuenta como "pago a cuotas" si es más de 1.
  const pagosACuotas = leads.filter((l) => l.status === "comprado" && typeof l.extra?.cuotas === "number" && l.extra.cuotas > 1).length;
  const cuotaPendiente = calcularPagoPendiente(leads);
  // "Contactaron a soporte": lo manda GHL vía integraciones/soporte-contacto
  // (a nivel de cliente completo, no por punto de captación) — a diferencia
  // de carrito/tarjeta, no es algo que se "recupere", así que es un conteo
  // simple sobre `reales` (igual que las demás etapas del embudo).
  const contactaronSoporte = reales.filter(tieneExtra("contacto_soporte_at")).length;
  // "Vieron la clase"/"Vio replay": vienen del acortador de enlaces propio
  // (app/r/[token]/route.ts) — igual que soporte, conteo simple, no se
  // "recupera" nada acá.
  const vieronClase = reales.filter(tieneExtra("vio_clase_at")).length;
  const vioReplay = reales.filter(tieneExtra("vio_replay_at")).length;

  // Facturación de pago único vs. facturación que entró en cuotas — mismas
  // ventas que ya cuenta `compraron`, solo partidas por `extra.cuotas`.
  const ventasComprado = reales.filter((l) => l.status === "comprado");
  const montoDe = (l: V3Lead) => (typeof l.extra?.monto === "number" ? l.extra.monto : 0);
  const facturacionPagoUnico = ventasComprado
    .filter((l) => !(typeof l.extra?.cuotas === "number" && l.extra.cuotas > 1))
    .reduce((acc, l) => acc + montoDe(l), 0);
  const facturacionEnCuotas = ventasComprado
    .filter((l) => typeof l.extra?.cuotas === "number" && l.extra.cuotas > 1)
    .reduce((acc, l) => acc + montoDe(l), 0);

  const porFuente = new Map<string, number>();
  for (const l of reales) {
    const fuente = l.utm_source || l.pagina_origen || "Directo";
    porFuente.set(fuente, (porFuente.get(fuente) ?? 0) + 1);
  }
  const fuentes = [...porFuente.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  return {
    etapas,
    compraron,
    fuentes,
    carritoAbandonado,
    tarjetaRechazada,
    pagosACuotas,
    cuotaPendiente,
    facturacionPagoUnico,
    facturacionEnCuotas,
    contactaronSoporte,
    vieronClase,
    vioReplay,
  };
}
