import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "@/lib/auth";
import { exigirAcceso } from "@/lib/permisos";
import { rangoDesdeQuery } from "@/lib/meta-ads/rango";

// Mismas listas de acciones que usa el pull de Meta Ads para contar leads y ventas.
const TIPOS_LEAD = ["lead", "offsite_conversion.fb_pixel_custom", "onsite_conversion.messaging_conversation_started_7d"];
const TIPOS_VENTA = ["purchase", "omni_purchase"];

type FilaDiaria = {
  fecha: string;
  ad_id: string;
  gasto: number;
  impresiones: number;
  clics: number;
  enlace: number;
  leads: number;
  ventas: number;
  ingreso: number;
};

function sumarAcciones(actions: unknown, tipos: string[]): number {
  if (!Array.isArray(actions)) return 0;
  return actions
    .filter((a) => tipos.includes(a?.action_type))
    .reduce((acc, a) => acc + (Number(a?.value) || 0), 0);
}

// Cifras diarias por anuncio (Graph API, time_increment=1), para la visión consolidada.
// Pide a n8n solo los anuncios indicados, de una misma cuenta publicitaria.
export async function GET(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clienteId = (searchParams.get("cliente_id") ?? "").trim();
  const cuenta = (searchParams.get("ad_account_id") ?? "").trim().replace(/^act_/, "");
  const rango = rangoDesdeQuery(searchParams.get("fecha_inicio"), searchParams.get("fecha_fin"));
  const adIds = (searchParams.get("ad_ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const guardia = await exigirAcceso(session, clienteId, {});
  if ("error" in guardia) return guardia.error;
  if (!/^\d+$/.test(cuenta)) return NextResponse.json({ error: "Cuenta publicitaria inválida" }, { status: 400 });
  if (adIds.length === 0 || adIds.length > 200 || !adIds.every((id) => /^\d+$/.test(id))) {
    return NextResponse.json({ error: "Anuncios inválidos" }, { status: 400 });
  }

  const url = process.env.N8N_META_ADS_DIARIO_URL;
  if (!url) return NextResponse.json({ error: "N8N_META_ADS_DIARIO_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(url);
    target.searchParams.set("cliente_id", clienteId);
    target.searchParams.set("ad_account_id", cuenta);
    target.searchParams.set("ad_ids", adIds.join(","));
    target.searchParams.set("time_range", JSON.stringify(rango));
    const res = await fetch(target.toString(), { method: "GET", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !Array.isArray(data?.data)) {
      return NextResponse.json(
        { error: data?.error?.message || "No se pudo cargar la evolución diaria" },
        { status: res.ok ? 502 : res.status }
      );
    }

    const filas: FilaDiaria[] = data.data.map((r: Record<string, unknown>) => {
      const roas = Array.isArray(r.purchase_roas) ? Number((r.purchase_roas as { value?: string }[])[0]?.value) || 0 : 0;
      const gasto = Number(r.spend) || 0;
      return {
        fecha: String(r.date_start ?? ""),
        ad_id: String(r.ad_id ?? ""),
        gasto,
        impresiones: Number(r.impressions) || 0,
        clics: Number(r.clicks) || 0,
        enlace: Number(r.inline_link_clicks) || 0,
        leads: sumarAcciones(r.actions, TIPOS_LEAD),
        ventas: sumarAcciones(r.actions, TIPOS_VENTA),
        ingreso: roas * gasto,
      };
    });
    return NextResponse.json({ filas });
  } catch (err) {
    console.error("Error pidiendo evolución diaria de anuncios:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
