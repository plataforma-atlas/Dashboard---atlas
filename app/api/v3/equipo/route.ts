import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { COOKIE_NAME, verifySession } from "@/lib/auth";
import { exigirAcceso } from "@/lib/permisos";
import { signInviteToken } from "@/lib/invite";
import { sendTeamInviteEmail } from "@/lib/email";

async function requireAccesoCliente(clienteId: string, equipo = false) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) } as const;
  const guardia = await exigirAcceso(session, clienteId, { equipo });
  if ("error" in guardia) return { error: guardia.error } as const;
  return { session } as const;
}

export async function GET(req: Request) {
  const clienteId = new URL(req.url).searchParams.get("cliente_id") ?? "";
  if (!clienteId) return NextResponse.json({ error: "Falta cliente_id" }, { status: 400 });

  const check = await requireAccesoCliente(clienteId);
  if ("error" in check) return check.error;

  const url = process.env.N8N_V3_EQUIPO_URL;
  if (!url) return NextResponse.json({ error: "N8N_V3_EQUIPO_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(url);
    target.searchParams.set("cliente_id", clienteId);
    const res = await fetch(target.toString(), { method: "GET", cache: "no-store" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json({ error: body.error || "No se pudo listar el equipo" }, { status: res.status });
    }
    // n8n responde cuerpo vacío (no []) cuando el cliente no tiene miembros.
    const data = await res.json().catch(() => []);
    return NextResponse.json({ miembros: Array.isArray(data) ? data : [] });
  } catch (err) {
    console.error("Error listando equipo:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const clienteId = (body?.cliente_id ?? "").toString().trim();
  const clienteNombre = (body?.cliente_nombre ?? clienteId).toString().trim();
  const email = (body?.email ?? "").toString().trim();
  const nivel = (body?.nivel ?? "solo_lectura").toString();
  const dashboards: unknown[] = Array.isArray(body?.dashboards) ? body.dashboards : [];

  if (!clienteId) return NextResponse.json({ error: "Falta cliente_id" }, { status: 400 });
  if (!email) return NextResponse.json({ error: "Falta el correo de la persona a invitar" }, { status: 400 });
  if (nivel !== "operador" && nivel !== "solo_lectura") {
    return NextResponse.json({ error: "Nivel inválido" }, { status: 400 });
  }
  const idsDashboards = dashboards.map((d) => Number(d));
  if (idsDashboards.some((d) => !Number.isInteger(d) || d <= 0)) {
    return NextResponse.json({ error: "Dashboards inválidos" }, { status: 400 });
  }

  const check = await requireAccesoCliente(clienteId, true);
  if ("error" in check) return check.error;

  // Solo se pueden dar dashboards que realmente pertenecen a este cliente.
  if (idsDashboards.length > 0) {
    const urlDash = process.env.N8N_V3_DASHBOARDS_URL;
    if (!urlDash) return NextResponse.json({ error: "N8N_V3_DASHBOARDS_URL no está configurada" }, { status: 500 });
    const target = new URL(urlDash);
    target.searchParams.set("cliente_id", clienteId);
    const resDash = await fetch(target.toString(), { cache: "no-store" });
    const listaDash = (await resDash.json().catch(() => [])) as { id: number }[];
    const propios = new Set((Array.isArray(listaDash) ? listaDash : []).map((d) => Number(d.id)));
    if (idsDashboards.some((d) => !propios.has(d))) {
      return NextResponse.json({ error: "Alguno de los dashboards no pertenece a este cliente" }, { status: 400 });
    }
  }

  try {
    const inviteToken = await signInviteToken(clienteId, clienteNombre, `/v3/${clienteId}`, {
      nivel: nivel as "operador" | "solo_lectura",
      dashboards: idsDashboards.length > 0 ? idsDashboards : undefined,
      agregado_por: check.session.user_id,
    });

    const host = headers().get("host");
    const proto = headers().get("x-forwarded-proto") ?? "https";
    const origin = host ? `${proto}://${host}` : "";
    const inviteUrl = `${origin}/invitacion/${inviteToken}`;

    await sendTeamInviteEmail({ to: email, inviteUrl, clienteNombre });

    return NextResponse.json({ ok: true, url: inviteUrl });
  } catch (err) {
    console.error("Error invitando al equipo:", err);
    return NextResponse.json({ error: "No se pudo enviar la invitación" }, { status: 502 });
  }
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => ({}));
  const clienteId = (body?.cliente_id ?? "").toString().trim();
  const userId = Number(body?.user_id);

  if (!clienteId) return NextResponse.json({ error: "Falta cliente_id" }, { status: 400 });
  if (!Number.isInteger(userId)) return NextResponse.json({ error: "Falta user_id" }, { status: 400 });

  const check = await requireAccesoCliente(clienteId, true);
  if ("error" in check) return check.error;
  if (check.session.user_id === userId) {
    return NextResponse.json({ error: "No podés quitarte a vos mismo del equipo" }, { status: 400 });
  }

  const url = process.env.N8N_ADMIN_CLIENTE_USUARIO_URL;
  if (!url) return NextResponse.json({ error: "N8N_ADMIN_CLIENTE_USUARIO_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, cliente_id: clienteId, accion: "quitar" }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data.error || "No se pudo quitar el acceso" }, { status: res.status });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error quitando acceso de equipo:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
