import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, clientesDeSesion } from "@/lib/auth";

export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const clienteId = (body?.cliente_id ?? "").toString().trim();
  const campaignId = Number(body?.campaign_id);
  const nombre = (body?.nombre ?? "").toString().trim();

  if (!clienteId) return NextResponse.json({ error: "Falta cliente_id" }, { status: 400 });
  if (session.role !== "admin" && !clientesDeSesion(session).includes(clienteId)) {
    return NextResponse.json({ error: "No tienes acceso a este cliente" }, { status: 403 });
  }
  if (!campaignId) return NextResponse.json({ error: "Falta campaign_id" }, { status: 400 });
  if (!nombre) return NextResponse.json({ error: "Ponle un nombre al embudo" }, { status: 400 });

  const url = process.env.N8N_CONFIGURAR_EMBUDO_URL;
  if (!url) return NextResponse.json({ error: "N8N_CONFIGURAR_EMBUDO_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente_id: clienteId, campaign_id: campaignId, slug: nombre }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data?.error || "No se pudo configurar el embudo" }, { status: res.status });
    return NextResponse.json(Array.isArray(data) ? data[0] : data);
  } catch (err) {
    console.error("Error configurando embudo:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
