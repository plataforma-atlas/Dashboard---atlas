import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  META_GRAPH_VERSION,
  META_OAUTH_PENDING_COOKIE,
  META_OAUTH_STATE_COOKIE,
  firmarPendienteOAuth,
  metaOAuthConfigurado,
  verificarEstadoOAuth,
} from "@/lib/meta-oauth";

export async function GET(req: Request) {
  if (!metaOAuthConfigurado()) return NextResponse.json({ error: "Conexión con Meta vía Facebook todavía no está habilitada" }, { status: 404 });

  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorMeta = searchParams.get("error_message") || searchParams.get("error");

  const estadoCookie = cookies().get(META_OAUTH_STATE_COOKIE)?.value;

  function irAConexionesConError(mensaje: string, clienteId?: string) {
    const url = new URL(`${origin}/v3/${clienteId || ""}/conexiones`);
    url.searchParams.set("meta_oauth_error", mensaje);
    const res = NextResponse.redirect(url.toString());
    res.cookies.delete(META_OAUTH_STATE_COOKIE);
    return res;
  }

  if (errorMeta) return irAConexionesConError(errorMeta);
  if (!code || !state || !estadoCookie || state !== estadoCookie) {
    return irAConexionesConError("No se pudo validar la conexión con Meta, intentá de nuevo");
  }

  const estado = await verificarEstadoOAuth(state);
  if (!estado) return irAConexionesConError("El enlace de conexión expiró, intentá de nuevo");

  const redirectUri = `${origin}/api/oauth/meta/callback`;

  try {
    // 1) code -> token de corta duración
    const cortaUrl = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`);
    cortaUrl.searchParams.set("client_id", process.env.META_APP_ID!);
    cortaUrl.searchParams.set("client_secret", process.env.META_APP_SECRET!);
    cortaUrl.searchParams.set("redirect_uri", redirectUri);
    cortaUrl.searchParams.set("code", code);
    const cortaRes = await fetch(cortaUrl.toString());
    const cortaData = await cortaRes.json();
    if (!cortaRes.ok || !cortaData.access_token) {
      console.error("Error intercambiando code de Meta:", cortaData);
      return irAConexionesConError("Meta rechazó la conexión", estado.clienteId);
    }

    // 2) token corto -> token largo (no vence en 1-2 horas, dura ~60 días)
    const largaUrl = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`);
    largaUrl.searchParams.set("grant_type", "fb_exchange_token");
    largaUrl.searchParams.set("client_id", process.env.META_APP_ID!);
    largaUrl.searchParams.set("client_secret", process.env.META_APP_SECRET!);
    largaUrl.searchParams.set("fb_exchange_token", cortaData.access_token);
    const largaRes = await fetch(largaUrl.toString());
    const largaData = await largaRes.json();
    const accessToken: string = largaData.access_token || cortaData.access_token;

    // 3) listar las cuentas publicitarias a las que esta persona nos dio acceso
    const cuentasUrl = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/me/adaccounts`);
    cuentasUrl.searchParams.set("fields", "id,name,account_status");
    cuentasUrl.searchParams.set("access_token", accessToken);
    const cuentasRes = await fetch(cuentasUrl.toString());
    const cuentasData = await cuentasRes.json();
    if (!cuentasRes.ok) {
      console.error("Error listando cuentas de Meta:", cuentasData);
      return irAConexionesConError("No se pudieron leer tus cuentas publicitarias", estado.clienteId);
    }

    const cuentas = (Array.isArray(cuentasData.data) ? cuentasData.data : []).map((c: { id: string; name?: string }) => ({
      id: c.id.replace(/^act_/, ""),
      label: c.name || c.id,
    }));

    const pendiente = await firmarPendienteOAuth({ clienteId: estado.clienteId, accessToken, cuentas });

    const destino = new URL(`${origin}/v3/${estado.clienteId}/conexiones`);
    destino.searchParams.set("meta_oauth", "listo");
    const res = NextResponse.redirect(destino.toString());
    res.cookies.delete(META_OAUTH_STATE_COOKIE);
    res.cookies.set(META_OAUTH_PENDING_COOKIE, pendiente, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
    return res;
  } catch (err) {
    console.error("Error en callback de Meta OAuth:", err);
    return irAConexionesConError("No se pudo conectar con Meta", estado.clienteId);
  }
}
