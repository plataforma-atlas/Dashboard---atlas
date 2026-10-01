import { SignJWT, jwtVerify } from "jose";

// Todo este flujo queda apagado (los botones no se muestran, las rutas
// responden 404) hasta que exista una app real de Meta con "Facebook Login
// for Business" — mientras tanto se sigue usando el método manual (pegar
// token) ya construido en app/v3/[clienteId]/conexiones. Ver
// DOCUMENTACION.md / la guía de setup para los pasos de creación de la app.
export function metaOAuthConfigurado(): boolean {
  return !!(process.env.META_APP_ID && process.env.META_APP_SECRET && process.env.META_OAUTH_STATE_SECRET);
}

export const META_GRAPH_VERSION = "v21.0";
export const META_OAUTH_STATE_COOKIE = "meta_oauth_state";
export const META_OAUTH_PENDING_COOKIE = "meta_oauth_pending";

// Permisos pedidos: ads_read + ads_management son Advanced Access (necesitan
// que Meta apruebe la app vía App Review + Verificación de empresa antes de
// que funcione para cuentas que no sean las propias de quien la creó).
export const META_OAUTH_SCOPES = ["ads_read", "ads_management"];

function getStateSecret() {
  const secret = process.env.META_OAUTH_STATE_SECRET;
  if (!secret) throw new Error("META_OAUTH_STATE_SECRET no está configurada");
  return new TextEncoder().encode(secret);
}

export type MetaOAuthState = { clienteId: string; nonce: string };

export async function firmarEstadoOAuth(payload: MetaOAuthState): Promise<string> {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("10m").sign(getStateSecret());
}

export async function verificarEstadoOAuth(token: string): Promise<MetaOAuthState | null> {
  try {
    const { payload } = await jwtVerify(token, getStateSecret());
    return payload as unknown as MetaOAuthState;
  } catch {
    return null;
  }
}

export type MetaCuentaPendiente = { id: string; label: string };
export type MetaOAuthPendiente = { clienteId: string; accessToken: string; cuentas: MetaCuentaPendiente[] };

// El token real de Meta viaja SOLO en esta cookie firmada httpOnly — nunca se
// manda al navegador. La página de Conexiones solo recibe la lista de
// cuentas (ver /api/oauth/meta/pendiente) para que la persona elija cuáles
// quiere activar; la confirmación (/api/oauth/meta/confirmar) vuelve a leer
// el token desde acá server-side.
export async function firmarPendienteOAuth(payload: MetaOAuthPendiente): Promise<string> {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("10m").sign(getStateSecret());
}

export async function verificarPendienteOAuth(token: string): Promise<MetaOAuthPendiente | null> {
  try {
    const { payload } = await jwtVerify(token, getStateSecret());
    return payload as unknown as MetaOAuthPendiente;
  } catch {
    return null;
  }
}
