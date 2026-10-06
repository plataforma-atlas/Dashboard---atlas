import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, clientesDeSesion } from "@/lib/auth";
import { dashboardsPermitidos } from "@/lib/permisos";
import { exigirAcceso } from "@/lib/permisos";

export async function GET(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cliente_id = searchParams.get("cliente_id") ?? "";

  const guardia = await exigirAcceso(session, cliente_id, {});
  if ("error" in guardia) return guardia.error;

  const url = process.env.N8N_V3_DASHBOARDS_URL;
  if (!url) return NextResponse.json({ error: "N8N_V3_DASHBOARDS_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(url);
    target.searchParams.set("cliente_id", cliente_id);
    const res = await fetch(target.toString(), { method: "GET", cache: "no-store" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json({ error: body.error || "No se pudieron cargar los dashboards" }, { status: res.status });
    }
    const data = await res.json();
    const lista = Array.isArray(data) ? data : [];
    return NextResponse.json({ dashboards: dashboardsPermitidos(guardia.acceso, lista) });
  } catch (err) {
    console.error("Error consultando dashboards de V3:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const clienteId = (body?.cliente_id ?? "").toString().trim();
  const nombre = (body?.nombre ?? "").toString().trim();
  const nomenclaturaFiltro = (body?.nomenclatura_filtro ?? "").toString().trim();
  const tipo = (body?.tipo ?? "lanzamiento").toString().trim();

  if (!clienteId) return NextResponse.json({ error: "Falta cliente_id" }, { status: 400 });
  const guardia = await exigirAcceso(session, clienteId, { escribir: true });
  if ("error" in guardia) return guardia.error;
  if (!nombre) return NextResponse.json({ error: "Falta el nombre del dashboard" }, { status: 400 });
  if (tipo !== "lanzamiento" && tipo !== "webinar") {
    return NextResponse.json({ error: "Tipo de dashboard inválido" }, { status: 400 });
  }

  const url = process.env.N8N_V3_DASHBOARDS_URL;
  if (!url) return NextResponse.json({ error: "N8N_V3_DASHBOARDS_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente_id: clienteId, nombre, nomenclatura_filtro: nomenclaturaFiltro || null, tipo }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data?.error || "No se pudo crear el dashboard" }, { status: res.status });
    return NextResponse.json(Array.isArray(data) ? data[0] : data);
  } catch (err) {
    console.error("Error creando dashboard de V3:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}

// Hoy solo se usa para guardar la URL real de destino de un enlace corto
// (tipo "clase"/"replay", ver lib/v3/embudo.ts) por dashboard — un `tipo` +
// `url` a la vez, mergeados en `url_enlaces` sin pisar los demás.
export async function PATCH(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const clienteId = (body?.cliente_id ?? "").toString().trim();
  const dashboardId = Number(body?.dashboard_id) || 0;
  const tipo = (body?.tipo ?? "").toString().trim();
  const url = (body?.url ?? "").toString().trim();

  if (!clienteId || !dashboardId) return NextResponse.json({ error: "Falta cliente_id o dashboard_id" }, { status: 400 });
  const guardia = await exigirAcceso(session, clienteId, { escribir: true, dashboardId: dashboardId });
  if ("error" in guardia) return guardia.error;
  if (!tipo || !url) return NextResponse.json({ error: "Falta tipo o url" }, { status: 400 });

  const urlBase = process.env.N8N_V3_DASHBOARDS_URL;
  if (!urlBase) return NextResponse.json({ error: "N8N_V3_DASHBOARDS_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(urlBase, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dashboard_id: dashboardId, cliente_id: clienteId, tipo, url }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data?.error || "No se pudo actualizar el dashboard" }, { status: res.status });
    return NextResponse.json(Array.isArray(data) ? data[0] : data);
  } catch (err) {
    console.error("Error actualizando dashboard de V3:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
