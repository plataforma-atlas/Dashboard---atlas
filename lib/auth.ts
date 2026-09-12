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

/**
 * Sesiones firmadas antes del fix del 2026-09-11 pueden traer `clientes` como
 * un string plano (bug del template del JWT) en vez de array. Normaliza ambos casos
 * para no depender de que todos hayan vuelto a iniciar sesión.
 */
export function clientesDeSesion(session: SessionPayload): string[] {
  const raw = session.clientes as unknown;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string" && raw) return raw.split(",");
  return [];
}

export { COOKIE_NAME };
