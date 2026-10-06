import { SignJWT, jwtVerify } from "jose";

export type InvitePayload = {
  purpose: "client_invite";
  cliente_id: string;
  cliente_nombre: string;
  // A dónde mandar al invitado después de crear su cuenta (ver uso en
  // app/api/auth/registro-invitado/route.ts). Sin esto, cae al destino
  // histórico (/panel/conexiones) — las invitaciones de equipo de la V3 lo
  // setean a /v3/{clienteId}.
  redirect?: string;
  // Acceso que recibe el miembro al aceptar (solo invitaciones de equipo).
  nivel?: "operador" | "solo_lectura";
  dashboards?: number[];
  agregado_por?: number;
};

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET no está configurado");
  return new TextEncoder().encode(secret);
}

export async function signInviteToken(
  clienteId: string,
  clienteNombre: string,
  redirect?: string,
  acceso?: Pick<InvitePayload, "nivel" | "dashboards" | "agregado_por">
): Promise<string> {
  return new SignJWT({ purpose: "client_invite", cliente_id: clienteId, cliente_nombre: clienteNombre, redirect, ...acceso })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifyInviteToken(token: string): Promise<InvitePayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.purpose !== "client_invite" || typeof payload.cliente_id !== "string") return null;
    return payload as unknown as InvitePayload;
  } catch {
    return null;
  }
}
