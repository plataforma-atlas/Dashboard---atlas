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

  const body = await req.json().catch(() => ({}));
  const lead_id = body?.lead_id;
  if (!lead_id) return NextResponse.json({ error: "Falta lead_id" }, { status: 400 });

  const url = process.env.N8N_EVENTO_CHECKIN_DESHACER_URL;
  if (!url) return NextResponse.json({ error: "N8N_EVENTO_CHECKIN_DESHACER_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data.error || "No se pudo deshacer el check-in" }, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error deshaciendo el check-in:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
