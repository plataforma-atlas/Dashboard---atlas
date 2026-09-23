"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, FileSpreadsheet } from "lucide-react";
import Pagination from "@/components/ui/pagination";
import { formatMoney } from "@/lib/webinar-os/aggregate";
import { useSidePanel } from "@/components/SidePanelProvider";

type Campana = { id: number; cliente_id: string; name: string; strategy_type: string; status: string; slug: string | null };

type LeadRow = {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  country: string | null;
  utm_source: string | null;
  created_at: string;
  campaign_name: string;
  campaign_slug: string;
  etapa_nombre: string | null;
  es_comprador: boolean;
  monto_comprado: number | string;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const COLUMNAS: { key: keyof LeadRow; label: string }[] = [
  { key: "name", label: "Nombre" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Teléfono" },
  { key: "country", label: "País" },
  { key: "campaign_name", label: "Campaña" },
  { key: "etapa_nombre", label: "Etapa" },
  { key: "utm_source", label: "Fuente" },
  { key: "created_at", label: "Registrado" },
];

function formatFecha(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function montoNumero(v: number | string) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isNaN(n) ? 0 : n;
}

function csvEscape(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function descargarArchivo(contenido: string, nombre: string, tipo: string) {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LeadsBody() {
  const searchParams = useSearchParams();
  const { leadsCampaign } = useSidePanel();

  const [clienteId, setClienteId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [clientes, setClientes] = useState<{ id: string; name: string }[] | null>(null);

  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [campanaSlug, setCampanaSlug] = useState<string>("");

  const [tab, setTab] = useState<"leads" | "compradores">("leads");
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (leadsCampaign) setCampanaSlug(leadsCampaign);
  }, [leadsCampaign]);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
      const me = meRes && meRes.ok ? await meRes.json().catch(() => null) : null;
      const esAdmin = me?.role === "admin";
      setIsAdmin(esAdmin);
      const fromQuery = searchParams.get("cliente_id");
      const propio = me?.clientes?.[0] ?? null;
      const id = fromQuery || propio;
      if (!id) {
        if (esAdmin) {
          setLoading(false);
          const res = await fetch("/api/clientes", { cache: "no-store" }).catch(() => null);
          const data = res && res.ok ? await res.json().catch(() => null) : null;
          setClientes(data?.clientes ?? []);
          return;
        }
        setError("Tu cuenta no tiene un cliente asignado todavía.");
        setLoading(false);
        return;
      }
      setClienteId(id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!clienteId) return;
    (async () => {
      const res = await fetch(`/api/campanas?cliente_id=${encodeURIComponent(clienteId)}`, { cache: "no-store" }).catch(() => null);
      const data = res && res.ok ? await res.json().catch(() => null) : null;
      const todas: Campana[] = data?.campanas ?? [];
      setCampanas(todas.filter((c) => c.strategy_type === "webinar_automatizado" && c.slug));
    })();
  }, [clienteId]);

  async function cargarLeads(id: string, slug: string) {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ cliente_id: id });
      if (slug) qs.set("campaign", slug);
      const res = await fetch(`/api/leads?${qs.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudieron cargar los leads");
        return;
      }
      setRows(data.leads ?? []);
    } catch {
      setError("No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (clienteId) cargarLeads(clienteId, campanaSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId, campanaSlug]);

  useEffect(() => {
    setPage(1);
  }, [tab, campanaSlug, pageSize]);

  const filtradas = useMemo(() => (tab === "compradores" ? rows.filter((r) => r.es_comprador) : rows), [rows, tab]);
  const totalCompradores = useMemo(() => rows.filter((r) => r.es_comprador).length, [rows]);
  const totalPages = Math.max(1, Math.ceil(filtradas.length / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const visibles = filtradas.slice((pageClamped - 1) * pageSize, pageClamped * pageSize);

  function exportar(formato: "csv" | "excel") {
    const encabezados = COLUMNAS.map((c) => c.label);
    const filas = filtradas.map((r) => COLUMNAS.map((c) => (c.key === "created_at" ? formatFecha(r.created_at) : r[c.key] ?? "")));
    const nombreBase = `${tab}-${campanaSlug || "todas"}`;

    if (formato === "csv") {
      const csv = [encabezados, ...filas].map((f) => f.map(csvEscape).join(",")).join("\n");
      descargarArchivo(`﻿${csv}`, `${nombreBase}.csv`, "text/csv;charset=utf-8;");
    } else {
      const html = `<table><thead><tr>${encabezados
        .map((h) => `<th>${h}</th>`)
        .join("")}</tr></thead><tbody>${filas
        .map((f) => `<tr>${f.map((v) => `<td>${String(v)}</td>`).join("")}</tr>`)
        .join("")}</tbody></table>`;
      descargarArchivo(html, `${nombreBase}.xls`, "application/vnd.ms-excel;charset=utf-8;");
    }
  }

  return (
    <div className="max-w-5xl flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.14em] text-primary font-mono">Leads</span>
          <h1 className="font-display text-2xl text-on-surface font-semibold">Leads y compradores</h1>
          <p className="text-[15px] text-on-surface-variant">
            Todos los registros captados por tu embudo, con la etapa a la que llegaron y quiénes ya compraron.
          </p>
        </div>
      </header>

      {error && <div className="rounded-lg border border-outline-error bg-error-container px-4 py-3 text-sm text-error">{error}</div>}

      {loading && rows.length === 0 ? (
        <p className="text-[15px] text-on-surface-variant">Cargando…</p>
      ) : clienteId ? (
        <div className="rounded-lg border border-outline bg-surface p-5 md:p-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 rounded-lg bg-background p-1 border border-outline">
              <button
                type="button"
                onClick={() => setTab("leads")}
                className={`press px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                  tab === "leads" ? "bg-surface-high text-on-surface" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Leads ({rows.length})
              </button>
              <button
                type="button"
                onClick={() => setTab("compradores")}
                className={`press px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                  tab === "compradores" ? "bg-surface-high text-on-surface" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Compradores ({totalCompradores})
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {campanas.length > 0 && (
                <select
                  value={campanaSlug}
                  onChange={(e) => setCampanaSlug(e.target.value)}
                  className="bg-background border border-outline rounded-md px-2.5 py-1.5 text-[13px] text-on-surface outline-none focus:border-primary transition-colors duration-150"
                >
                  <option value="">Todas las campañas</option>
                  {campanas.map((c) => (
                    <option key={c.id} value={c.slug ?? ""}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={() => exportar("csv")}
                disabled={filtradas.length === 0}
                className="press inline-flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-md border border-outline text-on-surface-variant hover:text-on-surface hover:bg-surface-high disabled:opacity-40 disabled:pointer-events-none transition-colors duration-150"
              >
                <Download size={13} />
                CSV
              </button>
              <button
                type="button"
                onClick={() => exportar("excel")}
                disabled={filtradas.length === 0}
                className="press inline-flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-md border border-outline text-on-surface-variant hover:text-on-surface hover:bg-surface-high disabled:opacity-40 disabled:pointer-events-none transition-colors duration-150"
              >
                <FileSpreadsheet size={13} />
                Excel
              </button>
            </div>
          </div>

          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-[13px] min-w-[720px]">
              <thead>
                <tr className="text-xs uppercase tracking-[0.08em] text-on-surface-faint text-left border-b border-outline">
                  <th className="py-2 px-1 font-medium">Nombre</th>
                  <th className="py-2 px-1 font-medium">Contacto</th>
                  <th className="py-2 px-1 font-medium">Campaña</th>
                  <th className="py-2 px-1 font-medium">Etapa</th>
                  <th className="py-2 px-1 font-medium">Fuente</th>
                  <th className="py-2 px-1 font-medium">Registrado</th>
                  {tab === "compradores" && <th className="py-2 px-1 font-medium text-right">Monto</th>}
                </tr>
              </thead>
              <tbody>
                {visibles.map((r) => (
                  <tr key={r.id} className="border-b border-outline/50 last:border-0 hover:bg-surface-high transition-colors duration-150">
                    <td className="py-2.5 px-1 text-on-surface truncate max-w-[160px]">{r.name || "—"}</td>
                    <td className="py-2.5 px-1 text-on-surface-variant">
                      <div className="flex flex-col">
                        <span className="truncate max-w-[200px]">{r.email}</span>
                        {r.phone && <span className="text-xs text-on-surface-faint">{r.phone}</span>}
                      </div>
                    </td>
                    <td className="py-2.5 px-1 text-on-surface-variant truncate max-w-[140px]">{r.campaign_name}</td>
                    <td className="py-2.5 px-1 text-on-surface-variant">{r.etapa_nombre || "—"}</td>
                    <td className="py-2.5 px-1 text-on-surface-variant">{r.utm_source || "—"}</td>
                    <td className="py-2.5 px-1 text-on-surface-variant font-mono tabular-nums whitespace-nowrap">{formatFecha(r.created_at)}</td>
                    {tab === "compradores" && (
                      <td className="py-2.5 px-1 text-secondary font-mono tabular-nums text-right whitespace-nowrap">
                        {formatMoney(montoNumero(r.monto_comprado))}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {filtradas.length === 0 && (
              <p className="text-[14px] text-on-surface-variant py-6 text-center">
                {tab === "compradores" ? "Todavía no hay compradores para este filtro." : "Todavía no hay leads para este filtro."}
              </p>
            )}
          </div>

          {filtradas.length > 0 && (
            <Pagination
              page={pageClamped}
              pageCount={totalPages}
              pageSize={pageSize}
              total={filtradas.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
            />
          )}
        </div>
      ) : isAdmin ? (
        <div className="flex flex-col gap-2">
          <p className="text-[15px] text-on-surface-variant">Elegí un cliente para ver sus leads y compradores.</p>
          {(clientes ?? []).map((c, i) => (
            <button
              key={c.id}
              onClick={() => setClienteId(c.id)}
              style={{ animationDelay: `${i * 40}ms` }}
              className="press animate-fade-in-up text-left rounded-lg border border-outline bg-surface p-4 flex items-center justify-between gap-4 hover:border-primary transition-colors duration-150"
            >
              <span className="text-[14px] font-medium text-on-surface">{c.name}</span>
              <span className="text-[13px] px-3 py-1.5 rounded-full border border-outline text-on-surface-variant shrink-0">Revisar →</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
