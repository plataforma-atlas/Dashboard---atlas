import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "@/lib/auth";

const ACCIONES = ["agregar", "quitar", "cambiar_principal"] as const;

// Un usuario puede entrar con más de un correo (por si compró con otro por error).
// Acciones: agregar un correo extra, quitar uno extra, o cambiar el principal.
export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Solo un administrador puede hacer esto" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const userId = Number(body?.user_id);
  const accion = (body?.accion ?? "").toString();
  const email = (body?.email ?? "").toString().trim().toLowerCase();

  if (!Number.isInteger(userId)) return NextResponse.json({ error: "Falta user_id" }, { status: 400 });
  if (!(ACCIONES as readonly string[]).includes(accion)) return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  if (!email || !email.includes("@")) return NextResponse.json({ error: "Correo inválido" }, { status: 400 });

  const url = process.env.N8N_ADMIN_CORREOS_URL;
  if (!url) return NextResponse.json({ error: "N8N_ADMIN_CORREOS_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, accion, email }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return NextResponse.json({ error: (data as { error?: string } | null)?.error || "No se pudo actualizar los correos" }, { status: res.status });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error actualizando correos:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
