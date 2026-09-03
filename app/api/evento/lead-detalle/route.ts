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
  const leadId = searchParams.get("lead_id");
  if (!leadId) return NextResponse.json({ error: "Falta lead_id" }, { status: 400 });

  const url = process.env.N8N_EVENTO_LEAD_DETALLE_URL;
  if (!url) return NextResponse.json({ error: "N8N_EVENTO_LEAD_DETALLE_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(url);
    target.searchParams.set("lead_id", leadId);
    const res = await fetch(target.toString(), { method: "GET", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data.error || "No se pudo consultar el lead" }, { status: res.status });
    return NextResponse.json({ lead: Array.isArray(data) ? data[0] : data });
  } catch (err) {
    console.error("Error consultando el lead:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
