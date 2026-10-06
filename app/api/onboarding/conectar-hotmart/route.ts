import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, clientesDeSesion } from "@/lib/auth";
import { exigirAcceso } from "@/lib/permisos";

export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const clienteId = (body?.cliente_id ?? "").toString().trim();
  const hottok = (body?.hottok ?? "").toString().trim();

  if (!clienteId) return NextResponse.json({ error: "Falta cliente_id" }, { status: 400 });
  const guardia = await exigirAcceso(session, clienteId, { escribir: true });
  if ("error" in guardia) return guardia.error;
  if (!hottok) return NextResponse.json({ error: "Falta el Hottok de Hotmart" }, { status: 400 });

  const url = process.env.N8N_ONBOARDING_CONECTAR_URL;
  if (!url) return NextResponse.json({ error: "N8N_ONBOARDING_CONECTAR_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente_id: clienteId,
        integration_type: "hotmart",
        config: {},
        credential: hottok,
      }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data?.error || "No se pudo guardar la conexión" }, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error conectando Hotmart:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
