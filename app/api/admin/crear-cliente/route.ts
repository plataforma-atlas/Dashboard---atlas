import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "@/lib/auth";

export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Solo un administrador puede crear clientes" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const name = (body?.name ?? "").toString().trim();
  const strategies = Array.isArray(body?.strategies) ? body.strategies : [];
  if (!name) return NextResponse.json({ error: "Falta el nombre del cliente" }, { status: 400 });

  const url = process.env.N8N_CREAR_CLIENTE_URL;
  if (!url) return NextResponse.json({ error: "N8N_CREAR_CLIENTE_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, strategies }),
      cache: "no-store"
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data.error || "No se pudo crear el cliente" }, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error creando cliente:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
