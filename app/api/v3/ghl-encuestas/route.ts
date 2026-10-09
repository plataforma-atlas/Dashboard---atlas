import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "@/lib/auth";
import { exigirAcceso } from "@/lib/permisos";

// GET lista las encuestas de la cuenta de GHL conectada del cliente (para que
// la persona elija cuál corresponde a este dashboard, sin escribir nada a mano).
export async function GET(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clienteId = (searchParams.get("cliente_id") ?? "").trim();
  if (!clienteId) return NextResponse.json({ error: "Falta cliente_id" }, { status: 400 });

  const guardia = await exigirAcceso(session, clienteId, {});
  if ("error" in guardia) return guardia.error;

  const url = process.env.N8N_GHL_ENCUESTAS_LISTAR_URL;
  if (!url) return NextResponse.json({ error: "N8N_GHL_ENCUESTAS_LISTAR_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(url);
    target.searchParams.set("cliente_id", clienteId);
    const res = await fetch(target.toString(), { method: "GET", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data?.error || "No se pudieron listar las encuestas de GHL" }, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error listando encuestas de GHL:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}

// POST sincroniza las preguntas de una encuesta de GHL puntual hacia un
// dashboard — trae el detalle real de la encuesta (texto, tipo, opciones,
// clave estable) y reemplaza `preguntas_encuesta` entera, además de guardar
// `ghl_survey_id` para que el webhook de Encuesta deje de confiar en el texto
// y empiece a pedirle la respuesta real a GHL (ver Integraciones — Eventos de
// Embudo). Se puede volver a llamar cuando quieran (ej. agregaron una
// pregunta nueva en GHL) — siempre reemplaza entero, nunca hay que
// sincronizar a mano.
export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const clienteId = (body?.cliente_id ?? "").toString().trim();
  const dashboardId = Number(body?.dashboard_id) || 0;
  const surveyId = (body?.survey_id ?? "").toString().trim();

  if (!clienteId || !dashboardId) return NextResponse.json({ error: "Falta cliente_id o dashboard_id" }, { status: 400 });
  const guardia = await exigirAcceso(session, clienteId, { escribir: true, dashboardId });
  if ("error" in guardia) return guardia.error;
  if (!surveyId) return NextResponse.json({ error: "Falta survey_id" }, { status: 400 });

  const url = process.env.N8N_GHL_ENCUESTAS_SINCRONIZAR_URL;
  if (!url) return NextResponse.json({ error: "N8N_GHL_ENCUESTAS_SINCRONIZAR_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente_id: clienteId, dashboard_id: dashboardId, survey_id: surveyId }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data?.error || "No se pudo sincronizar la encuesta" }, { status: res.status });
    return NextResponse.json(Array.isArray(data) ? data[0] : data);
  } catch (err) {
    console.error("Error sincronizando encuesta de GHL:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
