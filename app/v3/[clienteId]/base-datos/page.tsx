"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import VermetricasLoader from "@/components/VermetricasLoader";
import { V3Lead, V3LeadStatus } from "@/lib/v3/types";

const TABS: { status: V3LeadStatus; label: string }[] = [
  { status: "lead", label: "Leads captados" },
  { status: "comprado", label: "Ventas" },
];

export default function V3BaseDatosPage() {
  const params = useParams<{ clienteId: string }>();
  const clienteId = params.clienteId;

  const [tab, setTab] = useState<V3LeadStatus>("lead");
  const [leads, setLeads] = useState<V3Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function cargarLeads() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v3/leads?cliente_id=${encodeURIComponent(clienteId)}&status=${tab}`, { cache: "no-store" });
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
    if (clienteId) cargarLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId, tab]);

  return (
    <div className="px-4 py-8 md:px-8 max-w-5xl mx-auto flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-[0.14em] text-primary font-mono">Base de datos</span>
        <h1 className="font-display text-2xl text-on-surface font-semibold">Leads</h1>
        <p className="text-sm text-on-surface-variant">Todo lo que llega por tus puntos de captación de Lanzamientos.</p>
      </header>

      <div className="flex items-center gap-2 border-b border-outline">
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
      </div>

      {loading ? (
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
        <div className="rounded-lg border border-outline bg-surface overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-on-surface-faint uppercase tracking-[0.08em] text-[11px] border-b border-outline">
                <th className="px-4 py-2.5 font-medium">Nombre</th>
                <th className="px-4 py-2.5 font-medium">Correo</th>
                <th className="px-4 py-2.5 font-medium">Teléfono</th>
                <th className="px-4 py-2.5 font-medium">Origen</th>
                <th className="px-4 py-2.5 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-outline last:border-0">
                  <td className="px-4 py-2.5 text-on-surface">{lead.nombre || "—"}</td>
                  <td className="px-4 py-2.5 text-on-surface-variant">{lead.correo || "—"}</td>
                  <td className="px-4 py-2.5 text-on-surface-variant font-mono">{lead.telefono || "—"}</td>
                  <td className="px-4 py-2.5 text-on-surface-variant truncate max-w-[220px]">{lead.utm_source || lead.pagina_origen || "—"}</td>
                  <td className="px-4 py-2.5 text-on-surface-faint">{new Date(lead.created_at).toLocaleDateString("es-CO")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
