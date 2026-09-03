import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "@/lib/auth";

export async function GET(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  if (session.role !== "admin" && session.role !== "checkin" && !session.clientes.includes("atlas")) {
    return NextResponse.json({ error: "Sin acceso al evento" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const url = process.env.N8N_EVENTO_BUSCAR_URL;
  if (!url) return NextResponse.json({ error: "N8N_EVENTO_BUSCAR_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(url);
    target.searchParams.set("q", q);
    const res = await fetch(target.toString(), { method: "GET", cache: "no-store" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json({ error: body.error || "No se pudo buscar" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({ inscritos: data });
  } catch (err) {
    console.error("Error buscando inscritos:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
