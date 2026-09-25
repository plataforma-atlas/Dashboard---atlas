import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, clientesDeSesion } from "@/lib/auth";

export async function GET(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cliente_id = searchParams.get("cliente_id") ?? "";
  const dashboard_id = searchParams.get("dashboard_id") ?? "";

  if (session.role !== "admin" && !clientesDeSesion(session).includes(cliente_id)) {
    return NextResponse.json({ error: "Sin acceso a este cliente" }, { status: 403 });
  }
  if (!dashboard_id) return NextResponse.json({ error: "Falta dashboard_id" }, { status: 400 });

  const url = process.env.N8N_V3_CAPTACION_PUNTOS_URL;
  if (!url) return NextResponse.json({ error: "N8N_V3_CAPTACION_PUNTOS_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(url);
    target.searchParams.set("dashboard_id", dashboard_id);
    target.searchParams.set("cliente_id", cliente_id);
    const res = await fetch(target.toString(), { method: "GET", cache: "no-store" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json({ error: body.error || "No se pudieron cargar los puntos de captación" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({ puntos: Array.isArray(data) ? data : [] });
  } catch (err) {
    console.error("Error consultando puntos de captación:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const clienteId = (body?.cliente_id ?? "").toString().trim();
  const dashboardId = (body?.dashboard_id ?? "").toString().trim();
  const nombre = (body?.nombre ?? "").toString().trim();
  const etiquetaGhl = (body?.etiqueta_ghl ?? "").toString().trim();

  if (!clienteId) return NextResponse.json({ error: "Falta cliente_id" }, { status: 400 });
  if (session.role !== "admin" && !clientesDeSesion(session).includes(clienteId)) {
    return NextResponse.json({ error: "No tienes acceso a este cliente" }, { status: 403 });
  }
  if (!dashboardId) return NextResponse.json({ error: "Falta dashboard_id" }, { status: 400 });
  if (!nombre) return NextResponse.json({ error: "Falta el nombre del punto de captación" }, { status: 400 });
  if (!etiquetaGhl) return NextResponse.json({ error: "Falta la etiqueta para Go High Level" }, { status: 400 });

  const url = process.env.N8N_V3_CAPTACION_PUNTOS_URL;
  if (!url) return NextResponse.json({ error: "N8N_V3_CAPTACION_PUNTOS_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente_id: clienteId, dashboard_id: dashboardId, nombre, etiqueta_ghl: etiquetaGhl }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data?.error || "No se pudo crear el punto de captación" }, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error creando punto de captación:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
