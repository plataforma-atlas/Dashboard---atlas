import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "@/lib/auth";
import { exigirAcceso } from "@/lib/permisos";
import { sanitizarConfig } from "@/lib/v3/analisis-anuncios";

// Grupos guardados de Análisis de Anuncios, por cliente. Se guardan en n8n
// (tabla v3_grupos_anuncios). Leer lo puede hacer cualquier miembro; crear,
// editar y borrar requiere permiso de escritura.

function urlN8n(): string | null {
  return process.env.N8N_V3_GRUPOS_ANUNCIOS_URL || null;
}

async function sesionValida() {
  const token = cookies().get(COOKIE_NAME)?.value;
  return token ? await verifySession(token) : null;
}

export async function GET(req: Request) {
  const session = await sesionValida();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const clienteId = new URL(req.url).searchParams.get("cliente_id") ?? "";
  const guardia = await exigirAcceso(session, clienteId, {});
  if ("error" in guardia) return guardia.error;

  const url = urlN8n();
  if (!url) return NextResponse.json({ error: "N8N_V3_GRUPOS_ANUNCIOS_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(url);
    target.searchParams.set("cliente_id", clienteId);
    const res = await fetch(target.toString(), { method: "GET", cache: "no-store" });
    const data = await res.json().catch(() => []);
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Error listando grupos de anuncios:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const session = await sesionValida();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const clienteId = String(body?.cliente_id ?? "").trim();
  const nombre = String(body?.nombre ?? "").trim().slice(0, 60);
  if (!clienteId) return NextResponse.json({ error: "Falta cliente_id" }, { status: 400 });
  if (!nombre) return NextResponse.json({ error: "Falta el nombre del grupo" }, { status: 400 });

  const guardia = await exigirAcceso(session, clienteId, { escribir: true });
  if ("error" in guardia) return guardia.error;

  const url = urlN8n();
  if (!url) return NextResponse.json({ error: "N8N_V3_GRUPOS_ANUNCIOS_URL no está configurada" }, { status: 500 });

  return reenviar(url, "POST", { cliente_id: clienteId, nombre, config: sanitizarConfig(body?.config) });
}

export async function PUT(req: Request) {
  const session = await sesionValida();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = Number(body?.id) || 0;
  const clienteId = String(body?.cliente_id ?? "").trim();
  const nombre = String(body?.nombre ?? "").trim().slice(0, 60);
  if (!id || !clienteId) return NextResponse.json({ error: "Falta id o cliente_id" }, { status: 400 });
  if (!nombre) return NextResponse.json({ error: "Falta el nombre del grupo" }, { status: 400 });

  const guardia = await exigirAcceso(session, clienteId, { escribir: true });
  if ("error" in guardia) return guardia.error;

  const url = urlN8n();
  if (!url) return NextResponse.json({ error: "N8N_V3_GRUPOS_ANUNCIOS_URL no está configurada" }, { status: 500 });

  return reenviar(url, "PUT", { id, cliente_id: clienteId, nombre, config: sanitizarConfig(body?.config) });
}

export async function DELETE(req: Request) {
  const session = await sesionValida();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id")) || 0;
  const clienteId = (searchParams.get("cliente_id") ?? "").trim();
  if (!id || !clienteId) return NextResponse.json({ error: "Falta id o cliente_id" }, { status: 400 });

  const guardia = await exigirAcceso(session, clienteId, { escribir: true });
  if ("error" in guardia) return guardia.error;

  const url = urlN8n();
  if (!url) return NextResponse.json({ error: "N8N_V3_GRUPOS_ANUNCIOS_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(url);
    target.searchParams.set("id", String(id));
    target.searchParams.set("cliente_id", clienteId);
    const res = await fetch(target.toString(), { method: "DELETE", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data?.error || "No se pudo eliminar el grupo" }, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error eliminando grupo de anuncios:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}

async function reenviar(url: string, metodo: "POST" | "PUT", payload: unknown) {
  try {
    const res = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data?.error || "No se pudo guardar el grupo" }, { status: res.status });
    return NextResponse.json(Array.isArray(data) ? data[0] : data);
  } catch (err) {
    console.error("Error guardando grupo de anuncios:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
