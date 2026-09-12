import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { COOKIE_NAME, verifySession } from "@/lib/auth";
import { signInviteToken } from "@/lib/invite";

export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Solo un administrador puede generar invitaciones" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const clienteId = (body?.cliente_id ?? "").toString().trim();
  const clienteNombre = (body?.cliente_nombre ?? "").toString().trim();
  if (!clienteId) return NextResponse.json({ error: "Falta cliente_id" }, { status: 400 });

  const inviteToken = await signInviteToken(clienteId, clienteNombre);

  const host = headers().get("host");
  const proto = headers().get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : "";

  return NextResponse.json({ url: `${origin}/invitacion/${inviteToken}` });
}
