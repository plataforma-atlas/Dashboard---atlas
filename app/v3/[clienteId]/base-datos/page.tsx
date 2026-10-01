"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Download, History } from "lucide-react";
import VermetricasLoader from "@/components/VermetricasLoader";
import Pagination from "@/components/ui/pagination";
import LeadHistorialPanel from "@/components/v3/LeadHistorialPanel";
import RecorridoCompraChart from "@/components/v3/RecorridoCompraChart";
import { V3AnalisisRecorrido, V3Lead, V3LeadStatus } from "@/lib/v3/types";

const TABS: { status: V3LeadStatus; label: string }[] = [
  { status: "lead", label: "Leads captados" },
  { status: "comprado", label: "Ventas" },
];

const TAB_RECORRIDO = "recorrido" as const;

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function V3BaseDatosPage() {
  const params = useParams<{ clienteId: string }>();
  const clienteId = params.clienteId;
  const searchParams = useSearchParams();
  const dashboardIdParam = searchParams.get("dashboard") ?? "";

  const [tab, setTab] = useState<V3LeadStatus | typeof TAB_RECORRIDO>("lead");
  const [leads, setLeads] = useState<V3Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [historialDe, setHistorialDe] = useState<{ correo: string | null; telefono: string | null } | null>(null);
  const [analisis, setAnalisis] = useState<V3AnalisisRecorrido | null>(null);
  const [analisisLoading, setAnalisisLoading] = useState(false);
  const [analisisError, setAnalisisError] = useState<string | null>(null);

  async function cargarLeads(status: V3LeadStatus) {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/v3/leads?cliente_id=${encodeURIComponent(clienteId)}&status=${status}${
        dashboardIdParam ? `&dashboard_id=${encodeURIComponent(dashboardIdParam)}` : ""
      }`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudieron cargar los leads");
        return;
      }
      setLeads(Array.isArray(data.leads) ? data.leads : []);
    } catch {
      setError("No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (clienteId && tab !== TAB_RECORRIDO) cargarLeads(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId, tab, dashboardIdParam]);

  // El recorrido de compra cruza TODOS los dashboards del cliente (no tiene
  // sentido filtrarlo por el lanzamiento seleccionado arriba), así que se
  // carga una sola vez por cliente, no por dashboardIdParam.
  useEffect(() => {
    if (tab !== TAB_RECORRIDO || !clienteId || analisis) return;
    setAnalisisLoading(true);
    setAnalisisError(null);
    fetch(`/api/v3/leads/analisis-recorrido?cliente_id=${encodeURIComponent(clienteId)}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data: V3AnalisisRecorrido & { error?: string }) => {
        if (data.error) {
          setAnalisisError(data.error);
          return;
        }
        setAnalisis(data);
      })
      .catch(() => setAnalisisError("No se pudo conectar al servidor"))
      .finally(() => setAnalisisLoading(false));
  }, [tab, clienteId, analisis]);

  useEffect(() => {
    setPage(1);
  }, [tab, pageSize]);

  const totalPages = Math.max(1, Math.ceil(leads.length / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const visibles = leads.slice((pageClamped - 1) * pageSize, pageClamped * pageSize);

  function celdaCsv(valor: string) {
    const texto = valor ?? "";
    return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  }

  function exportarCsv() {
    const encabezados =
      tab === "comprado"
        ? ["Nombre", "Correo", "Teléfono", "Producto", "Monto", "Moneda", "Origen del lead", "Origen de la venta", "Sin embudo", "Fecha"]
        : ["Nombre", "Correo", "Teléfono", "Origen", "Fecha"];
    const filas = leads.map((lead) => {
      const producto = typeof lead.extra?.producto === "string" ? lead.extra.producto : "";
      const monto = typeof lead.extra?.monto === "number" ? lead.extra.monto : null;
      const moneda = typeof lead.extra?.moneda === "string" ? lead.extra.moneda : "";
      const ventaSck = typeof lead.extra?.venta_sck === "string" ? lead.extra.venta_sck : "";
      const fueraDeEmbudo = lead.extra?.fuera_de_embudo === true;
      const origen = lead.utm_source || lead.pagina_origen || "";
      const fecha = new Date(lead.created_at).toLocaleDateString("es-CO");
      const base = [lead.nombre || "", lead.correo || "", lead.telefono || ""];
      const resto =
        tab === "comprado"
          ? [producto, monto !== null ? String(monto) : "", moneda, origen, ventaSck, fueraDeEmbudo ? "Si" : "No", fecha]
          : [origen, fecha];
      return [...base, ...resto].map(celdaCsv).join(",");
    });
    const csv = [encabezados.join(","), ...filas].join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tab === "comprado" ? "ventas" : "leads"}-${clienteId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="px-4 py-8 md:px-8 max-w-5xl mx-auto flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-[0.14em] text-primary font-mono">Base de datos</span>
        <h1 className="font-display text-2xl text-on-surface font-semibold">Leads</h1>
        <p className="text-sm text-on-surface-variant">Todo lo que llega por tus puntos de captación de Lanzamientos.</p>
      </header>

      <div className="flex items-center justify-between gap-2 border-b border-outline">
        <div className="flex items-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.status}
              type="button"
              onClick={() => setTab(t.status)}
              className={`press px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors duration-150 ${
                tab === t.status ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {t.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setTab(TAB_RECORRIDO)}
            className={`press px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors duration-150 ${
              tab === TAB_RECORRIDO ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Recorrido de compra
          </button>
        </div>
        {tab !== TAB_RECORRIDO && leads.length > 0 && (
          <button
            type="button"
            onClick={exportarCsv}
            className="press mb-2 flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-md border border-outline hover:border-primary text-on-surface-variant hover:text-on-surface font-medium transition-colors duration-150"
          >
            <Download size={14} /> Exportar CSV
          </button>
        )}
      </div>

      {tab === TAB_RECORRIDO ? (
        analisisLoading ? (
          <div className="min-h-[30vh] flex items-center justify-center">
            <VermetricasLoader />
          </div>
        ) : analisisError ? (
          <div className="rounded-lg border border-outline-error bg-error-container px-4 py-3 text-sm text-error">{analisisError}</div>
        ) : analisis ? (
          <div className="flex flex-col gap-5">
            <p className="text-sm text-on-surface-variant">
              Cuántos contactos (registros, encuestas, grupos, mensajes) le toman a las personas comprar — cruzando todos los
              lanzamientos en los que participaron, no solo el que está seleccionado arriba.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-lg border border-outline bg-surface p-4 flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wide text-on-surface-faint">Compradores analizados</span>
                <span className="text-xl font-semibold text-on-surface">{analisis.total_compradores}</span>
              </div>
              <div className="rounded-lg border border-outline bg-surface p-4 flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wide text-on-surface-faint">Promedio</span>
                <span className="text-xl font-semibold text-on-surface">{analisis.promedio ?? "—"}</span>
              </div>
              <div className="rounded-lg border border-outline bg-surface p-4 flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wide text-on-surface-faint">Mediana</span>
                <span className="text-xl font-semibold text-on-surface">{analisis.mediana ?? "—"}</span>
              </div>
              <div className="rounded-lg border border-outline bg-surface p-4 flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wide text-on-surface-faint">Rango</span>
                <span className="text-xl font-semibold text-on-surface">
                  {analisis.minimo ?? "—"}–{analisis.maximo ?? "—"}
                </span>
              </div>
            </div>
            <RecorridoCompraChart datos={analisis} />
          </div>
        ) : null
      ) : loading ? (
        <div className="min-h-[30vh] flex items-center justify-center">
          <VermetricasLoader />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-outline-error bg-error-container px-4 py-3 text-sm text-error">{error}</div>
      ) : leads.length === 0 ? (
        <p className="text-[13px] text-on-surface-faint py-8 text-center">
          {tab === "lead" ? "Todavía no llegó ningún lead." : "Todavía no hay ventas registradas."}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-outline bg-surface overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-on-surface-faint uppercase tracking-[0.08em] text-[11px] border-b border-outline">
                  <th className="px-4 py-2.5 font-medium">Nombre</th>
                  <th className="px-4 py-2.5 font-medium">Correo</th>
                  <th className="px-4 py-2.5 font-medium">Teléfono</th>
                  {tab === "comprado" ? (
                    <>
                      <th className="px-4 py-2.5 font-medium">Producto</th>
                      <th className="px-4 py-2.5 font-medium">Monto</th>
                      <th className="px-4 py-2.5 font-medium">Origen del lead</th>
                      <th className="px-4 py-2.5 font-medium">Origen de la venta</th>
                    </>
                  ) : (
                    <th className="px-4 py-2.5 font-medium">Origen</th>
                  )}
                  <th className="px-4 py-2.5 font-medium">Fecha</th>
                  <th className="px-4 py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((lead) => {
                  const producto = typeof lead.extra?.producto === "string" ? lead.extra.producto : "";
                  const monto = typeof lead.extra?.monto === "number" ? lead.extra.monto : null;
                  const moneda = typeof lead.extra?.moneda === "string" ? lead.extra.moneda : "";
                  const ventaSck = typeof lead.extra?.venta_sck === "string" ? lead.extra.venta_sck : "";
                  const fueraDeEmbudo = lead.extra?.fuera_de_embudo === true;
                  return (
                    <tr key={lead.id} className="border-b border-outline last:border-0">
                      <td className="px-4 py-2.5 text-on-surface">
                        <div className="flex items-center gap-2">
                          <span>{lead.nombre || "—"}</span>
                          {tab === "comprado" && fueraDeEmbudo && (
                            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border border-outline text-on-surface-faint shrink-0">
                              Sin embudo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-on-surface-variant">{lead.correo || "—"}</td>
                      <td className="px-4 py-2.5 text-on-surface-variant font-mono">{lead.telefono || "—"}</td>
                      {tab === "comprado" ? (
                        <>
                          <td className="px-4 py-2.5 text-on-surface-variant truncate max-w-[220px]">{producto || "—"}</td>
                          <td className="px-4 py-2.5 text-on-surface-variant font-mono">{monto !== null ? `${monto} ${moneda}`.trim() : "—"}</td>
                          <td className="px-4 py-2.5 text-on-surface-variant truncate max-w-[160px]">{lead.utm_source || lead.pagina_origen || "—"}</td>
                          <td className="px-4 py-2.5 text-on-surface-variant truncate max-w-[160px]">{ventaSck || "—"}</td>
                        </>
                      ) : (
                        <td className="px-4 py-2.5 text-on-surface-variant truncate max-w-[220px]">{lead.utm_source || lead.pagina_origen || "—"}</td>
                      )}
                      <td className="px-4 py-2.5 text-on-surface-faint">{new Date(lead.created_at).toLocaleDateString("es-CO")}</td>
                      <td className="px-4 py-2.5">
                        {(lead.correo || lead.telefono) && (
                          <button
                            type="button"
                            onClick={() => setHistorialDe({ correo: lead.correo, telefono: lead.telefono })}
                            title="Ver historial completo de este contacto"
                            className="press text-on-surface-faint hover:text-primary"
                          >
                            <History size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={pageClamped}
            pageCount={totalPages}
            pageSize={pageSize}
            total={leads.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </div>
      )}

      {historialDe && (
        <LeadHistorialPanel
          clienteId={clienteId}
          correo={historialDe.correo}
          telefono={historialDe.telefono}
          onClose={() => setHistorialDe(null)}
        />
      )}
    </div>
  );
}
