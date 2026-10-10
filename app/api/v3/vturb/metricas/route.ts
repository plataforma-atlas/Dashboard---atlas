import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "@/lib/auth";
import { exigirAcceso } from "@/lib/permisos";
import { V3VTurbMetricaFila } from "@/lib/v3/types";

type FilaVTurbCruda = {
  grouped_field: string;
  total_viewed_device_uniq: number;
  total_started_device_uniq: number;
  total_clicked_device_uniq: number;
  total_over_pitch: number;
  total_under_pitch: number;
  retention_reached_60: number;
  retention_total: number;
};

// Trae las métricas de VTurb de un dashboard, cruzando uno o más
// reproductores por el mismo parámetro UTM, y las devuelve ya sumadas por
// valor (anuncio) — lib/v3/columnas-tabla.ts las cruza después con cada fila
// de Administrador de Anuncios/Análisis por nombre o id de anuncio.
export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const clienteId = (body?.cliente_id ?? "").toString().trim();
  const playerIds: string[] = Array.isArray(body?.player_ids)
    ? body.player_ids.map((p: unknown) => (p ?? "").toString().trim()).filter(Boolean)
    : [];
  const queryKey = (body?.query_key ?? "").toString().trim();
  const startDate = (body?.start_date ?? "").toString().trim();
  const endDate = (body?.end_date ?? "").toString().trim();

  const guardia = await exigirAcceso(session, clienteId, {});
  if ("error" in guardia) return guardia.error;
  if (playerIds.length === 0 || !queryKey || !startDate || !endDate) {
    return NextResponse.json({ error: "Faltan player_ids, query_key, start_date o end_date" }, { status: 400 });
  }

  const url = process.env.N8N_VTURB_METRICAS_URL;
  if (!url) return NextResponse.json({ error: "N8N_VTURB_METRICAS_URL no está configurada" }, { status: 500 });

  try {
    const porPlayer = await Promise.all(
      playerIds.map(async (playerId) => {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cliente_id: clienteId, player_id: playerId, query_key: queryKey, start_date: startDate, end_date: endDate }),
          cache: "no-store",
        });
        if (!res.ok) return [] as FilaVTurbCruda[];
        const data = await res.json().catch(() => ({}));
        return Array.isArray(data?.rows) ? (data.rows as FilaVTurbCruda[]) : [];
      })
    );

    // Suma los conteos crudos por valor de UTM entre todos los reproductores
    // antes de calcular ninguna tasa — promediar porcentajes ya calculados
    // entre reproductores con volúmenes distintos daría un número sesgado.
    const sumas = new Map<string, FilaVTurbCruda>();
    for (const filas of porPlayer) {
      for (const f of filas) {
        if (!f.grouped_field) continue;
        const actual = sumas.get(f.grouped_field) ?? {
          grouped_field: f.grouped_field,
          total_viewed_device_uniq: 0,
          total_started_device_uniq: 0,
          total_clicked_device_uniq: 0,
          total_over_pitch: 0,
          total_under_pitch: 0,
          retention_reached_60: 0,
          retention_total: 0,
        };
        actual.total_viewed_device_uniq += f.total_viewed_device_uniq || 0;
        actual.total_started_device_uniq += f.total_started_device_uniq || 0;
        actual.total_clicked_device_uniq += f.total_clicked_device_uniq || 0;
        actual.total_over_pitch += f.total_over_pitch || 0;
        actual.total_under_pitch += f.total_under_pitch || 0;
        actual.retention_reached_60 += f.retention_reached_60 || 0;
        actual.retention_total += f.retention_total || 0;
        sumas.set(f.grouped_field, actual);
      }
    }

    const rows: V3VTurbMetricaFila[] = [...sumas.values()].map((f) => {
      const pitchTotal = f.total_over_pitch + f.total_under_pitch;
      return {
        grouped_field: f.grouped_field,
        clics_boton: f.total_clicked_device_uniq,
        play_rate: f.total_viewed_device_uniq > 0 ? (f.total_started_device_uniq / f.total_viewed_device_uniq) * 100 : null,
        audiencia_pitch: pitchTotal > 0 ? (f.total_over_pitch / pitchTotal) * 100 : null,
        primer_minuto: f.retention_total > 0 ? (f.retention_reached_60 / f.retention_total) * 100 : null,
      };
    });

    return NextResponse.json({ rows });
  } catch (err) {
    console.error("Error consultando métricas de VTurb:", err);
    return NextResponse.json({ error: "No se pudo conectar al servidor" }, { status: 502 });
  }
}
