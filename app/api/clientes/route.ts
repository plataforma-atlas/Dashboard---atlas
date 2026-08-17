import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "@/lib/auth";

export async function GET(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const estado = searchParams.get("estado") ?? "";
  // Solo un admin puede pedir clientes archivados (para reactivarlos); un
  // cliente normal siempre ve el filtro por defecto (activos).
  if (estado === "all" || estado === "archived") {
    if (session.role !== "admin") return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  }

  const url = process.env.N8N_CLIENTES_URL;
  if (!url) return NextResponse.json({ error: "N8N_CLIENTES_URL no está configurada" }, { status: 500 });

  try {
    const target = new URL(url);
    if (estado) target.searchParams.set("estado", estado);
    const res = await fetch(target.toString(), { method: "GET", cache: "no-store" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json({ error: body.error || "No se pudo listar clientes" }, { status: res.status });
    }
    const data: { id: string; name: string; status: string }[] = await res.json();
    const visibles = session.role === "admin" ? data : data.filter((c) => session.clientes.includes(c.id));
    return NextResponse.json({ clientes: visibles });
  } catch (err) {
    console.error("Error listando clientes:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
