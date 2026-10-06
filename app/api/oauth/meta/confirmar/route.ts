import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, clientesDeSesion } from "@/lib/auth";
import { exigirAcceso } from "@/lib/permisos";
import { META_OAUTH_PENDING_COOKIE, metaOAuthConfigurado, verificarPendienteOAuth } from "@/lib/meta-oauth";

export async function POST(req: Request) {
  if (!metaOAuthConfigurado()) return NextResponse.json({ error: "No disponible" }, { status: 404 });

  const sessionToken = cookies().get(COOKIE_NAME)?.value;
  const session = sessionToken ? await verifySession(sessionToken) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const clienteId = (body?.cliente_id ?? "").toString().trim();
  const idsSeleccionados: string[] = Array.isArray(body?.cuentaIds) ? body.cuentaIds.map((v: unknown) => String(v)) : [];

  const guardia = await exigirAcceso(session, clienteId, { escribir: true });
  if ("error" in guardia) return guardia.error;
  if (idsSeleccionados.length === 0) return NextResponse.json({ error: "Elegí al menos una cuenta publicitaria" }, { status: 400 });

  const pendienteCookie = cookies().get(META_OAUTH_PENDING_COOKIE)?.value;
  const pendiente = pendienteCookie ? await verificarPendienteOAuth(pendienteCookie) : null;
  if (!pendiente || pendiente.clienteId !== clienteId) {
    return NextResponse.json({ error: "La conexión con Meta expiró, volvé a intentarlo" }, { status: 404 });
  }

  const cuentas = pendiente.cuentas.filter((c) => idsSeleccionados.includes(c.id));
  if (cuentas.length === 0) return NextResponse.json({ error: "Las cuentas elegidas ya no son válidas, volvé a intentarlo" }, { status: 400 });

  const url = process.env.N8N_ONBOARDING_CONECTAR_URL;
  if (!url) return NextResponse.json({ error: "N8N_ONBOARDING_CONECTAR_URL no está configurada" }, { status: 500 });

  try {
    // Mismo webhook y misma forma de guardar que el método manual
    // (app/api/onboarding/conectar-meta-ads) — el token nunca pasó por el
    // navegador, solo viajó server-side desde el callback hasta acá.
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente_id: clienteId,
        integration_type: "meta_ads",
        config: { ad_accounts: cuentas },
        credential: pendiente.accessToken,
      }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data?.error || "No se pudo guardar la conexión" }, { status: res.status });

    const out = NextResponse.json({ ok: true });
    out.cookies.delete(META_OAUTH_PENDING_COOKIE);
    return out;
  } catch (err) {
    console.error("Error confirmando conexión OAuth de Meta:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
