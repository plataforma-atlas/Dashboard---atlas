import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { COOKIE_NAME, verifySession } from "@/lib/auth";
import { esTipoAcceso, vencimientoParaTipo } from "@/lib/acceso";
import { sendTemporaryPasswordEmail } from "@/lib/email";

const ROLES = ["client", "admin", "checkin"] as const;

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

// Alta manual: un usuario y su cliente se crean juntos y comparten el mismo
// nombre. El cliente elige su estrategia después, al crear su dashboard.
export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Solo un administrador puede crear usuarios" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const email = (body?.email ?? "").toString().trim().toLowerCase();
  const nombre = (body?.nombre ?? "").toString().trim();
  const rol = (body?.rol ?? "client").toString();
  const tipo = (body?.tipo_acceso ?? "vitalicio").toString();

  if (!email || !nombre) return NextResponse.json({ error: "Faltan correo o nombre" }, { status: 400 });
  if (!(ROLES as readonly string[]).includes(rol)) return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  if (!esTipoAcceso(tipo)) return NextResponse.json({ error: "Tipo de acceso inválido" }, { status: 400 });

  const urls = {
    registro: process.env.N8N_REGISTRO_URL,
    crearCliente: process.env.N8N_CREAR_CLIENTE_URL,
    asignar: process.env.N8N_ADMIN_CLIENTE_USUARIO_URL,
    rol: process.env.N8N_ADMIN_CAMBIAR_ROL_URL,
    cuenta: process.env.N8N_ADMIN_CUENTA_ESTADO_URL,
  };
  for (const [clave, valor] of Object.entries(urls)) {
    if (!valor) return NextResponse.json({ error: `Falta configurar la URL de ${clave}` }, { status: 500 });
  }

  // 12 caracteres legibles; el usuario la cambia al entrar (se le sugiere, no es obligatorio).
  const password = randomBytes(9).toString("base64url").slice(0, 12);

  try {
    const registro = await postJson(urls.registro!, { email, password, name: nombre });
    if (!registro.ok) {
      return NextResponse.json(
        { error: (registro.data as { error?: string } | null)?.error || "No se pudo crear el usuario" },
        { status: registro.status === 409 ? 409 : 500 }
      );
    }
    const userId = (registro.data as { id?: number } | null)?.id;
    if (!userId) return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 });

    const cliente = await postJson(urls.crearCliente!, { name: nombre, strategies: [] });
    const clienteId = (cliente.data as { id?: string } | null)?.id;
    if (!cliente.ok || !clienteId) {
      return NextResponse.json({ error: "El usuario se creó pero no su cliente. Revisalo en la lista de usuarios." }, { status: 500 });
    }

    const asignado = await postJson(urls.asignar!, { user_id: userId, cliente_id: clienteId, accion: "asignar" });
    if (!asignado.ok) return NextResponse.json({ error: "El cliente se creó pero no se pudo vincular al usuario" }, { status: 500 });

    if (rol !== "client") {
      const rolCambiado = await postJson(urls.rol!, { user_id: userId, role: rol });
      if (!rolCambiado.ok) return NextResponse.json({ error: "El usuario se creó pero no se pudo asignar el rol" }, { status: 500 });
    }

    const cuenta = await postJson(urls.cuenta!, {
      user_id: userId,
      estado_cuenta: "activa",
      tipo_acceso: tipo,
      acceso_vence_at: vencimientoParaTipo(tipo),
    });
    if (!cuenta.ok) return NextResponse.json({ error: "El usuario se creó pero no se pudo asignar el tipo de acceso" }, { status: 500 });

    const loginUrl = `${new URL(req.url).origin}/login`;
    let emailEnviado = true;
    try {
      await sendTemporaryPasswordEmail({ to: email, name: nombre, password, loginUrl });
    } catch (err) {
      emailEnviado = false;
      console.error("Error enviando contraseña temporal:", err);
    }

    return NextResponse.json({ ok: true, user_id: userId, cliente_id: clienteId, email_enviado: emailEnviado });
  } catch (err) {
    console.error("Error creando usuario nuevo:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
