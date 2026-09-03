import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "@/lib/auth";

export async function GET(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cliente_id = searchParams.get("cliente_id") ?? "";
  const fecha_inicio = searchParams.get("fecha_inicio") ?? "";
  const fecha_fin = searchParams.get("fecha_fin") ?? "";

  if (!cliente_id) return NextResponse.json({ error: "Falta cliente_id" }, { status: 400 });
  if (session.role !== "admin" && !session.clientes.includes(cliente_id)) {
    return NextResponse.json({ error: "Sin acceso a este cliente" }, { status: 403 });
  }

  const url = process.env.N8N_WEBINAR_CARTERA_POR_CAMPANA_URL;
  if (!url) return NextResponse.json({ error: "N8N_WEBINAR_CARTERA_POR_CAMPANA_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(url);
    target.searchParams.set("cliente_id", cliente_id);
    if (fecha_inicio) target.searchParams.set("fecha_inicio", fecha_inicio);
    if (fecha_fin) target.searchParams.set("fecha_fin", fecha_fin);
    const res = await fetch(target.toString(), { method: "GET", cache: "no-store" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json({ error: body.error || "No se pudo consultar la cartera por campaña" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({ campanas: data });
  } catch (err) {
    console.error("Error consultando la cartera por campaña:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
