import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "@/lib/auth";
import { exigirAcceso } from "@/lib/permisos";

// Qué puede hacer la persona en este cliente. La pantalla lo usa para ocultar
// lo que no le corresponde; el servidor sigue validando cada acción igual.
export async function GET(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const clienteId = new URL(req.url).searchParams.get("cliente_id") ?? "";
  if (!clienteId) return NextResponse.json({ error: "Falta cliente_id" }, { status: 400 });

  const guardia = await exigirAcceso(session, clienteId, {});
  if ("error" in guardia) return guardia.error;
  return NextResponse.json(guardia.acceso);
}
