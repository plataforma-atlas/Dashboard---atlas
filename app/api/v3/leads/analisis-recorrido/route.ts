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

  const guardia = await exigirAcceso(session, cliente_id, {});
  if ("error" in guardia) return guardia.error;
  if (guardia.acceso.dashboards !== null) {
    return NextResponse.json({ error: "Este análisis cruza todos los dashboards y solo está disponible con acceso completo" }, { status: 403 });
  }

  const url = process.env.N8N_V3_LEADS_ANALISIS_RECORRIDO_URL;
  if (!url) return NextResponse.json({ error: "N8N_V3_LEADS_ANALISIS_RECORRIDO_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(url);
    target.searchParams.set("cliente_id", cliente_id);
    const res = await fetch(target.toString(), { method: "GET", cache: "no-store" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json({ error: body.error || "No se pudo calcular el análisis" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error consultando análisis de recorrido:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
