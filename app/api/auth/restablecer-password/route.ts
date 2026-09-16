import { NextResponse } from "next/server";
import { verifyPasswordResetToken } from "@/lib/password-reset";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const nuevaPassword = typeof body?.nueva_password === "string" ? body.nueva_password : "";

  if (!token || !nuevaPassword) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  if (nuevaPassword.length < 6) return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });

  const payload = await verifyPasswordResetToken(token);
  if (!payload) return NextResponse.json({ error: "Este enlace no es válido o ya expiró" }, { status: 400 });

  const url = process.env.N8N_ADMIN_RESETEAR_PASSWORD_URL;
  if (!url) return NextResponse.json({ error: "N8N_ADMIN_RESETEAR_PASSWORD_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: payload.email, nueva_password: nuevaPassword }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data.error || "No se pudo actualizar la contraseña" }, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error restableciendo contraseña:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
