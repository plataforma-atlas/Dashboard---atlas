import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, clientesDeSesion } from "@/lib/auth";

export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const clienteId = (body?.cliente_id ?? "").toString().trim();
  const siteUrl = (body?.site_url ?? "").toString().trim();
  const username = (body?.username ?? "").toString().trim();
  const applicationPassword = (body?.application_password ?? "").toString().trim();

  if (!clienteId) return NextResponse.json({ error: "Falta cliente_id" }, { status: 400 });
  if (session.role !== "admin" && !clientesDeSesion(session).includes(clienteId)) {
    return NextResponse.json({ error: "No tienes acceso a este cliente" }, { status: 403 });
  }
  if (!siteUrl || !username || !applicationPassword) {
    return NextResponse.json({ error: "Completá la URL del sitio, el usuario y la contraseña de aplicación" }, { status: 400 });
  }

  const url = process.env.N8N_WORDPRESS_CONECTAR_URL;
  if (!url) return NextResponse.json({ error: "N8N_WORDPRESS_CONECTAR_URL no está configurada" }, { status: 500 });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente_id: clienteId, site_url: siteUrl, username, application_password: applicationPassword }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data?.error || "No se pudo conectar con WordPress" }, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error conectando WordPress:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
