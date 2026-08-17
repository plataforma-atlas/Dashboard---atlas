import { NextResponse } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: "Email y contraseña son obligatorios" }, { status: 400 });
  }

  const loginUrl = process.env.N8N_LOGIN_URL;
  if (!loginUrl) return NextResponse.json({ error: "N8N_LOGIN_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password }),
      cache: "no-store",
    });

    if (!res.ok) return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });

    const data = await res.json();
    const token = data?.token as string | undefined;
    if (!token) return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });

    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json(
        { error: "El token recibido no es válido. Revisa que JWT_SECRET coincida con n8n." },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ ok: true, role: session.role });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (err) {
    console.error("Error en login:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor de autenticación" }, { status: 502 });
  }
}
