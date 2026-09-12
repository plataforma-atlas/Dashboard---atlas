import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, clientesDeSesion } from "@/lib/auth";

export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  const checkinPublico = process.env.EVENTO_CHECKIN_PUBLICO === "true";
  if (!checkinPublico) {
    if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (session.role !== "admin" && session.role !== "checkin" && !clientesDeSesion(session).includes("atlas")) {
      return NextResponse.json({ error: "Sin acceso al evento" }, { status: 403 });
    }
  }

  const body = await req.json().catch(() => null);
  if (!body?.lead_id) return NextResponse.json({ error: "Falta lead_id" }, { status: 400 });

  const url = process.env.N8N_EVENTO_LEAD_ACTUALIZAR_URL;
  if (!url) return NextResponse.json({ error: "N8N_EVENTO_LEAD_ACTUALIZAR_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead_id: body.lead_id,
        name: body.name ?? null,
        email: body.email ?? null,
        phone: body.phone ?? null,
        notes: body.notes ?? null,
      }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data.error || "No se pudo actualizar el lead" }, { status: res.status });
    return NextResponse.json({ lead: Array.isArray(data) ? data[0] : data });
  } catch (err) {
    console.error("Error actualizando el lead:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
