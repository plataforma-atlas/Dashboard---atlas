import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, clientesDeSesion } from "@/lib/auth";

export async function GET(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const webinar_id = searchParams.get("webinar_id") ?? "";
  const cliente_id = searchParams.get("cliente_id") ?? "";

  if (!webinar_id || !cliente_id) {
    return NextResponse.json({ error: "Faltan parámetros: webinar_id y cliente_id son requeridos" }, { status: 400 });
  }

  if (session.role !== "admin" && !clientesDeSesion(session).includes(cliente_id)) {
    return NextResponse.json({ error: "Sin acceso a este cliente" }, { status: 403 });
  }

  const url = process.env.N8N_WEBINAR_DETALLE_URL;
  if (!url) return NextResponse.json({ error: "N8N_WEBINAR_DETALLE_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(url);
    target.searchParams.set("webinar_id", webinar_id);
    target.searchParams.set("cliente_id", cliente_id);
    const res = await fetch(target.toString(), { method: "GET", cache: "no-store" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json({ error: body.error || "No se pudo consultar el detalle del webinar" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error consultando detalle del webinar:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
