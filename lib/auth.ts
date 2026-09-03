import { jwtVerify } from "jose";

export type SessionPayload = {
  user_id: number;
  role: "admin" | "client" | "checkin";
  clientes: string[];
};

const COOKIE_NAME = "atlas_session";

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET no está configurado");
  return new TextEncoder().encode(secret);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
