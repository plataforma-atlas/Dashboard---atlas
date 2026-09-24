import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, clientesDeSesion } from "@/lib/auth";
import { generarHtmlCaptura, generarHtmlEncuesta, generarHtmlGracias, slugsDePagina, type PaginaSpec } from "@/lib/paginas/templates";

// Genera el HTML de las 3 páginas (captura/encuesta/gracias) a partir del
// spec del wizard. No toca WordPress ni Postgres — es un paso puro de
// renderizado, server-side para no exponer N8N_PAGINAS_URL (base del webhook
// público "paginas/evento") en el bundle del cliente.
export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const clienteId = (body?.cliente_id ?? "").toString().trim();
  const paginaId = body?.pagina_id ?? "preview";
  const spec = body?.spec as PaginaSpec | undefined;
  const siteUrl = (body?.site_url ?? "").toString().trim().replace(/\/+$/, "");

  if (!clienteId) return NextResponse.json({ error: "Falta cliente_id" }, { status: 400 });
  if (session.role !== "admin" && !clientesDeSesion(session).includes(clienteId)) {
    return NextResponse.json({ error: "No tienes acceso a este cliente" }, { status: 403 });
  }
  if (!spec || !spec.slug) {
    return NextResponse.json({ error: "Falta el spec de la página o el slug" }, { status: 400 });
  }

  const paginasUrl = process.env.N8N_PAGINAS_URL;
  if (!paginasUrl) return NextResponse.json({ error: "N8N_PAGINAS_URL no está configurada" }, { status: 500 });
  const eventoUrl = `${paginasUrl}/evento`;

  // Las páginas de captura/encuesta se encadenan entre sí con la URL real
  // donde van a vivir en WordPress (permalinks bonitos, "/slug/"). Si el
  // cliente todavía no conectó WordPress usamos rutas relativas — sirven
  // para la vista previa, pero solo van a resolver bien una vez publicadas
  // en el dominio real.
  const sugeridos = slugsDePagina(spec.slug);
  const guardados = spec.copy?.slugsPaginas;
  const slugs = {
    captura: guardados?.captura?.trim() || sugeridos.captura,
    encuesta: guardados?.encuesta?.trim() || sugeridos.encuesta,
    gracias: guardados?.gracias?.trim() || sugeridos.gracias,
  };
  const conEncuesta = spec.copy?.flujo !== "captura_gracias";
  const urlEncuesta = siteUrl ? `${siteUrl}/${slugs.encuesta}/` : `/${slugs.encuesta}/`;
  const urlGracias = siteUrl ? `${siteUrl}/${slugs.gracias}/` : `/${slugs.gracias}/`;

  try {
    const captura = generarHtmlCaptura(spec, {
      eventoUrl,
      clienteId,
      paginaId,
      urlSiguiente: conEncuesta ? urlEncuesta : urlGracias,
    });
    const gracias = generarHtmlGracias(spec);

    return NextResponse.json({
      captura: { slug: slugs.captura, titulo: spec.copy.captura.titulo, html: captura },
      encuesta: conEncuesta
        ? { slug: slugs.encuesta, titulo: spec.copy.encuestaIntro.titulo, html: generarHtmlEncuesta(spec, { eventoUrl, clienteId, paginaId, urlGracias }) }
        : null,
      gracias: { slug: slugs.gracias, titulo: spec.gracias.titulo, html: gracias },
    });
  } catch (err) {
    console.error("Error generando HTML de páginas:", err);
    return NextResponse.json({ error: "No se pudo generar el HTML de las páginas" }, { status: 500 });
  }
}
