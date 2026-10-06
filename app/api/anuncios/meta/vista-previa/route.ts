import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "@/lib/auth";
import { exigirAcceso } from "@/lib/permisos";

// Vista previa de un anuncio de Meta. La pide n8n con el token del cliente, así que
// quien la ve no necesita una cuenta de Meta.
export async function GET(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clienteId = (searchParams.get("cliente_id") ?? "").trim();
  const adId = (searchParams.get("ad_id") ?? "").trim();

  const guardia = await exigirAcceso(session, clienteId, {});
  if ("error" in guardia) return guardia.error;
  if (!/^\d+$/.test(adId)) return NextResponse.json({ error: "ID de anuncio inválido" }, { status: 400 });

  const url = process.env.N8N_META_ADS_VISTA_PREVIA_URL;
  if (!url) return NextResponse.json({ error: "N8N_META_ADS_VISTA_PREVIA_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(url);
    target.searchParams.set("cliente_id", clienteId);
    target.searchParams.set("ad_id", adId);
    const res = await fetch(target.toString(), { method: "GET", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    const html = data?.data?.[0]?.body;
    if (!res.ok || typeof html !== "string") {
      return NextResponse.json(
        { error: data?.error?.message || "No se pudo cargar la vista previa del anuncio" },
        { status: res.ok ? 502 : res.status }
      );
    }
    return NextResponse.json({ html });
  } catch (err) {
    console.error("Error pidiendo vista previa de anuncio:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
