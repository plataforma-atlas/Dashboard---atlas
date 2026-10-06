import { NextResponse } from "next/server";
import { SessionPayload, clientesDeSesion } from "@/lib/auth";

export type Nivel = "dueno" | "operador" | "solo_lectura";
export type Acceso = { nivel: Nivel; dashboards: number[] | null };

// El nivel se lee de la base en cada llamada (no del token), así un cambio de
// permiso aplica en la siguiente acción, no al vencer la sesión. Si la consulta
// falla o no hay vínculo, se niega: en permisos preferimos cerrar a abrir.
async function leerAcceso(session: SessionPayload, clienteId: string): Promise<Acceso | null> {
  if (session.role === "admin") return { nivel: "dueno", dashboards: null };
  if (!clientesDeSesion(session).includes(clienteId)) return null;

  const url = process.env.N8N_AUTH_ACCESO_URL;
  if (!url) return null;
  try {
    const target = new URL(url);
    target.searchParams.set("user_id", String(session.user_id));
    target.searchParams.set("cliente_id", clienteId);
    const res = await fetch(target.toString(), { cache: "no-store" });
    const data = await res.json().catch(() => []);
    const fila = Array.isArray(data) ? data[0] : null;
    if (!fila) return null;
    return {
      nivel: fila.nivel as Nivel,
      dashboards: Array.isArray(fila.dashboards_permitidos) ? fila.dashboards_permitidos.map(Number) : null,
    };
  } catch (err) {
    console.error("Error leyendo acceso de cliente:", err);
    return null;
  }
}

export async function exigirAcceso(
  session: SessionPayload,
  clienteId: string,
  opciones: { escribir?: boolean; equipo?: boolean; dashboardId?: number | null } = {}
): Promise<{ acceso: Acceso } | { error: NextResponse }> {
  const acceso = await leerAcceso(session, clienteId);
  if (!acceso) return { error: NextResponse.json({ error: "No tienes acceso a este cliente" }, { status: 403 }) };

  if (opciones.equipo && acceso.nivel !== "dueno") {
    return { error: NextResponse.json({ error: "Solo el dueño del cliente puede gestionar el equipo" }, { status: 403 }) };
  }
  if (opciones.escribir && acceso.nivel === "solo_lectura") {
    return { error: NextResponse.json({ error: "Tu acceso es de solo lectura" }, { status: 403 }) };
  }
  if (opciones.dashboardId != null && acceso.dashboards !== null && !acceso.dashboards.includes(opciones.dashboardId)) {
    return { error: NextResponse.json({ error: "No tienes acceso a este dashboard" }, { status: 403 }) };
  }
  return { acceso };
}

export function dashboardsPermitidos(acceso: Acceso, dashboards: { id: number }[]): { id: number }[] {
  if (acceso.dashboards === null) return dashboards;
  return dashboards.filter((d) => acceso.dashboards!.includes(d.id));
}
