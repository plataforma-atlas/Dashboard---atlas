import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, clientesDeSesion } from "@/lib/auth";

// El estado se consulta en cada carga (no se confía solo en el token) para que
// un bloqueo o un pago pendiente se aplique en la próxima navegación, no al
// vencer la cookie. Si la consulta falla, no bloqueamos: mejor dejar entrar
// que tirar a todos afuera por un blip de n8n.
export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });

  let estado: "activa" | "pago_pendiente" | "bloqueada" | null = null;
  let vigente = true;
  const url = process.env.N8N_AUTH_ESTADO_URL;
  if (url) {
    try {
      const target = new URL(url);
      target.searchParams.set("user_id", String(session.user_id));
      const res = await fetch(target.toString(), { cache: "no-store" });
      const data = await res.json().catch(() => []);
      const fila = Array.isArray(data) ? data[0] : null;
      if (fila) {
        estado = fila.estado_cuenta;
        vigente = fila.vigente === true;
      }
    } catch (err) {
      console.error("Error consultando estado de cuenta:", err);
    }
  }

  const bloqueado = estado === "bloqueada" || !vigente;
  const pagoPendiente = !bloqueado && estado === "pago_pendiente";

  return NextResponse.json({
    authenticated: true,
    role: session.role,
    clientes: clientesDeSesion(session),
    user_id: session.user_id,
    estado,
    bloqueado,
    pago_pendiente: pagoPendiente,
  });
}
