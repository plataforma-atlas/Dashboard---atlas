import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "@/lib/auth";

export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  const checkinPublico = process.env.EVENTO_CHECKIN_PUBLICO === "true";
  if (!checkinPublico) {
    if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (session.role !== "admin" && session.role !== "checkin" && !session.clientes.includes("atlas")) {
      return NextResponse.json({ error: "Sin acceso al evento" }, { status: 403 });
    }
  }

  const body = await req.json().catch(() => null);
  if (!body?.lead_id) return NextResponse.json({ error: "Falta lead_id" }, { status: 400 });
  if (!body?.name?.trim()) return NextResponse.json({ error: "Falta el nombre del invitado" }, { status: 400 });

  const url = process.env.N8N_EVENTO_INVITADO_GUARDAR_URL;
  if (!url) return NextResponse.json({ error: "N8N_EVENTO_INVITADO_GUARDAR_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead_id: body.lead_id,
        name: body.name,
        phone: body.phone ?? null,
        email: body.email ?? null,
      }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data.error || "No se pudo guardar el invitado" }, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error guardando el invitado:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
