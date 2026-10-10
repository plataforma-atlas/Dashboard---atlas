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

  const url = process.env.N8N_VTURB_PLAYERS_URL;
  if (!url) return NextResponse.json({ error: "N8N_VTURB_PLAYERS_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(url);
    target.searchParams.set("cliente_id", clienteId);
    const res = await fetch(target.toString(), { method: "GET", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data?.error || "No se pudo consultar VTurb" }, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error consultando reproductores de VTurb:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
