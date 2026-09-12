import { NextResponse } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/auth";
import { verifyInviteToken } from "@/lib/invite";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.token || !body?.email || !body?.password || !body?.name) {
    return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
  }

  const invite = await verifyInviteToken(body.token);
  if (!invite) return NextResponse.json({ error: "Esta invitación no es válida o ya expiró" }, { status: 400 });

  const registroUrl = process.env.N8N_REGISTRO_INVITADO_URL;
  const loginUrl = process.env.N8N_LOGIN_URL;
  if (!registroUrl || !loginUrl) {
    return NextResponse.json({ error: "N8N_REGISTRO_INVITADO_URL o N8N_LOGIN_URL no están configuradas" }, { status: 500 });
  }

  try {
    const resRegistro = await fetch(registroUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password, name: body.name, cliente_id: invite.cliente_id }),
      cache: "no-store",
    });
    const dataRegistro = await resRegistro.json().catch(() => ({}));
    if (!resRegistro.ok) {
      return NextResponse.json({ error: dataRegistro?.error || "No se pudo crear la cuenta" }, { status: resRegistro.status });
    }

    const resLogin = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password }),
      cache: "no-store",
    });
    const dataLogin = await resLogin.json().catch(() => ({}));
    const sessionToken = dataLogin?.token as string | undefined;
    if (!resLogin.ok || !sessionToken) {
      // La cuenta sí se creó; el usuario puede iniciar sesión manualmente.
      return NextResponse.json({ ok: true, autoLogin: false });
    }

    const session = await verifySession(sessionToken);
    if (!session) return NextResponse.json({ ok: true, autoLogin: false });

    const response = NextResponse.json({ ok: true, autoLogin: true });
    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (err) {
    console.error("Error en registro invitado:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
