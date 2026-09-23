import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, clientesDeSesion } from "@/lib/auth";

export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const clienteId = (body?.cliente_id ?? "").toString().trim();
  const adAccountId = (body?.adAccountId ?? "").toString().trim().replace(/^act_/, "");
  const accessToken = (body?.accessToken ?? "").toString().trim();

  if (!clienteId) return NextResponse.json({ error: "Falta cliente_id" }, { status: 400 });
  if (session.role !== "admin" && !clientesDeSesion(session).includes(clienteId)) {
    return NextResponse.json({ error: "No tienes acceso a este cliente" }, { status: 403 });
  }
  if (!adAccountId) return NextResponse.json({ error: "Falta el ID de la cuenta publicitaria" }, { status: 400 });
  if (!accessToken) return NextResponse.json({ error: "Falta el token de acceso de Meta" }, { status: 400 });

  const url = process.env.N8N_ONBOARDING_CONECTAR_URL;
  if (!url) return NextResponse.json({ error: "N8N_ONBOARDING_CONECTAR_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente_id: clienteId,
        integration_type: "meta_ads",
        config: { ad_account_id: adAccountId },
        credential: accessToken,
      }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data?.error || "No se pudo guardar la conexión" }, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error conectando Meta Ads:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
