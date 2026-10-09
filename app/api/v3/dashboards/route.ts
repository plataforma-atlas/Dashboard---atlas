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

// Cuatro usos, mutuamente excluyentes según lo que traiga el body: guardar la
// URL real de destino de un enlace corto (tipo "clase"/"replay") con `tipo`
// + `url`, archivar/desarchivar con `archivado` (boolean), reemplazar las
// preguntas de la encuesta con `preguntas_encuesta` (array completo — se
// reemplaza entero, no se mergea de a una), o desvincular una encuesta de GHL
// con `ghl_survey_id: null` (volver a modo manual — para vincular una encuesta
// se usa /api/v3/ghl-encuestas, no este endpoint).
export async function PATCH(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const clienteId = (body?.cliente_id ?? "").toString().trim();
  const dashboardId = Number(body?.dashboard_id) || 0;
  const tipo = (body?.tipo ?? "").toString().trim();
  const url = (body?.url ?? "").toString().trim();
  const archivado = typeof body?.archivado === "boolean" ? body.archivado : null;
  const preguntasEncuesta = Array.isArray(body?.preguntas_encuesta) ? body.preguntas_encuesta : null;
  const desvincularGhl = Object.prototype.hasOwnProperty.call(body ?? {}, "ghl_survey_id") && body.ghl_survey_id === null;

  if (!clienteId || !dashboardId) return NextResponse.json({ error: "Falta cliente_id o dashboard_id" }, { status: 400 });
  const guardia = await exigirAcceso(session, clienteId, { escribir: true, dashboardId: dashboardId });
  if ("error" in guardia) return guardia.error;
  if (archivado === null && preguntasEncuesta === null && !desvincularGhl && (!tipo || !url)) {
    return NextResponse.json({ error: "Falta tipo o url" }, { status: 400 });
  }

  const urlBase = process.env.N8N_V3_DASHBOARDS_URL;
  if (!urlBase) return NextResponse.json({ error: "N8N_V3_DASHBOARDS_URL no está configurada" }, { status: 500 });

  try {
    const payload = desvincularGhl
      ? { dashboard_id: dashboardId, cliente_id: clienteId, ghl_survey_id: null }
      : preguntasEncuesta !== null
        ? { dashboard_id: dashboardId, cliente_id: clienteId, preguntas_encuesta: preguntasEncuesta }
        : archivado !== null
          ? { dashboard_id: dashboardId, cliente_id: clienteId, archivado }
          : { dashboard_id: dashboardId, cliente_id: clienteId, tipo, url };
    const res = await fetch(urlBase, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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

// Borrado real — el workflow lo rechaza con 409 si el dashboard todavía
// tiene leads (ahí corresponde archivar, no borrar).
export async function DELETE(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dashboardId = Number(searchParams.get("dashboard_id")) || 0;
  const clienteId = (searchParams.get("cliente_id") ?? "").trim();
  if (!dashboardId || !clienteId) return NextResponse.json({ error: "Falta dashboard_id o cliente_id" }, { status: 400 });

  const guardia = await exigirAcceso(session, clienteId, { escribir: true, dashboardId });
  if ("error" in guardia) return guardia.error;

  const urlBase = process.env.N8N_V3_DASHBOARDS_URL;
  if (!urlBase) return NextResponse.json({ error: "N8N_V3_DASHBOARDS_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(urlBase);
    target.searchParams.set("dashboard_id", String(dashboardId));
    target.searchParams.set("cliente_id", clienteId);
    const res = await fetch(target.toString(), { method: "DELETE", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data?.error || "No se pudo borrar el dashboard" }, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error borrando dashboard de V3:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
