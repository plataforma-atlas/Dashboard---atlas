import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, clientesDeSesion } from "@/lib/auth";

export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const clienteId = (body?.cliente_id ?? "").toString().trim();

  if (!clienteId) return NextResponse.json({ error: "Falta cliente_id" }, { status: 400 });
  if (session.role !== "admin" && !clientesDeSesion(session).includes(clienteId)) {
    return NextResponse.json({ error: "No tienes acceso a este cliente" }, { status: 403 });
  }

  const url = process.env.N8N_WORDPRESS_PUBLICAR_URL;
  if (!url) return NextResponse.json({ error: "N8N_WORDPRESS_PUBLICAR_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente_id: clienteId,
        captura: body?.captura ?? null,
        encuesta: body?.encuesta ?? null,
        gracias: body?.gracias ?? null,
      }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data?.error || "No se pudo publicar en WordPress" }, { status: res.status });
    return NextResponse.json({ resultados: data });
  } catch (err) {
    console.error("Error publicando en WordPress:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
