"use client";

import { useEffect, useState } from "react";
import { Check, Save } from "lucide-react";
import { V3VTurbPlayerRef } from "@/lib/v3/types";

type Player = { id: string; name: string; pitch_time: number; duration: number };
type UtmParam = { param: string; count: number };

export default function VTurbConfig({
  clienteId,
  dashboardId,
  vturbPlayerIds,
  vturbUtmParam,
  puedeEscribir,
  onGuardado,
}: {
  clienteId: string;
  dashboardId: number;
  vturbPlayerIds: V3VTurbPlayerRef[];
  vturbUtmParam: string | null;
  puedeEscribir: boolean;
  onGuardado: (vturbPlayerIds: V3VTurbPlayerRef[], vturbUtmParam: string | null) => void;
}) {
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [cargandoPlayers, setCargandoPlayers] = useState(true);
  const [errorConexion, setErrorConexion] = useState<string | null>(null);

  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set(vturbPlayerIds.map((p) => p.player_id)));
  const [utmParam, setUtmParam] = useState(vturbUtmParam ?? "");
  const [utmsVistos, setUtmsVistos] = useState<UtmParam[]>([]);
  const [cargandoUtms, setCargandoUtms] = useState(false);

  const [guardando, setGuardando] = useState(false);
  const [guardadoOk, setGuardadoOk] = useState(false);
  const [guardarError, setGuardarError] = useState<string | null>(null);

  useEffect(() => {
    if (!clienteId) return;
    setCargandoPlayers(true);
    setErrorConexion(null);
    fetch(`/api/v3/vturb/players?cliente_id=${encodeURIComponent(clienteId)}`, { cache: "no-store" })
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => {
        if (!ok) {
          setErrorConexion(body.error || "No se pudo consultar VTurb");
          setPlayers([]);
          return;
        }
        setPlayers(Array.isArray(body.players) ? body.players : []);
      })
      .catch(() => {
        setErrorConexion("No se pudo conectar al servidor");
        setPlayers([]);
      })
      .finally(() => setCargandoPlayers(false));
  }, [clienteId]);

  // Qué parámetros UTM le están llegando de verdad al primer reproductor
  // elegido — para que la persona elija uno real en vez de adivinarlo.
  useEffect(() => {
    const primerPlayer = [...seleccionados][0];
    if (!clienteId || !primerPlayer) {
      setUtmsVistos([]);
      return;
    }
    setCargandoUtms(true);
    fetch(`/api/v3/vturb/utms?cliente_id=${encodeURIComponent(clienteId)}&player_id=${encodeURIComponent(primerPlayer)}`, { cache: "no-store" })
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => setUtmsVistos(ok && Array.isArray(body.params) ? body.params : []))
      .catch(() => setUtmsVistos([]))
      .finally(() => setCargandoUtms(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId, [...seleccionados][0]]);

  function toggle(playerId: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  }

  async function guardar() {
    setGuardando(true);
    setGuardarError(null);
    try {
      const lista: V3VTurbPlayerRef[] = (players ?? [])
        .filter((p) => seleccionados.has(p.id))
        .map((p) => ({ player_id: p.id, nombre: p.name }));
      const res = await fetch("/api/v3/dashboards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: clienteId,
          dashboard_id: dashboardId,
          vturb_player_ids: lista,
          vturb_utm_param: utmParam.trim() || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGuardarError(body.error || "No se pudo guardar");
        return;
      }
      onGuardado(lista, utmParam.trim() || null);
      setGuardadoOk(true);
      setTimeout(() => setGuardadoOk(false), 2000);
    } catch {
      setGuardarError("No se pudo conectar al servidor");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="rounded-lg border border-outline bg-surface p-4 flex flex-col gap-3">
      <div>
        <div className="text-[14px] font-medium text-on-surface">VTurb — métricas de video</div>
        <div className="text-[12px] text-on-surface-variant">
          Elegí qué reproductores (VSL) de VTurb pertenecen a este dashboard y qué parámetro UTM identifica al anuncio en la
          URL de destino, para cruzar sus métricas con Administrador de Anuncios.
        </div>
      </div>

      {cargandoPlayers ? (
        <p className="text-[13px] text-on-surface-faint">Cargando reproductores…</p>
      ) : errorConexion ? (
        <p className="text-[13px] text-on-surface-variant">
          {errorConexion} — conectá tu cuenta de VTurb en{" "}
          <a href={`/v3/${clienteId}/conexiones`} className="text-primary hover:underline">
            Conexiones
          </a>
          .
        </p>
      ) : (players ?? []).length === 0 ? (
        <p className="text-[13px] text-on-surface-faint">Tu cuenta de VTurb todavía no tiene ningún reproductor.</p>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Reproductores</label>
            {(players ?? []).map((p) => (
              <label key={p.id} className="flex items-center gap-2.5 text-[14px] text-on-surface cursor-pointer">
                <input
                  type="checkbox"
                  checked={seleccionados.has(p.id)}
                  onChange={() => toggle(p.id)}
                  disabled={!puedeEscribir}
                  className="accent-primary w-4 h-4"
                />
                {p.name}
              </label>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Parámetro UTM del anuncio</label>
            {cargandoUtms && <p className="text-[12px] text-on-surface-faint">Consultando qué parámetros le llegan…</p>}
            {!cargandoUtms && utmsVistos.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {utmsVistos.map((u) => (
                  <button
                    key={u.param}
                    type="button"
                    onClick={() => setUtmParam(u.param)}
                    disabled={!puedeEscribir}
                    className={`press text-[12px] px-2.5 py-1 rounded-full border font-mono transition-colors duration-150 ${
                      utmParam === u.param
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-outline text-on-surface-variant hover:border-primary hover:text-on-surface"
                    }`}
                  >
                    {u.param} ({u.count})
                  </button>
                ))}
              </div>
            )}
            <input
              type="text"
              value={utmParam}
              onChange={(e) => setUtmParam(e.target.value)}
              disabled={!puedeEscribir}
              placeholder="Ej. utm_content"
              className="bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface font-mono focus:border-primary outline-none transition-colors duration-150 disabled:opacity-60"
            />
          </div>

          {guardarError && <p className="text-sm text-error">{guardarError}</p>}

          {puedeEscribir && (
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="press self-start flex items-center gap-1.5 text-[13px] px-3 py-2 rounded-md border border-outline hover:border-primary text-on-surface font-medium transition-colors duration-150 disabled:opacity-50"
            >
              {guardadoOk ? (
                <>
                  <Check size={14} /> Guardado
                </>
              ) : (
                <>
                  <Save size={14} /> {guardando ? "Guardando…" : "Guardar"}
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
