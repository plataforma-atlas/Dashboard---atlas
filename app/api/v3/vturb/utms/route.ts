import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "@/lib/auth";
import { exigirAcceso } from "@/lib/permisos";

// Qué parámetros UTM le están llegando de verdad a un reproductor — se usa
// para que, al configurar VTurb en un dashboard, la persona elija el
// parámetro real (ej. utm_content) en vez de que lo adivinemos.
export async function GET(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clienteId = searchParams.get("cliente_id") ?? "";
  const playerId = searchParams.get("player_id") ?? "";

  const guardia = await exigirAcceso(session, clienteId, {});
  if ("error" in guardia) return guardia.error;
  if (!playerId) return NextResponse.json({ error: "Falta player_id" }, { status: 400 });

  const url = process.env.N8N_VTURB_UTMS_URL;
  if (!url) return NextResponse.json({ error: "N8N_VTURB_UTMS_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(url);
    target.searchParams.set("cliente_id", clienteId);
    target.searchParams.set("player_id", playerId);
    // Ventana amplia por defecto: solo nos interesa qué parámetros existen,
    // no un conteo exacto por período.
    target.searchParams.set("start_date", "2000-01-01 00:00:00");
    const res = await fetch(target.toString(), { method: "GET", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data?.error || "No se pudo consultar VTurb" }, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error consultando parámetros UTM de VTurb:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
