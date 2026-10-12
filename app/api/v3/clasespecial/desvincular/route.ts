import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "@/lib/auth";
import { exigirAcceso } from "@/lib/permisos";

// A diferencia de desvincular GHL (un simple ghl_survey_id: null vía el PATCH
// genérico de dashboards), esto primero borra nuestro webhook en la API de
// ClasEspecial (si lo había) — por eso tiene su propia ruta, no reusa
// /api/v3/dashboards.
export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const clienteId = (body?.cliente_id ?? "").toString().trim();
  const dashboardId = Number(body?.dashboard_id) || 0;

  if (!clienteId || !dashboardId) return NextResponse.json({ error: "Falta cliente_id o dashboard_id" }, { status: 400 });
  const guardia = await exigirAcceso(session, clienteId, { escribir: true, dashboardId });
  if ("error" in guardia) return guardia.error;

  const url = process.env.N8N_CLASESPECIAL_DESVINCULAR_URL;
  if (!url) return NextResponse.json({ error: "N8N_CLASESPECIAL_DESVINCULAR_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente_id: clienteId, dashboard_id: dashboardId }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data?.error || "No se pudo desvincular" }, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error desvinculando ClasEspecial:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
