import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "@/lib/auth";

export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Solo un administrador puede hacer esto" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const id = (body?.id ?? "").toString().trim();
  const estado = body?.estado;
  if (!id || (estado !== "active" && estado !== "archived")) {
    return NextResponse.json({ error: "Faltan datos válidos (id, estado)" }, { status: 400 });
  }

  const url = process.env.N8N_ESTADO_CLIENTE_URL;
  if (!url) return NextResponse.json({ error: "N8N_ESTADO_CLIENTE_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estado }),
      cache: "no-store"
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data.error || "No se pudo cambiar el estado" }, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error cambiando estado del cliente:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
