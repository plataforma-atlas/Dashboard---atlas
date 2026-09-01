import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "@/lib/auth";

export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  if (session.role !== "admin" && !session.clientes.includes("atlas")) {
    return NextResponse.json({ error: "Sin acceso al evento" }, { status: 403 });
  }

  const url = process.env.N8N_EVENTO_CHECKIN_RESUMEN_URL;
  if (!url) return NextResponse.json({ error: "N8N_EVENTO_CHECKIN_RESUMEN_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json({ error: body.error || "No se pudo consultar el resumen" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({ resumen: data });
  } catch (err) {
    console.error("Error consultando resumen de check-in:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
