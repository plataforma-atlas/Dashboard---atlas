import { SignJWT, jwtVerify } from "jose";

export type PasswordResetPayload = {
  purpose: "password_reset";
  email: string;
};

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET no está configurado");
  return new TextEncoder().encode(secret);
}

export async function signPasswordResetToken(email: string): Promise<string> {
  return new SignJWT({ purpose: "password_reset", email: email.toLowerCase() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(getSecretKey());
}

export async function verifyPasswordResetToken(token: string): Promise<PasswordResetPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.purpose !== "password_reset" || typeof payload.email !== "string") return null;
    return payload as unknown as PasswordResetPayload;
  } catch {
    return null;
  }
}
