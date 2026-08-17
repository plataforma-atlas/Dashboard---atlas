"use client";

import { useState } from "react";

type Inscrito = {
  lead_id: number;
  name: string | null;
  email: string;
  phone: string | null;
  country: string | null;
  campaign_name: string;
  checked_in: boolean;
};

export default function CheckinPage() {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Inscrito[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [searched, setSearched] = useState(false);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await fetch(`/api/evento/buscar?q=${encodeURIComponent(query.trim())}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo buscar");
        setResultados([]);
        return;
      }
      setResultados(data.inscritos ?? []);
    } catch {
      setError("No se pudo conectar al servidor");
      setResultados([]);
    } finally {
      setLoading(false);
    }
  }

  async function marcarCheckin(leadId: number) {
    setBusyId(leadId);
    try {
      const res = await fetch("/api/evento/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No se pudo registrar el check-in");
        return;
      }
      setResultados((prev) => prev.map((r) => (r.lead_id === leadId ? { ...r, checked_in: true } : r)));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="w-full max-w-lg mx-auto">
        <div className="flex flex-col items-center gap-1 mb-6 text-center">
          <span className="text-[11px] uppercase tracking-[0.14em] text-primary font-mono">The Trading Experience</span>
          <h1 className="font-display text-2xl text-on-surface font-semibold">Check-in del evento</h1>
          <p className="text-sm text-on-surface-faint">Busca al inscrito por nombre, correo o teléfono y confirma su entrada.</p>
        </div>

        <form onSubmit={buscar} className="flex gap-2 mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre, correo o teléfono"
            autoFocus
            className="flex-1 bg-surface border border-outline rounded-md px-3 py-3 text-base text-on-surface focus:border-primary outline-none"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-primary text-background font-semibold rounded-md px-5 py-3 text-sm disabled:opacity-50"
          >
            {loading ? "Buscando…" : "Buscar"}
          </button>
        </form>

        {error && <p className="text-sm text-error mb-4">{error}</p>}

        {searched && !loading && !error && resultados.length === 0 && (
          <p className="text-sm text-on-surface-faint text-center">No se encontró ningún inscrito con ese dato.</p>
        )}

        <div className="flex flex-col gap-3">
          {resultados.map((r) => (
            <div
              key={r.lead_id}
              className="rounded-lg border border-outline bg-surface p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-on-surface font-medium truncate">{r.name || "(sin nombre)"}</p>
                <p className="text-xs text-on-surface-faint truncate">{r.email}</p>
                {r.phone && <p className="text-xs text-on-surface-faint truncate">{r.phone}</p>}
                <p className="text-[11px] uppercase tracking-[0.08em] text-on-surface-variant mt-1">{r.campaign_name}</p>
              </div>
              {r.checked_in ? (
                <span className="shrink-0 text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1.5 whitespace-nowrap">
                  ✓ Ya ingresó
                </span>
              ) : (
                <button
                  onClick={() => marcarCheckin(r.lead_id)}
                  disabled={busyId === r.lead_id}
                  className="shrink-0 bg-primary text-background font-semibold rounded-md px-4 py-2.5 text-sm disabled:opacity-50 whitespace-nowrap"
                >
                  {busyId === r.lead_id ? "Marcando…" : "Marcar check-in"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
