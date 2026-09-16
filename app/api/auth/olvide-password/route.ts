import { NextResponse } from "next/server";
import { signPasswordResetToken } from "@/lib/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return NextResponse.json({ error: "Falta el correo" }, { status: 400 });

  try {
    const token = await signPasswordResetToken(email);
    const origin = new URL(req.url).origin;
    const resetUrl = `${origin}/restablecer-password/${token}`;
    await sendPasswordResetEmail({ to: email, resetUrl });
  } catch (err) {
    console.error("Error enviando correo de recuperación:", err);
    // No revelamos si el correo existe o no, ni si el envío falló por ese motivo.
  }

  return NextResponse.json({ ok: true });
}
