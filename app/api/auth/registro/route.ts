import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password || !body?.name) {
    return NextResponse.json({ error: "Nombre, email y contraseña son obligatorios" }, { status: 400 });
  }

  const registroUrl = process.env.N8N_REGISTRO_URL;
  if (!registroUrl) return NextResponse.json({ error: "N8N_REGISTRO_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(registroUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password, name: body.name }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    const created = Array.isArray(data) ? data[0] : data;
    if (!res.ok || !created?.id) {
      return NextResponse.json({ error: "Ese correo ya está registrado, o hubo un error" }, { status: 409 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en registro:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor de autenticación" }, { status: 502 });
  }
}
