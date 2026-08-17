import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FunnelRow } from "@/lib/types";
import { COOKIE_NAME, verifySession } from "@/lib/auth";

export async function GET(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ source: "error", rows: [], message: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const campaign_id = searchParams.get("campaign_id") ?? "";
  const cliente_id = searchParams.get("cliente_id") ?? "";
  const fecha_inicio = searchParams.get("fecha_inicio") ?? "";
  const fecha_fin = searchParams.get("fecha_fin") ?? "";
  const pais = searchParams.get("pais") ?? "";

  if (!campaign_id) {
    return NextResponse.json({ source: "error", rows: [], message: "Falta campaign_id" }, { status: 400 });
  }

  // Defensa en profundidad: un usuario "client" no puede pedir datos de un
  // cliente que no es suyo, aunque manipule la URL directamente.
  if (session.role !== "admin" && cliente_id && !session.clientes.includes(cliente_id)) {
    return NextResponse.json({ source: "error", rows: [], message: "Sin acceso a este cliente" }, { status: 403 });
  }

  const webhookUrl = process.env.N8N_CALCULAR_EMBUDO_URL;
  if (!webhookUrl) {
    return NextResponse.json({ source: "error", rows: [], message: "N8N_CALCULAR_EMBUDO_URL no está configurada" }, { status: 500 });
  }

  try {
    const url = new URL(webhookUrl);
    url.searchParams.set("campaign_id", campaign_id);
    if (fecha_inicio) url.searchParams.set("fecha_inicio", fecha_inicio);
    if (fecha_fin) url.searchParams.set("fecha_fin", fecha_fin);
    if (pais) url.searchParams.set("pais", pais);

    const res = await fetch(url.toString(), { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json({ source: "error", rows: [], message: body.error || `n8n respondió ${res.status}` }, { status: res.status });
    }

    const data = (await res.json()) as FunnelRow[];
    return NextResponse.json({ source: "n8n", rows: data });
  } catch (err) {
    console.error("Error consultando calcular-embudo:", err);
    return NextResponse.json({ source: "error", rows: [], message: "No se pudo conectar al webhook de n8n" }, { status: 502 });
  }
}
