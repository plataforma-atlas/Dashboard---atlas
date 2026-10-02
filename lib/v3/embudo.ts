import { V3CaptacionPunto, V3CaptacionVisita, V3Lead } from "@/lib/v3/types";

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

// Comparación por "página de testeo" (cada punto de captación = una landing
// distinta de un mismo lanzamiento). Las visitas vienen del pixel propio
// (un <img> que el cliente pega en la página — ver V3PuntoEndpoint tipo
// "visita" y app/api/hooks/integraciones/captacion-visita), no de Meta: se
// evaluó traer "Clics en el enlace" de Meta, pero muchas páginas reciben
// tráfico de varios anuncios a la vez (y a veces de un anuncio armado desde
// una publicación existente, cuyo destino ni siquiera es legible con el
// token de ads_read/ads_management) — el pixel cuenta toda visita real sin
// importar de dónde venga.
export type PaginaTesteo = {
  id: number;
  nombre: string;
  visitas: number;
  registrados: number;
  conversion: number | null;
  encuesta: number;
  grupo: number;
};

export function calcularPaginasTesteo(
  leads: V3Lead[],
  puntos: V3CaptacionPunto[],
  visitas: V3CaptacionVisita[],
  rangoPeriodo: { fecha_inicio: string; fecha_fin: string }
): PaginaTesteo[] {
  const reales = leads.filter((l) => l.extra?.sin_match !== true);
  const { fecha_inicio, fecha_fin } = rangoPeriodo;
  const dentroDelRango = (fechaIso: string) => {
    const fecha = fechaIso.slice(0, 10);
    return (!fecha_inicio || fecha >= fecha_inicio) && (!fecha_fin || fecha <= fecha_fin);
  };

  return puntos.map((punto) => {
    const deEstaPagina = reales.filter((l) => l.punto_captacion_id === punto.id);
    const registrados = deEstaPagina.length;
    const encuesta = deEstaPagina.filter(tieneExtra("encuesta_at")).length;
    const grupo = deEstaPagina.filter(tieneExtra("grupo_ingresado_at")).length;

    const visitasCount = visitas.filter((v) => v.punto_captacion_id === punto.id && dentroDelRango(v.created_at)).length;
    const conversion = visitasCount > 0 ? (registrados / visitasCount) * 100 : null;

    return { id: punto.id, nombre: punto.nombre, visitas: visitasCount, registrados, conversion, encuesta, grupo };
  });
}

// Geolocalizados por IP al captar el lead (ver Integraciones — Captación
// Lead) — `pais` se guarda en inglés (mismo formato que devuelve ip-api.com,
// para que calce sin traducir contra el nombre de país del mapa); la
// traducción a español para mostrar en pantalla vive en el componente, no
// acá, porque esto es solo el conteo.
export type LeadPorPais = { pais: string; count: number };
export type LeadPorCiudad = { ciudad: string; pais: string; count: number };

export function calcularGeografia(leads: V3Lead[]): { porPais: LeadPorPais[]; porCiudad: LeadPorCiudad[] } {
  const reales = leads.filter((l) => l.extra?.sin_match !== true);

  const porPaisMapa = new Map<string, number>();
  const porCiudadMapa = new Map<string, { ciudad: string; pais: string; count: number }>();

  for (const l of reales) {
    if (l.pais) porPaisMapa.set(l.pais, (porPaisMapa.get(l.pais) ?? 0) + 1);
    if (l.ciudad) {
      const clave = `${l.ciudad}__${l.pais ?? ""}`;
      const actual = porCiudadMapa.get(clave) ?? { ciudad: l.ciudad, pais: l.pais ?? "", count: 0 };
      actual.count += 1;
      porCiudadMapa.set(clave, actual);
    }
  }

  const porPais = [...porPaisMapa.entries()].map(([pais, count]) => ({ pais, count })).sort((a, b) => b.count - a.count);
  const porCiudad = [...porCiudadMapa.values()].sort((a, b) => b.count - a.count);

  return { porPais, porCiudad };
}

// Preguntas fijas de la encuesta post-registro (endpoint `embudo-encuesta`,
// `extra.respuestas`). El orden de las opciones es el de la encuesta real, no
// por frecuencia — así se lee igual que la encuesta que respondió la persona.
export const ENCUESTA_PREGUNTAS: { clave: string; pregunta: string; opciones: string[] }[] = [
  {
    clave: "edad",
    pregunta: "¿En qué rango de edad estás?",
    opciones: ["18 a 24 años", "25 a 34 años", "35 a 44 años", "45 a 54 años", "55 años o más"],
  },
  {
    clave: "situacion",
    pregunta: "¿Cuál de estas opciones describe mejor tu situación actual?",
    opciones: [
      "Tengo empleo y quiero encontrar más propósito en mi vida",
      "Soy emprendedor o tengo un negocio propio",
      "Soy coach, terapeuta, mentor o facilitador",
      "Tengo una marca personal o quiero construir una",
      "Estoy en una etapa de búsqueda, reinvención o transformación personal",
      "Ninguna de las anteriores",
    ],
  },
  {
    clave: "intentado",
    pregunta: "¿Qué has intentado antes para mejorar esta situación?",
    opciones: [
      "Cursos o mentorías online",
      "Terapias, coaching o procesos de sanación",
      "Libros, podcasts o contenido de desarrollo personal",
      "Meditación, oración o prácticas espirituales",
      "Eventos presenciales o retiros",
      "Nada formal, apenas estoy empezando",
    ],
  },
  {
    clave: "inversion",
    pregunta: "¿Cuánto estarías dispuesto a invertir hoy en un proceso de transformación personal y espiritual?",
    opciones: [
      "Menos de $50 USD",
      "Entre $50 y $100 USD",
      "Entre $100 y $300 USD",
      "Entre $300 y $1.000 USD",
      "Más de $1.000 USD si veo mucho valor",
      "Ahora mismo no puedo invertir",
    ],
  },
  {
    clave: "acompanamiento",
    pregunta: "¿Qué tipo de acompañamiento te gustaría recibir después de descargar este material?",
    opciones: [
      "Acceso a una masterclass gratuita en vivo",
      "Un reto o mentoría corta de transformación",
      "Información sobre un programa de 33 días",
      "Contenido por WhatsApp para seguir profundizando",
      "Hablar con alguien del equipo para recibir orientación",
      "Solo quiero recibir el PDF por ahora",
    ],
  },
];

export type EncuestaResultado = { clave: string; pregunta: string; total: number; opciones: { label: string; count: number }[] };

export function calcularEncuesta(leads: V3Lead[]): EncuestaResultado[] {
  const respondieron = leads.filter((l) => {
    const r = l.extra?.respuestas;
    return r && typeof r === "object" && Object.keys(r as object).length > 0;
  });

  return ENCUESTA_PREGUNTAS.map(({ clave, pregunta, opciones }) => {
    const conteo = new Map<string, number>(opciones.map((o) => [o, 0]));
    let total = 0;
    for (const l of respondieron) {
      const respuestas = l.extra?.respuestas as Record<string, string> | undefined;
      const valor = respuestas?.[clave];
      if (valor && conteo.has(valor)) {
        conteo.set(valor, (conteo.get(valor) ?? 0) + 1);
        total += 1;
      }
    }
    return { clave, pregunta, total, opciones: opciones.map((label) => ({ label, count: conteo.get(label) ?? 0 })) };
  });
}
