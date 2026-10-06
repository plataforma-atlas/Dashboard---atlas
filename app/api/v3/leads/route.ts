import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, clientesDeSesion } from "@/lib/auth";
import { exigirAcceso } from "@/lib/permisos";

export async function GET(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cliente_id = searchParams.get("cliente_id") ?? "";
  const status = searchParams.get("status") ?? "";
  const dashboard_id = searchParams.get("dashboard_id") ?? "";
  const fecha_inicio = searchParams.get("fecha_inicio") ?? "";
  const fecha_fin = searchParams.get("fecha_fin") ?? "";

  const guardia = await exigirAcceso(session, cliente_id, { dashboardId: dashboard_id ? Number(dashboard_id) : null });
  if ("error" in guardia) return guardia.error;
  if (guardia.acceso.dashboards !== null && !dashboard_id) {
    return NextResponse.json({ error: "Elegí un dashboard para ver sus leads" }, { status: 400 });
  }

  const url = process.env.N8N_V3_LEADS_URL;
  if (!url) return NextResponse.json({ error: "N8N_V3_LEADS_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(url);
    target.searchParams.set("cliente_id", cliente_id);
    if (status) target.searchParams.set("status", status);
    if (dashboard_id) target.searchParams.set("dashboard_id", dashboard_id);
    if (fecha_inicio) target.searchParams.set("fecha_inicio", fecha_inicio);
    if (fecha_fin) target.searchParams.set("fecha_fin", fecha_fin);
    const res = await fetch(target.toString(), { method: "GET", cache: "no-store" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json({ error: body.error || "No se pudieron cargar los leads" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({ leads: Array.isArray(data) ? data : [] });
  } catch (err) {
    console.error("Error consultando leads:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
