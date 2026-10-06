"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { MetaAdsResponse } from "@/lib/meta-ads/types";
import { V3Dashboard } from "@/lib/v3/types";
import VermetricasLoader from "@/components/VermetricasLoader";
import MetaNoConectado from "@/components/v3/MetaNoConectado";
import AdCreativeCard from "@/components/v3/AdCreativeCard";
import AnalisisFiltrosModal from "@/components/v3/AnalisisFiltrosModal";
import GruposAnuncios from "@/components/v3/GruposAnuncios";
import CriterioLeadsPanel from "@/components/v3/CriterioLeadsPanel";
import OrdenarAnuncios from "@/components/v3/OrdenarAnuncios";
import Pagination from "@/components/ui/pagination";
import { useAcceso } from "@/components/v3/useAcceso";
import { SlidersHorizontal } from "lucide-react";
import { V3Lead } from "@/lib/v3/types";
import {
  CONFIG_POR_DEFECTO,
  CriterioLeads,
  ConfigAnalisis,
  GrupoGuardado,
  GrupoKey,
  OrdenAnuncios,
  ORDEN_POR_DEFECTO,
  aplicarConfig,
  calcularLeadsPorAnuncio,
  filtrosActivos,
  respuestasCalificadas,
  respuestasDePregunta,
  sanitizarConfig,
} from "@/lib/v3/analisis-anuncios";

const PAGE_SIZE_OPTIONS = [12, 24, 48];

