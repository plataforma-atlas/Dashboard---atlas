import { NextResponse } from "next/server";

// Resuelve un enlace corto propio (ver DOCUMENTACION.md, "Acortador de
// enlaces") — pensado para trackear clics en lugares sin webhook/API (ej. un
// mensaje de WhatsApp 1a1 de GHL). Nunca requiere sesión: lo abre el lead
// directo desde su teléfono.

function primeraIpPublica(valor: string | null): string {
  if (!valor) return "";
  const partes = valor.split(",").map((p) => p.trim());
  const publica = partes.find((ip) => ip && ip !== "::1" && !ip.startsWith("127.") && !ip.startsWith("10.") && !ip.startsWith("192.168."));
  return publica || partes[0] || "";
}

async function geolocalizar(ip: string): Promise<{ pais: string; ciudad: string }> {
  if (!ip) return { pais: "", ciudad: "" };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city`, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timeout);
    if (!res.ok) return { pais: "", ciudad: "" };
    const data = await res.json();
    if (data.status !== "success") return { pais: "", ciudad: "" };
    return { pais: data.country || "", ciudad: data.city || "" };
  } catch {
    // La geolocalización es un extra, nunca debe bloquear el redirect.
    return { pais: "", ciudad: "" };
  }
}

function paginaNoEncontrada() {
  return new NextResponse("<!doctype html><html><body><p>Este enlace no es válido.</p></body></html>", {
    status: 404,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(req: Request, { params }: { params: { token: string } }) {
  const token = params.token;
  const base = process.env.N8N_ENLACES_CORTOS_URL;
  if (!token || !base) return paginaNoEncontrada();

  const ip = primeraIpPublica(req.headers.get("x-forwarded-for"));
  const userAgent = req.headers.get("user-agent") || "";

  const { pais, ciudad } = await geolocalizar(ip);

  try {
    const target = new URL(`${base}/resolver-enlace`);
    target.searchParams.set("token", token);
    if (ip) target.searchParams.set("ip", ip);
    if (pais) target.searchParams.set("pais", pais);
    if (ciudad) target.searchParams.set("ciudad", ciudad);
    if (userAgent) target.searchParams.set("user_agent", userAgent);

    const res = await fetch(target.toString(), { cache: "no-store" });
    if (!res.ok) return paginaNoEncontrada();
    const data = await res.json();
    if (!data.destino_url) return paginaNoEncontrada();
    return NextResponse.redirect(data.destino_url, 302);
  } catch (err) {
    console.error("Error resolviendo enlace corto:", err);
    return paginaNoEncontrada();
  }
}
