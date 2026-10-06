"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import SerieDiariaChart, { TipoGrafico } from "@/components/v3/SerieDiariaChart";
import { FilaTabla } from "@/lib/v3/columnas-tabla";
import { totalesDe } from "@/lib/v3/totales-tabla";
import { FilaDiaria, METRICAS_SERIE, MetricaSerie, serieDiaria } from "@/lib/v3/serie-diaria";
import { formatMoney, formatNumber, formatPercent } from "@/lib/webinar-os/aggregate";

const SIN_DATO = "—";
const MAXIMO_METRICAS = 2;
const MAXIMO_ANUNCIOS = 200;

// Visión consolidada de las filas seleccionadas en el Administrador de Anuncios:
// totales arriba y la evolución diaria de los anuncios seleccionados abajo.
export default function VisionConsolidada({
  clienteId,
  rango,
  filas,
  anuncios,
  onLimpiar,
  onCerrar,
}: {
  clienteId: string;
  rango: { fecha_inicio: string; fecha_fin: string };
  filas: FilaTabla[];
  // Anuncios que representa la selección (una campaña o conjunto trae los suyos).
  anuncios: { ad_id: string; ad_account_id: string }[];
  onLimpiar: () => void;
  onCerrar: () => void;
}) {
  const t = totalesDe(filas);
  const metricas: { label: string; valor: string }[] = [
    { label: "Gasto", valor: formatMoney(t.gasto) },
    { label: "Impresiones", valor: formatNumber(t.impresiones) },
    { label: "Clics", valor: formatNumber(t.clics) },
    { label: "CTR", valor: t.ctr === null ? SIN_DATO : formatPercent(t.ctr) },
    { label: "CPM", valor: t.cpm === null ? SIN_DATO : formatMoney(t.cpm) },
    { label: "Leads (Meta)", valor: formatNumber(t.leads) },
    { label: "Ventas", valor: t.ventas === null ? SIN_DATO : formatNumber(t.ventas) },
    { label: "ROAS", valor: t.roas === null ? SIN_DATO : `${t.roas.toFixed(2)}x` },
    { label: "CPA", valor: t.cpa === null ? SIN_DATO : formatMoney(t.cpa) },
  ];

  const [metricasGrafico, setMetricasGrafico] = useState<MetricaSerie[]>(["gasto", "ventas"]);
  const [tipoGrafico, setTipoGrafico] = useState<TipoGrafico>("barras");
  const [filasDiarias, setFilasDiarias] = useState<FilaDiaria[] | null>(null);
  const [errorDiario, setErrorDiario] = useState<string | null>(null);
  const [cargandoDiario, setCargandoDiario] = useState(false);

  // Los anuncios se piden por cuenta publicitaria, porque Meta consulta una cuenta a la vez.
  const anunciosLimitados = useMemo(() => anuncios.slice(0, MAXIMO_ANUNCIOS), [anuncios]);
  const claveAnuncios = anunciosLimitados.map((a) => a.ad_id).join(",");

  useEffect(() => {
    if (anunciosLimitados.length === 0) {
      setFilasDiarias([]);
      return;
    }
    let cancelled = false;
    setCargandoDiario(true);
    setErrorDiario(null);

    const porCuenta = new Map<string, string[]>();
    for (const a of anunciosLimitados) {
      const cuenta = a.ad_account_id.replace(/^act_/, "");
      porCuenta.set(cuenta, [...(porCuenta.get(cuenta) ?? []), a.ad_id]);
    }

    Promise.all(
      [...porCuenta.entries()].map(([cuenta, ids]) => {
        const qs = new URLSearchParams({ cliente_id: clienteId, ad_account_id: cuenta, ad_ids: ids.join(",") });
        if (rango.fecha_inicio) qs.set("fecha_inicio", rango.fecha_inicio);
        if (rango.fecha_fin) qs.set("fecha_fin", rango.fecha_fin);
        return fetch(`/api/anuncios/meta/diario?${qs.toString()}`, { cache: "no-store" }).then((res) =>
          res.json().then((body) => ({ ok: res.ok, body }))
        );
      })
    )
      .then((respuestas) => {
        if (cancelled) return;
        const fallo = respuestas.find((r) => !r.ok);
        if (fallo) {
          setErrorDiario(fallo.body.error || "No se pudo cargar la evolución diaria");
          setFilasDiarias([]);
          return;
        }
        setFilasDiarias(respuestas.flatMap((r) => r.body.filas as FilaDiaria[]));
      })
      .catch(() => {
        if (!cancelled) {
          setErrorDiario("No se pudo conectar al servidor");
          setFilasDiarias([]);
        }
      })
      .finally(() => {
        if (!cancelled) setCargandoDiario(false);
      });

    return () => {
      cancelled = true;
    };
    // Se vuelve a pedir solo si cambia la lista de anuncios, no en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId, claveAnuncios, rango.fecha_inicio, rango.fecha_fin]);

  const puntos = useMemo(() => (filasDiarias ? serieDiaria(filasDiarias) : []), [filasDiarias]);

  function alternarMetrica(key: MetricaSerie) {
    setMetricasGrafico((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= MAXIMO_METRICAS) return [prev[1], key];
      return [...prev, key];
    });
  }

  return (
    <section className="animate-fade-in-up bg-surface border border-outline rounded-xl p-4 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[15px] font-semibold text-on-surface">Visión consolidada</h2>
          <span className="text-[13px] text-on-surface-variant">
            {filas.length} {filas.length === 1 ? "seleccionado" : "seleccionados"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button type="button" onClick={onLimpiar} className="press text-[12px] text-on-surface-variant hover:text-on-surface">
            Limpiar selección
          </button>
          <button type="button" onClick={onCerrar} aria-label="Cerrar visión consolidada" className="press text-on-surface-faint hover:text-on-surface">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {metricas.map((m) => (
          <div key={m.label} className="rounded-lg border border-outline bg-surface-high px-3 py-2.5 flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wide text-on-surface-faint">{m.label}</span>
            <span className="text-[15px] text-on-surface font-medium tabular">{m.valor}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] text-on-surface-variant">Evolución por día</span>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-outline p-0.5" role="group" aria-label="Tipo de gráfico">
              {(["barras", "linea"] as TipoGrafico[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipoGrafico(t)}
                  aria-pressed={tipoGrafico === t}
                  className={`press px-3 py-1 rounded-md text-[12px] transition-colors duration-150 ${
                    tipoGrafico === t ? "bg-primary/15 text-on-surface" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {t === "barras" ? "Barras" : "Línea"}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Métricas del gráfico">
            {METRICAS_SERIE.map((m) => {
              const activa = metricasGrafico.includes(m.key);
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => alternarMetrica(m.key)}
                  aria-pressed={activa}
                  className={`press px-3 py-1 rounded-full border text-[12px] transition-colors duration-150 ${
                    activa ? "border-primary bg-primary/10 text-on-surface" : "border-outline text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
            </div>
          </div>
        </div>

        {cargandoDiario && <p className="text-[13px] text-on-surface-faint">Cargando evolución diaria…</p>}
        {errorDiario && <p className="text-[13px] text-error">{errorDiario}</p>}
        {!cargandoDiario && !errorDiario && <SerieDiariaChart puntos={puntos} metricas={metricasGrafico} tipo={tipoGrafico} />}
        {anuncios.length > MAXIMO_ANUNCIOS && (
          <p className="text-[12px] text-on-surface-faint">
            El gráfico muestra los primeros {MAXIMO_ANUNCIOS} anuncios de la selección.
          </p>
        )}
      </div>
    </section>
  );
}
