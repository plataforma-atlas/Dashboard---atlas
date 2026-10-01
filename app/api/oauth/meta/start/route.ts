import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, clientesDeSesion } from "@/lib/auth";
import { META_GRAPH_VERSION, META_OAUTH_SCOPES, META_OAUTH_STATE_COOKIE, firmarEstadoOAuth, metaOAuthConfigurado } from "@/lib/meta-oauth";

export async function GET(req: Request) {
  if (!metaOAuthConfigurado()) return NextResponse.json({ error: "Conexión con Meta vía Facebook todavía no está habilitada" }, { status: 404 });

  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams, origin } = new URL(req.url);
  const clienteId = (searchParams.get("cliente_id") ?? "").trim();
  if (!clienteId) return NextResponse.json({ error: "Falta cliente_id" }, { status: 400 });
  if (session.role !== "admin" && !clientesDeSesion(session).includes(clienteId)) {
    return NextResponse.json({ error: "No tienes acceso a este cliente" }, { status: 403 });
  }

  const nonce = crypto.randomUUID();
  const state = await firmarEstadoOAuth({ clienteId, nonce });

  const redirectUri = `${origin}/api/oauth/meta/callback`;
  const dialogUrl = new URL(`https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth`);
  dialogUrl.searchParams.set("client_id", process.env.META_APP_ID!);
  dialogUrl.searchParams.set("redirect_uri", redirectUri);
  dialogUrl.searchParams.set("state", state);
  dialogUrl.searchParams.set("scope", META_OAUTH_SCOPES.join(","));
  dialogUrl.searchParams.set("response_type", "code");

  const res = NextResponse.redirect(dialogUrl.toString());
  res.cookies.set(META_OAUTH_STATE_COOKIE, state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  return res;
}
