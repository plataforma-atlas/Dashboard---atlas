import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, clientesDeSesion } from "@/lib/auth";
import { META_OAUTH_PENDING_COOKIE, metaOAuthConfigurado, verificarPendienteOAuth } from "@/lib/meta-oauth";

// Devuelve solo la lista de cuentas publicitarias que Meta nos dio tras el
// login — nunca el access_token, que se queda server-side en la cookie
// firmada hasta /api/oauth/meta/confirmar.
export async function GET(req: Request) {
  if (!metaOAuthConfigurado()) return NextResponse.json({ error: "No disponible" }, { status: 404 });

  const sessionToken = cookies().get(COOKIE_NAME)?.value;
  const session = sessionToken ? await verifySession(sessionToken) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clienteId = (searchParams.get("cliente_id") ?? "").trim();
  if (session.role !== "admin" && !clientesDeSesion(session).includes(clienteId)) {
    return NextResponse.json({ error: "No tienes acceso a este cliente" }, { status: 403 });
  }

  const pendienteCookie = cookies().get(META_OAUTH_PENDING_COOKIE)?.value;
  const pendiente = pendienteCookie ? await verificarPendienteOAuth(pendienteCookie) : null;
  if (!pendiente || pendiente.clienteId !== clienteId) {
    return NextResponse.json({ error: "No hay ninguna conexión de Meta pendiente de confirmar" }, { status: 404 });
  }

  return NextResponse.json({ cuentas: pendiente.cuentas });
}
