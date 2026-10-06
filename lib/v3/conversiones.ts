import { V3Lead } from "@/lib/v3/types";

// Conversiones personalizadas: la persona combina dos eventos de sus leads y le pone
// nombre. Se cuentan por lead y después se atribuyen a cada anuncio por utm_content.

export type EventoKey =
  | "encuesta"
  | "gracias"
  | "mensaje_1a1"
  | "grupo"
  | "soporte"
  | "comprado"
  | "carrito"
  | "tarjeta"
  | "cuota_pendiente";

// Fecha en que ocurrió el evento para ese lead, o null si nunca ocurrió.
export const EVENTOS: { key: EventoKey; label: string; fecha: (lead: V3Lead) => string | null }[] = [
  { key: "encuesta", label: "Respondió la encuesta", fecha: (l) => fechaExtra(l, "encuesta_at") },
  { key: "gracias", label: "Vio la página de gracias", fecha: (l) => fechaExtra(l, "gracias_visto_at") },
  { key: "mensaje_1a1", label: "Recibió el mensaje 1a1", fecha: (l) => fechaExtra(l, "mensaje_1a1_recibido_at") },
  { key: "grupo", label: "Entró al grupo", fecha: (l) => fechaExtra(l, "grupo_ingresado_at") },
  { key: "soporte", label: "Contactó a soporte", fecha: (l) => fechaExtra(l, "contacto_soporte_at") },
  {
    key: "comprado",
    label: "Compró",
    fecha: (l) => (l.status === "comprado" ? fechaExtra(l, "venta_at") ?? l.created_at : null),
  },
  { key: "carrito", label: "Abandonó el carrito", fecha: (l) => fechaExtra(l, "carrito_abandonado_at") },
  { key: "tarjeta", label: "Tarjeta rechazada", fecha: (l) => fechaExtra(l, "tarjeta_rechazada_at") },
  { key: "cuota_pendiente", label: "Cuota pendiente", fecha: (l) => fechaExtra(l, "cuota_pendiente_at") },
];

export type TipoCombinacion = "y" | "luego" | "no";

export const TIPOS_COMBINACION: { key: TipoCombinacion; label: string; ayuda: string }[] = [
  { key: "y", label: "Y", ayuda: "El lead tuvo los dos eventos." },
  { key: "luego", label: "Luego", ayuda: "El primer evento ocurrió antes que el segundo." },
  { key: "no", label: "No", ayuda: "El lead tuvo el primer evento y no el segundo." },
];

export type ReglaConversion = { tipo: TipoCombinacion; a: EventoKey; b: EventoKey };

export type ConversionPersonalizada = {
  id: number;
  nombre: string;
  config: ReglaConversion;
};

function fechaExtra(lead: V3Lead, campo: string): string | null {
  const valor = lead.extra?.[campo];
  return typeof valor === "string" && valor.length > 0 ? valor : null;
}

function eventoDe(clave: EventoKey) {
  return EVENTOS.find((e) => e.key === clave)!;
}

// ¿Este lead cumple la conversión?
export function cumpleConversion(lead: V3Lead, regla: ReglaConversion): boolean {
  const fa = eventoDe(regla.a).fecha(lead);
  const fb = eventoDe(regla.b).fecha(lead);
  if (regla.tipo === "y") return fa !== null && fb !== null;
  if (regla.tipo === "no") return fa !== null && fb === null;
  // "luego": A tiene fecha y es anterior o igual a B.
  if (fa === null || fb === null) return false;
  return Date.parse(fa) <= Date.parse(fb);
}

// Cantidad de leads que cumplen la conversión, por id de anuncio (utm_content).
export function contarConversionPorAnuncio(leads: V3Lead[], regla: ReglaConversion): Map<string, number> {
  const conteo = new Map<string, number>();
  for (const lead of leads) {
    const adId = lead.utm_content?.trim();
    if (!adId || !cumpleConversion(lead, regla)) continue;
    conteo.set(adId, (conteo.get(adId) ?? 0) + 1);
  }
  return conteo;
}

// Lo que se guarda: nombre y una regla válida. Cualquier otro dato se descarta.
export function sanitizarConversion(raw: unknown): { nombre: string; config: ReglaConversion } | null {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const nombre = typeof r.nombre === "string" ? r.nombre.trim().slice(0, 60) : "";
  const c = (r.config && typeof r.config === "object" ? r.config : {}) as Record<string, unknown>;
  const tipoOk = TIPOS_COMBINACION.some((t) => t.key === c.tipo);
  const aOk = EVENTOS.some((e) => e.key === c.a);
  const bOk = EVENTOS.some((e) => e.key === c.b);
  if (!nombre || !tipoOk || !aOk || !bOk || c.a === c.b) return null;
  return { nombre, config: { tipo: c.tipo as TipoCombinacion, a: c.a as EventoKey, b: c.b as EventoKey } };
}
