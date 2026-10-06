import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, clientesDeSesion } from "@/lib/auth";
import { exigirAcceso } from "@/lib/permisos";

export async function GET(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cliente_id = searchParams.get("cliente_id") ?? "";
  const nomenclatura = searchParams.get("nomenclatura") ?? "";

  const guardia = await exigirAcceso(session, cliente_id, {});
  if ("error" in guardia) return guardia.error;

  if (guardia.acceso.dashboards !== null) {
    const urlDash = process.env.N8N_V3_DASHBOARDS_URL;
    if (!nomenclatura || !urlDash) return NextResponse.json({ error: "Elegí un dashboard para ver sus anuncios" }, { status: 400 });
    const dashTarget = new URL(urlDash);
    dashTarget.searchParams.set("cliente_id", cliente_id);
    const listaDash = (await fetch(dashTarget.toString(), { cache: "no-store" }).then((r) => r.json()).catch(() => [])) as {
      id: number;
      nomenclatura_filtro: string | null;
    }[];
    const dash = (Array.isArray(listaDash) ? listaDash : []).find((d) => d.nomenclatura_filtro === nomenclatura);
    if (!dash || !guardia.acceso.dashboards.includes(Number(dash.id))) {
      return NextResponse.json({ error: "No tienes acceso a este dashboard" }, { status: 403 });
    }
  }

  const url = process.env.N8N_META_ADS_PULL_URL;
  if (!url) return NextResponse.json({ error: "N8N_META_ADS_PULL_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(url);
    target.searchParams.set("cliente_id", cliente_id);
    if (nomenclatura) target.searchParams.set("nomenclatura", nomenclatura);
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
