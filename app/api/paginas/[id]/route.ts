import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, clientesDeSesion } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cliente_id = searchParams.get("cliente_id") ?? "";

  if (session.role !== "admin" && !clientesDeSesion(session).includes(cliente_id)) {
    return NextResponse.json({ error: "Sin acceso a este cliente" }, { status: 403 });
  }

  const base = process.env.N8N_PAGINAS_URL;
  if (!base) return NextResponse.json({ error: "N8N_PAGINAS_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(`${base}/detalle`);
    target.searchParams.set("cliente_id", cliente_id);
    target.searchParams.set("id", params.id);
    const res = await fetch(target.toString(), { method: "GET", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ error: data.error || "No se pudo consultar la página" }, { status: res.status });
    }
    const pagina = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ pagina: pagina ?? null });
  } catch (err) {
    console.error("Error consultando página:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
