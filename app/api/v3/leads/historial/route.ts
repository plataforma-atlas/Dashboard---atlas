import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, clientesDeSesion } from "@/lib/auth";

export async function GET(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cliente_id = searchParams.get("cliente_id") ?? "";
  const correo = searchParams.get("correo") ?? "";
  const telefono = searchParams.get("telefono") ?? "";

  if (session.role !== "admin" && !clientesDeSesion(session).includes(cliente_id)) {
    return NextResponse.json({ error: "Sin acceso a este cliente" }, { status: 403 });
  }
  if (!correo && !telefono) {
    return NextResponse.json({ error: "Falta correo o teléfono" }, { status: 400 });
  }

  const url = process.env.N8N_V3_LEADS_HISTORIAL_URL;
  if (!url) return NextResponse.json({ error: "N8N_V3_LEADS_HISTORIAL_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(url);
    target.searchParams.set("cliente_id", cliente_id);
    if (correo) target.searchParams.set("correo", correo);
    if (telefono) target.searchParams.set("telefono", telefono);
    const res = await fetch(target.toString(), { method: "GET", cache: "no-store" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json({ error: body.error || "No se pudo cargar el historial" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({ historial: Array.isArray(data) ? data : [] });
  } catch (err) {
    console.error("Error consultando historial de lead:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