export default function V3AnalisisPage() {
  const params = useParams<{ clienteId: string }>();
  const clienteId = params.clienteId;
  const searchParams = useSearchParams();
  const dashboardIdParam = searchParams.get("dashboard") ?? "";

  const [dashboards, setDashboards] = useState<V3Dashboard[]>([]);
  const [data, setData] = useState<MetaAdsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [config, setConfig] = useState<ConfigAnalisis>(CONFIG_POR_DEFECTO);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [grupos, setGrupos] = useState<GrupoGuardado[]>([]);
  const [grupoActivo, setGrupoActivo] = useState<string>("g:todos");
  const [leads, setLeads] = useState<V3Lead[]>([]);
  const [criterioAbierto, setCriterioAbierto] = useState(true);
  const acceso = useAcceso(clienteId);

  useEffect(() => {
    if (!clienteId) return;
    fetch(`/api/v3/grupos-anuncios?cliente_id=${clienteId}`, { cache: "no-store" })
      .then((res) => res.json().then((body) => (res.ok && Array.isArray(body) ? body : [])))
      .then((lista) => setGrupos(lista))
      .catch(() => setGrupos([]));
  }, [clienteId]);

  useEffect(() => {
    if (!clienteId) return;
    fetch(`/api/v3/dashboards?cliente_id=${clienteId}`, { cache: "no-store" })
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => setDashboards(ok ? body.dashboards ?? [] : []))
      .catch(() => setDashboards([]));
  }, [clienteId]);

  const dashboardActual = dashboards.find((d) => String(d.id) === dashboardIdParam) ?? null;
  const dashboardActualId = dashboardActual?.id ?? null;

  useEffect(() => {
    if (!clienteId || dashboardActualId === null) {
      setLeads([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/v3/leads?cliente_id=${clienteId}&dashboard_id=${dashboardActualId}`, { cache: "no-store" })
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => {
        if (!cancelled) setLeads(ok && Array.isArray(body.leads) ? body.leads : []);
      })
      .catch(() => {
        if (!cancelled) setLeads([]);
      });
    return () => {
      cancelled = true;
    };
  }, [clienteId, dashboardActualId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams({ cliente_id: clienteId });
    if (dashboardActual?.nomenclatura_filtro) qs.set("nomenclatura", dashboardActual.nomenclatura_filtro);
    fetch(`/api/anuncios/meta?${qs.toString()}`, { cache: "no-store" })
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => {
        if (cancelled) return;
        if (!ok) {
          setError(body.error || "No se pudo consultar Meta Ads");
          return;
        }
        setData(body);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo conectar al servidor");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clienteId, dashboardActual?.nomenclatura_filtro]);

  useEffect(() => {
    setPage(1);
  }, [clienteId, dashboardActual?.nomenclatura_filtro, pageSize]);

  function cambiarPageSize(size: number) {
    setPageSize(size);
    setPage(1);
  }

  function toggleSeleccion(adId: string) {
    setSeleccionados((prev) => (prev.includes(adId) ? prev.filter((id) => id !== adId) : [...prev, adId]));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <VermetricasLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8 md:px-8 max-w-7xl">
        <div className="rounded-lg border border-outline-error bg-error-container px-4 py-3 text-sm text-error">{error}</div>
      </div>
    );
  }

  if (!data || !data.conectado) {
    return <MetaNoConectado />;
  }

  const respuestasCriterio = config.criterio ? respuestasDePregunta(leads, config.criterio.pregunta) : [];
  const calificadas = config.criterio ? respuestasCalificadas(config.criterio, respuestasCriterio) : new Set<string>();
  const anunciosConLeads = calcularLeadsPorAnuncio(data.anuncios, leads, config.criterio, calificadas);
  const anunciosOrdenados = aplicarConfig(anunciosConLeads, config);

  // Si todos los anuncios empatan en la métrica del grupo, el orden que se ve es el
  // de Meta, no un ranking. Se avisa en vez de dejar que parezca un orden real.
  const todosEmpatan = (valores: number[]) => valores.length > 0 && valores.every((v) => v === valores[0]);
  const avisoOrden =
    anunciosOrdenados.length < 2 || config.orden.metrica
      ? null
      : config.grupo === "mejores_leads" && config.criterio && todosEmpatan(anunciosOrdenados.map((a) => a.leadsTotal))
        ? "Todavía ningún lead llega con el id del anuncio, así que no hay orden por leads calificados. Se muestran en el orden de Meta."
        : (config.grupo === "todos" || config.grupo === "mejor_roas") && todosEmpatan(anunciosOrdenados.map((a) => a.roas))
          ? "Ningún anuncio tiene ROAS todavía (Meta no registra compras), así que se muestran en el orden de Meta."
          : null;

  function cambiarCriterio(criterio: CriterioLeads) {
    setConfig((c) => ({ ...c, criterio }));
  }
  const anunciosSeleccionados = anunciosOrdenados.filter((a) => seleccionados.includes(a.ad_id));
  const campanasDisponibles = Array.from(new Map(data.anuncios.map((a) => [a.campaign_id, a.campaign_name])), ([id, nombre]) => ({
    id,
    nombre,
  }));
  const cantFiltros = filtrosActivos(config);

  function aplicarFiltros(nueva: ConfigAnalisis) {
    setConfig(nueva);
    setGrupoActivo("libre");
    setPage(1);
    setFiltrosAbiertos(false);
  }

  const grupoGuardadoActivo = grupoActivo.startsWith("s:") ? grupos.find((g) => `s:${g.id}` === grupoActivo) : undefined;
  const hayCambios = grupoGuardadoActivo
    ? JSON.stringify(sanitizarConfig(grupoGuardadoActivo.config)) !== JSON.stringify(config)
    : false;

  function cambiarOrden(orden: OrdenAnuncios) {
    setConfig((c) => ({ ...c, orden }));
    setPage(1);
  }

  function seleccionarPredefinido(key: GrupoKey) {
    setConfig((c) => ({ ...c, grupo: key, adIds: [], orden: ORDEN_POR_DEFECTO }));
    setGrupoActivo(`g:${key}`);
    setCriterioAbierto(true);
    setPage(1);
  }

  function seleccionarGuardado(g: GrupoGuardado) {
    setConfig(sanitizarConfig(g.config));
    setGrupoActivo(`s:${g.id}`);
    setCriterioAbierto(false);
    setPage(1);
  }

  async function guardarNuevoGrupo(nombre: string, soloSeleccionados: boolean): Promise<string | null> {
    const configGuardar: ConfigAnalisis = { ...config, adIds: soloSeleccionados ? seleccionados : [] };
    const res = await fetch("/api/v3/grupos-anuncios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente_id: clienteId, nombre, config: configGuardar }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return body.error || "No se pudo guardar el grupo";
    const nuevo = body as GrupoGuardado;
    setGrupos((prev) => [...prev, nuevo]);
    setConfig(sanitizarConfig(nuevo.config));
    setGrupoActivo(`s:${nuevo.id}`);
    return null;
  }

  async function actualizarGrupoActivo(): Promise<string | null> {
    if (!grupoGuardadoActivo) return "Elegí un grupo para actualizar";
    const res = await fetch("/api/v3/grupos-anuncios", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: grupoGuardadoActivo.id, cliente_id: clienteId, nombre: grupoGuardadoActivo.nombre, config }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return body.error || "No se pudo actualizar el grupo";
    setGrupos((prev) => prev.map((g) => (g.id === grupoGuardadoActivo.id ? (body as GrupoGuardado) : g)));
    return null;
  }

  async function eliminarGrupo(id: number): Promise<string | null> {
    const res = await fetch(`/api/v3/grupos-anuncios?id=${id}&cliente_id=${clienteId}`, { method: "DELETE" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return body.error || "No se pudo eliminar el grupo";
    setGrupos((prev) => prev.filter((g) => g.id !== id));
    if (grupoActivo === `s:${id}`) {
      setGrupoActivo("g:todos");
      setConfig((c) => ({ ...c, grupo: "todos", adIds: [] }));
    }
    return null;
  }
  const totalPages = Math.max(1, Math.ceil(anunciosOrdenados.length / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const visibles = anunciosOrdenados.slice((pageClamped - 1) * pageSize, pageClamped * pageSize);

  return (
    <div className="px-4 py-8 md:px-8 max-w-7xl mx-auto flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.14em] text-primary font-mono">Meta Ads · Últimos 30 días</span>
          <h1 className="font-display text-2xl text-on-surface font-semibold">Análisis de Anuncios</h1>
          <p className="text-sm text-on-surface-variant">Seleccioná 2 o más para compararlos lado a lado.</p>
        </div>
        <button
          type="button"
          onClick={() => setFiltrosAbiertos(true)}
          className="press inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-2 rounded-lg border border-outline bg-surface text-[13px] text-on-surface-variant hover:text-on-surface transition-colors duration-150"
        >
          <SlidersHorizontal size={15} strokeWidth={2} />
          Filtros y métricas
          {cantFiltros > 0 && (
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-on-primary text-[11px] font-medium grid place-items-center">
              {cantFiltros}
            </span>
          )}
        </button>
      </header>

      <GruposAnuncios
        guardados={grupos}
        activo={grupoActivo}
        puedeEscribir={acceso.puedeEscribir}
        hayCambios={hayCambios}
        cantSeleccionados={seleccionados.length}
        onSeleccionarPredefinido={seleccionarPredefinido}
        onSeleccionarGuardado={seleccionarGuardado}
        onGuardarNuevo={guardarNuevoGrupo}
        onActualizar={actualizarGrupoActivo}
        onEliminar={eliminarGrupo}
        acciones={<OrdenarAnuncios orden={config.orden} onChange={cambiarOrden} />}
      />

      {config.grupo === "mejores_leads" && (
        <CriterioLeadsPanel
          leads={leads}
          criterio={config.criterio}
          dashboardElegido={dashboardActualId !== null}
          puedeEscribir={acceso.puedeEscribir}
          abierto={criterioAbierto}
          onToggleAbierto={() => setCriterioAbierto((v) => !v)}
          onChange={cambiarCriterio}
          onGuardarGrupo={(nombre) => guardarNuevoGrupo(nombre, false)}
        />
      )}

      {filtrosAbiertos && (
        <AnalisisFiltrosModal
          config={config}
          campanas={campanasDisponibles}
          onAplicar={aplicarFiltros}
          onClose={() => setFiltrosAbiertos(false)}
        />
      )}

      {anunciosSeleccionados.length >= 2 && (
        <div className="animate-fade-in-up bg-surface border border-outline rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-medium text-on-surface">Comparación ({anunciosSeleccionados.length})</h2>
            <button
              type="button"
              onClick={() => setSeleccionados([])}
              className="press text-[13px] text-on-surface-variant hover:text-on-surface transition-colors duration-150"
            >
              Limpiar selección
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {anunciosSeleccionados.map((ad) => (
              <div key={ad.ad_id} className="w-full sm:w-96">
                <AdCreativeCard clienteId={clienteId} ad={ad} selected onToggle={() => toggleSeleccion(ad.ad_id)} metricas={config.metricas} />
              </div>
            ))}
          </div>
        </div>
      )}

      {anunciosOrdenados.length === 0 ? (
        <p className="text-sm text-on-surface-faint py-6">
          {data.anuncios.length === 0 ? "Sin anuncios en los últimos 30 días." : "Ningún anuncio cumple los filtros elegidos."}
        </p>
      ) : (
        <>
          <span className="text-[13px] text-on-surface-faint">
            {anunciosOrdenados.length} {anunciosOrdenados.length === 1 ? "anuncio" : "anuncios"}
          </span>
          {avisoOrden && (
            <p className="text-[13px] text-on-surface-variant bg-surface border border-outline rounded-lg px-4 py-3">{avisoOrden}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibles.map((ad) => (
              <AdCreativeCard
                key={ad.ad_id}
                clienteId={clienteId}
                ad={ad}
                selected={seleccionados.includes(ad.ad_id)}
                onToggle={() => toggleSeleccion(ad.ad_id)}
                metricas={config.metricas}
              />
            ))}
          </div>
          <Pagination
            page={pageClamped}
            pageCount={totalPages}
            pageSize={pageSize}
            total={anunciosOrdenados.length}
            onPageChange={setPage}
            onPageSizeChange={cambiarPageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </>
      )}
    </div>
  );
}
