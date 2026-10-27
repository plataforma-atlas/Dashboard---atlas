import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, clientesDeSesion } from "@/lib/auth";
import { exigirAcceso } from "@/lib/permisos";
import { rangoDesdeQuery } from "@/lib/meta-ads/rango";

export async function GET(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cliente_id = searchParams.get("cliente_id") ?? "";
  const dashboardId = Number(searchParams.get("dashboard_id")) || 0;
  const rango = rangoDesdeQuery(searchParams.get("fecha_inicio"), searchParams.get("fecha_fin"));

  const guardia = await exigirAcceso(session, cliente_id, {});
  if ("error" in guardia) return guardia.error;

  // Los patrones de nomenclatura nunca los manda el cliente directo — se
  // derivan acá, server-side, de la lista real de dashboards del cliente, así
  // nadie puede pedir una lista de patrones distinta a la que el dashboard
  // tiene guardada (ni aunque sepa el id de un dashboard ajeno: el chequeo de
  // acceso de abajo lo bloquea antes de llegar a usarlos).
  let nomenclaturas: string[] = [];
  if (dashboardId || guardia.acceso.dashboards !== null) {
    const urlDash = process.env.N8N_V3_DASHBOARDS_URL;
    if (!dashboardId || !urlDash) return NextResponse.json({ error: "Elegí un dashboard para ver sus anuncios" }, { status: 400 });
    const dashTarget = new URL(urlDash);
    dashTarget.searchParams.set("cliente_id", cliente_id);
    const listaDash = (await fetch(dashTarget.toString(), { cache: "no-store" }).then((r) => r.json()).catch(() => [])) as {
      id: number;
      nomenclaturas_filtro: string[];
    }[];
    const dash = (Array.isArray(listaDash) ? listaDash : []).find((d) => Number(d.id) === dashboardId);
    if (!dash || (guardia.acceso.dashboards !== null && !guardia.acceso.dashboards.includes(dashboardId))) {
      return NextResponse.json({ error: "No tienes acceso a este dashboard" }, { status: 403 });
    }
    nomenclaturas = Array.isArray(dash.nomenclaturas_filtro) ? dash.nomenclaturas_filtro : [];
  }

  const url = process.env.N8N_META_ADS_PULL_URL;
  if (!url) return NextResponse.json({ error: "N8N_META_ADS_PULL_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(url);
    target.searchParams.set("cliente_id", cliente_id);
    if (nomenclaturas.length > 0) target.searchParams.set("nomenclaturas", JSON.stringify(nomenclaturas));
    target.searchParams.set("time_range", JSON.stringify(rango));
    const res = await fetch(target.toString(), { method: "GET", cache: "no-store" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json({ error: body.error || "No se pudo consultar Meta Ads" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error consultando Meta Ads:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
