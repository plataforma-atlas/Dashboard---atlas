import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, clientesDeSesion } from "@/lib/auth";

export async function GET(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const clienteId = new URL(req.url).searchParams.get("cliente_id") ?? "";
  if (!clienteId) return NextResponse.json({ error: "Falta cliente_id" }, { status: 400 });
  if (session.role !== "admin" && !clientesDeSesion(session).includes(clienteId)) {
    return NextResponse.json({ error: "No tienes acceso a este cliente" }, { status: 403 });
  }

  const url = process.env.N8N_ONBOARDING_ESTADO_URL;
  if (!url) return NextResponse.json({ error: "N8N_ONBOARDING_ESTADO_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(`${url}?cliente_id=${encodeURIComponent(clienteId)}`, { cache: "no-store" });
    const data = await res.json().catch(() => ([]));
    if (!res.ok) return NextResponse.json({ error: "No se pudo consultar el estado de conexiones" }, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error consultando estado de conexiones:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
