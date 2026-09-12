import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, clientesDeSesion } from "@/lib/auth";

function safeParse(text: string): any {
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  const checkinPublico = process.env.EVENTO_CHECKIN_PUBLICO === "true";
  if (!checkinPublico) {
    if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (session.role !== "admin" && session.role !== "checkin" && !clientesDeSesion(session).includes("atlas")) {
      return NextResponse.json({ error: "Sin acceso al evento" }, { status: 403 });
    }
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const url = process.env.N8N_EVENTO_BUSCAR_URL;
  if (!url) return NextResponse.json({ error: "N8N_EVENTO_BUSCAR_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(url);
    target.searchParams.set("q", q);
    const res = await fetch(target.toString(), { method: "GET", cache: "no-store" });
    const text = await res.text();
    if (!res.ok) {
      const body = safeParse(text) ?? {};
      return NextResponse.json({ error: body.error || "No pudimos completar la búsqueda" }, { status: res.status });
    }
    // Sin coincidencias, n8n responde con el cuerpo vacío en vez de "[]"
    const data = safeParse(text) ?? [];
    return NextResponse.json({ inscritos: data });
  } catch (err) {
    console.error("Error buscando inscritos:", err);
    return NextResponse.json({ error: "No pudimos completar la búsqueda. Intenta de nuevo." }, { status: 502 });
  }
}
