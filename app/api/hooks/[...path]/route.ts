import { NextResponse } from "next/server";

// Proxy publico hacia webhooks de n8n, para que las URLs que el cliente pega
// en su landing page / GHL / plataforma de webinar nunca revelen que usamos
// n8n ni el host real de la instancia. Lista blanca explicita: solo estos
// paths (los mismos que ya son webhooks publicos y sin secreto en n8n) se
// dejan pasar, para no exponer accidentalmente otro workflow via este dominio.
const ALLOWED_PATHS = new Set([
  "embudo-webinar/registro",
  "embudo-webinar/encuesta",
  "embudo-webinar/whatsapp",
  "embudo-webinar/registro-webinar",
  "dsm-webinarkit",
  "integraciones/captacion-lead",
  "integraciones/embudo-encuesta",
  "integraciones/embudo-encuesta-clasespecial",
  "integraciones/embudo-gracias",
  "integraciones/embudo-grupos",
  "integraciones/embudo-mensaje-recibido",
  "integraciones/hotmart-venta",
  "integraciones/soporte-contacto",
  "integraciones/generar-enlace-clase",
  "integraciones/generar-enlace-replay",
  "integraciones/captacion-visita",
]);

async function proxy(req: Request, path: string[]) {
  const joined = path.join("/");
  if (!ALLOWED_PATHS.has(joined)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const base = process.env.N8N_WEBHOOK_BASE_URL;
  if (!base) return NextResponse.json({ error: "N8N_WEBHOOK_BASE_URL no está configurada" }, { status: 500 });

  const target = new URL(`${base}/${joined}`);
  const incoming = new URL(req.url);
  incoming.searchParams.forEach((value, key) => target.searchParams.set(key, value));

  try {
    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    // Reenvía la IP real de quien llamó (Vercel ya la pone en x-forwarded-for
    // en la request entrante) — sin esto, n8n solo vería la IP de este mismo
    // proxy, nunca la del visitante real. Usado para geolocalizar leads (ver
    // "Integraciones — Captación Lead") — nunca bloquea nada si falta.
    const forwardedFor = req.headers.get("x-forwarded-for");
    const headers: Record<string, string> = { "Content-Type": req.headers.get("content-type") || "application/json" };
    if (forwardedFor) headers["x-forwarded-for"] = forwardedFor;
    // ClasEspecial firma cada envío con estas cabeceras (ver "Integraciones —
    // Eventos de Embudo", rama ClasEspecial) — sin reenviarlas, n8n nunca
    // podría verificar la firma HMAC ni descartar el evento "prueba".
    for (const h of ["x-clasespecial-evento", "x-clasespecial-envio", "x-clasespecial-timestamp", "x-clasespecial-firma"]) {
      const value = req.headers.get(h);
      if (value) headers[h] = value;
    }
    const bodyText = hasBody ? await req.text() : undefined;
    // El webhook de n8n parsea el body como JSON y no garantiza devolver los
    // bytes crudos originales — re-serializarlo ahí (JSON.stringify) no
    // necesariamente coincide byte a byte con lo que mandó ClasEspecial (orden
    // de claves, escapes de acentos/ñ), lo que rompería la verificación de
    // firma HMAC en silencio. Mandamos el texto crudo ya en base64 en un
    // header propio para que n8n lo use tal cual, sin pasar por ningún parser.
    if (joined === "integraciones/embudo-encuesta-clasespecial" && bodyText !== undefined) {
      headers["x-raw-body-b64"] = Buffer.from(bodyText, "utf8").toString("base64");
    }
    const res = await fetch(target.toString(), {
      method: req.method,
      headers,
      body: bodyText,
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("content-type") || "application/json" },
    });
  } catch (err) {
    console.error("Error en proxy de hooks:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}

export async function GET(req: Request, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}

export async function POST(req: Request, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}
