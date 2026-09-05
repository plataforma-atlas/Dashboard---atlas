import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "@/lib/auth";

export async function GET(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  const checkinPublico = process.env.EVENTO_CHECKIN_PUBLICO === "true";
  if (!checkinPublico) {
    if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (session.role !== "admin" && session.role !== "checkin" && !session.clientes.includes("atlas")) {
      return NextResponse.json({ error: "Sin acceso al evento" }, { status: 403 });
    }
  }

  const { searchParams } = new URL(req.url);
  const tier = searchParams.get("tier") || "VIP";

  const url = process.env.N8N_EVENTO_LISTAR_POR_TIER_URL;
  if (!url) return NextResponse.json({ error: "N8N_EVENTO_LISTAR_POR_TIER_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(url);
    target.searchParams.set("tier", tier);
    const res = await fetch(target.toString(), { method: "GET", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data.error || "No se pudo consultar la lista" }, { status: res.status });
    return NextResponse.json({ inscritos: Array.isArray(data) ? data : [] });
  } catch (err) {
    console.error("Error listando por tier:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
