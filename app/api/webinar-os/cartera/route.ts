import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "@/lib/auth";

export async function GET(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Solo un administrador puede ver la cartera" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const fecha_inicio = searchParams.get("fecha_inicio") ?? "";
  const fecha_fin = searchParams.get("fecha_fin") ?? "";

  const url = process.env.N8N_WEBINAR_CARTERA_URL;
  if (!url) return NextResponse.json({ error: "N8N_WEBINAR_CARTERA_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(url);
    if (fecha_inicio) target.searchParams.set("fecha_inicio", fecha_inicio);
    if (fecha_fin) target.searchParams.set("fecha_fin", fecha_fin);
    const res = await fetch(target.toString(), { method: "GET", cache: "no-store" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json({ error: body.error || "No se pudo consultar la cartera" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({ cartera: data });
  } catch (err) {
    console.error("Error consultando la cartera:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
