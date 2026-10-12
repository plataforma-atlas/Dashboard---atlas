import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "@/lib/auth";
import { exigirAcceso } from "@/lib/permisos";

export async function GET(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clienteId = searchParams.get("cliente_id") ?? "";

  const guardia = await exigirAcceso(session, clienteId, {});
  if ("error" in guardia) return guardia.error;

  const url = process.env.N8N_CLASESPECIAL_ENCUESTAS_LISTAR_URL;
  if (!url) return NextResponse.json({ error: "N8N_CLASESPECIAL_ENCUESTAS_LISTAR_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(url);
    target.searchParams.set("cliente_id", clienteId);
    const res = await fetch(target.toString(), { method: "GET", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data?.error || "No se pudo consultar ClasEspecial" }, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error consultando encuestas de ClasEspecial:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}

// Trae la encuesta elegida, la registra como preguntas del dashboard, y
// registra (o reemplaza) nuestro propio webhook en la API de ClasEspecial —
// la persona no pega ninguna URL ni clave a mano, ver DOCUMENTACION.md.
export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const clienteId = (body?.cliente_id ?? "").toString().trim();
  const dashboardId = Number(body?.dashboard_id) || 0;
  const encuestaId = (body?.encuesta_id ?? "").toString().trim();
  const webhookUrl = (body?.webhook_url ?? "").toString().trim();

  if (!clienteId || !dashboardId) return NextResponse.json({ error: "Falta cliente_id o dashboard_id" }, { status: 400 });
  const guardia = await exigirAcceso(session, clienteId, { escribir: true, dashboardId });
  if ("error" in guardia) return guardia.error;
  if (!encuestaId || !webhookUrl) return NextResponse.json({ error: "Falta encuesta_id o webhook_url" }, { status: 400 });

  const url = process.env.N8N_CLASESPECIAL_ENCUESTAS_SINCRONIZAR_URL;
  if (!url) return NextResponse.json({ error: "N8N_CLASESPECIAL_ENCUESTAS_SINCRONIZAR_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente_id: clienteId, dashboard_id: dashboardId, encuesta_id: encuestaId, webhook_url: webhookUrl }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data?.error || "No se pudo sincronizar la encuesta" }, { status: res.status });
    return NextResponse.json(Array.isArray(data) ? data[0] : data);
  } catch (err) {
    console.error("Error sincronizando encuesta de ClasEspecial:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
