import { NextResponse } from "next/server";
import { verifyInviteToken } from "@/lib/invite";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const payload = await verifyInviteToken(token);
  if (!payload) return NextResponse.json({ error: "Esta invitación no es válida o ya expiró" }, { status: 400 });
  return NextResponse.json({ cliente_id: payload.cliente_id, cliente_nombre: payload.cliente_nombre });
}
