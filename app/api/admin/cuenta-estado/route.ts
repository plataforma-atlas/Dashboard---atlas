import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "@/lib/auth";
import { esTipoAcceso, vencimientoParaTipo } from "@/lib/acceso";

export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Solo un administrador puede hacer esto" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const userId = Number(body?.user_id);
  if (!Number.isInteger(userId)) return NextResponse.json({ error: "Falta user_id" }, { status: 400 });

  const estado = body?.estado_cuenta ? String(body.estado_cuenta) : "";
  if (estado && !["activa", "pago_pendiente", "bloqueada"].includes(estado)) {
    return NextResponse.json({ error: "Estado de cuenta inválido" }, { status: 400 });
  }

  const tipo = body?.tipo_acceso ? String(body.tipo_acceso) : "";
  let venceAt = "sin_cambio";
  if (tipo) {
    if (!esTipoAcceso(tipo)) return NextResponse.json({ error: "Tipo de acceso inválido" }, { status: 400 });
    venceAt = vencimientoParaTipo(tipo);
  }

  const url = process.env.N8N_ADMIN_CUENTA_ESTADO_URL;
  if (!url) return NextResponse.json({ error: "N8N_ADMIN_CUENTA_ESTADO_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, estado_cuenta: estado, tipo_acceso: tipo, acceso_vence_at: venceAt }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "No se pudo actualizar la cuenta" }, { status: res.ok ? 404 : res.status });
    }
    return NextResponse.json({ ok: true, cuenta: data[0] });
  } catch (err) {
    console.error("Error actualizando estado de cuenta:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
