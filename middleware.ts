import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/registro", "/invitacion", "/olvide-password", "/restablecer-password"];

// Interruptor de emergencia: cuando el equipo de check-in no ha podido crear/usar
// cuentas todavía, esto permite que CUALQUIERA entre a /checkin sin sesión.
// Revertir apagando la variable de entorno cuando el equipo ya tenga acceso normal.
const CHECKIN_PUBLICO = process.env.EVENTO_CHECKIN_PUBLICO === "true";

// Archivos estáticos (logo, favicon generado por Next, etc.) — nunca deben
// redirigir a /login. Antes solo se excluían _next y favicon.ico a mano, y
// eso rompió /brand/vermetricas-icon.png (la petición devolvía el HTML de
// login en vez del PNG, porque el middleware la trataba como ruta protegida).
const STATIC_ASSET_RE = /\.(png|jpe?g|svg|gif|webp|ico|avif|css|js|map|woff2?|txt|xml|json)$/i;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic =
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/invitacion") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    STATIC_ASSET_RE.test(pathname) ||
    (CHECKIN_PUBLICO && (pathname.startsWith("/checkin") || pathname.startsWith("/api/evento")));

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  if (!isPublic && !session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublic && session && (pathname === "/login" || pathname === "/registro")) {
    return NextResponse.redirect(new URL(session.role === "checkin" ? "/checkin" : "/", req.url));
  }

  // El rol "checkin" es para staff externo del evento que solo debe poder
  // usar la pantalla de check-in — no ve el resto del dashboard (ni /admin).
  if (
    session?.role === "checkin" &&
    !pathname.startsWith("/checkin") &&
    !pathname.startsWith("/api/evento") &&
    !pathname.startsWith("/api/auth")
  ) {
    return NextResponse.redirect(new URL("/checkin", req.url));
  }

  if (pathname.startsWith("/admin") && session?.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
