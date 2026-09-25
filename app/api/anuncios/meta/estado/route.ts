import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, clientesDeSesion } from "@/lib/auth";

export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const cliente_id = (body?.cliente_id ?? "").toString().trim();
  const id = (body?.id ?? "").toString().trim();
  const status = (body?.status ?? "").toString().trim();

  if (session.role !== "admin" && !clientesDeSesion(session).includes(cliente_id)) {
    return NextResponse.json({ error: "Sin acceso a este cliente" }, { status: 403 });
  }
  if (!id) return NextResponse.json({ error: "Falta el id del anuncio o campaña" }, { status: 400 });
  if (status !== "ACTIVE" && status !== "PAUSED") {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const url = process.env.N8N_META_ADS_ESTADO_URL;
  if (!url) return NextResponse.json({ error: "N8N_META_ADS_ESTADO_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente_id, id, status }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      return NextResponse.json({ error: data?.error || "No se pudo cambiar el estado en Meta" }, { status: res.status || 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error cambiando estado en Meta Ads:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
