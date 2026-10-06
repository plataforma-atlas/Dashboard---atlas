import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

// Endpoint público para el webhook de Whop (ventas y membresías). Verifica la
// firma (Standard Webhooks) con WHOP_WEBHOOK_SECRET y reenvía el evento ya
// verificado a n8n para guardarlo. Responde rápido: Whop espera 2xx en menos
// de 5 s y reintenta si no.
const TOLERANCIA_SEGUNDOS = 5 * 60;

function firmasEsperadas(secreto: string, firmaInput: string): string[] {
  const claves: Buffer[] = [Buffer.from(secreto, "utf8")];
  const sinPrefijo = secreto.replace(/^(whsec_|ws_)/, "");
  if (sinPrefijo && sinPrefijo !== secreto) claves.push(Buffer.from(sinPrefijo, "base64"));
  return claves.map((clave) => createHmac("sha256", clave).update(firmaInput).digest("base64"));
}

function firmaValida(recibidas: string, esperadas: string[]): boolean {
  const candidatas = recibidas
    .split(" ")
    .map((f) => f.trim())
    .filter((f) => f.startsWith("v1,"))
    .map((f) => f.slice(3));
  return candidatas.some((c) =>
    esperadas.some((e) => {
      const a = Buffer.from(c);
      const b = Buffer.from(e);
      return a.length === b.length && timingSafeEqual(a, b);
    })
  );
}

export async function POST(req: Request) {
  const secreto = process.env.WHOP_WEBHOOK_SECRET;
  if (!secreto) return NextResponse.json({ error: "WHOP_WEBHOOK_SECRET no está configurada" }, { status: 500 });

  const id = req.headers.get("webhook-id") ?? "";
  const timestamp = req.headers.get("webhook-timestamp") ?? "";
  const firma = req.headers.get("webhook-signature") ?? "";
  if (!id || !timestamp || !firma) return NextResponse.json({ error: "Faltan headers de firma" }, { status: 401 });

  const ahora = Math.floor(Date.now() / 1000);
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(ahora - ts) > TOLERANCIA_SEGUNDOS) {
    return NextResponse.json({ error: "Timestamp fuera de rango" }, { status: 401 });
  }

  // Se firma el cuerpo crudo, sin parsear primero (parsear cambia los bytes).
  const cuerpo = await req.text();
  const firmaInput = `${id}.${timestamp}.${cuerpo}`;
  if (!firmaValida(firma, firmasEsperadas(secreto, firmaInput))) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const url = process.env.N8N_WHOP_EVENTOS_URL;
  if (!url) return NextResponse.json({ error: "N8N_WHOP_EVENTOS_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "webhook-id": id },
      body: cuerpo,
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ error: "No se pudo guardar el evento" }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error reenviando evento de Whop:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
