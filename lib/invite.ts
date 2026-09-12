import { SignJWT, jwtVerify } from "jose";

export type InvitePayload = {
  purpose: "client_invite";
  cliente_id: string;
  cliente_nombre: string;
};

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET no está configurado");
  return new TextEncoder().encode(secret);
}

export async function signInviteToken(clienteId: string, clienteNombre: string): Promise<string> {
  return new SignJWT({ purpose: "client_invite", cliente_id: clienteId, cliente_nombre: clienteNombre })
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
