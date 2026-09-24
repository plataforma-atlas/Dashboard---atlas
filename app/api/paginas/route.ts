import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, clientesDeSesion } from "@/lib/auth";

export async function GET(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cliente_id = searchParams.get("cliente_id") ?? "";

  if (session.role !== "admin" && !clientesDeSesion(session).includes(cliente_id)) {
    return NextResponse.json({ error: "Sin acceso a este cliente" }, { status: 403 });
  }

  const base = process.env.N8N_PAGINAS_URL;
  if (!base) return NextResponse.json({ error: "N8N_PAGINAS_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(`${base}/listar`);
    target.searchParams.set("cliente_id", cliente_id);
    const res = await fetch(target.toString(), { method: "GET", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ error: data.error || "No se pudieron listar las páginas" }, { status: res.status });
    }
    // El nodo "Responder Listar OK" de n8n usa "allIncomingItems" — con 0 filas
    // devuelve "{}" (objeto vacío) en vez de "[]", no un array vacío.
    return NextResponse.json({ paginas: Array.isArray(data) ? data : [] });
  } catch (err) {
    console.error("Error listando páginas:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const cliente_id = (body?.cliente_id ?? "").toString();

  if (session.role !== "admin" && !clientesDeSesion(session).includes(cliente_id)) {
    return NextResponse.json({ error: "Sin acceso a este cliente" }, { status: 403 });
  }

  const base = process.env.N8N_PAGINAS_URL;
  if (!base) return NextResponse.json({ error: "N8N_PAGINAS_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(`${base}/guardar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ error: data.error || "No se pudo guardar la página" }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error guardando página:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
