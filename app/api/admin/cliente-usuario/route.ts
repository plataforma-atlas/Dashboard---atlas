import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "@/lib/auth";

export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Solo un administrador puede hacer esto" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body?.user_id || !body?.cliente_id || !body?.accion) {
    return NextResponse.json({ error: "Faltan user_id, cliente_id o accion" }, { status: 400 });
  }

  const url = process.env.N8N_ADMIN_CLIENTE_USUARIO_URL;
  if (!url) return NextResponse.json({ error: "N8N_ADMIN_CLIENTE_USUARIO_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: body.user_id, cliente_id: body.cliente_id, accion: body.accion }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data.error || "No se pudo actualizar el acceso" }, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error asignando/quitando cliente:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
