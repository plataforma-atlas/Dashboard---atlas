"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useThemeMode } from "@/components/ThemeModeProvider";
import ThemeModeToggle from "@/components/ThemeModeToggle";

type Inscrito = {
  lead_id: number;
  name: string | null;
  email: string;
  phone: string | null;
  country: string | null;
  campaign_name: string;
  tier: string;
  checked_in: boolean;
};

type ResumenTier = { tier: string; total: string; checked_in: string };

type EditForm = { name: string; email: string; phone: string; notes: string };

type GuestForm = { name: string; phone: string; email: string };

type PonenteForm = { name: string; phone: string; email: string; pais: string };

type Guest = { name: string; phone: string; email: string };

function tierBadgeClass(tier: string) {
  if (tier === "VIP") return "text-violet-300 bg-violet-500/10 border-violet-500/30";
  if (tier === "Platino") return "text-slate-200 bg-slate-400/10 border-slate-400/30";
  if (tier === "Confirmado") return "text-primary bg-primary/10 border-primary/30";
  return "text-on-surface-faint bg-on-surface-faint/10 border-outline";
}

function tierLabel(tier: string) {
  return tier === "Platino" ? "Platinum" : tier === "Confirmado" ? "Gratuita" : tier;
}

export default function CheckinPage() {
  const router = useRouter();
  const { mode, toggleMode } = useThemeMode();
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Inscrito[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [searched, setSearched] = useState(false);

  const [resumen, setResumen] = useState<ResumenTier[]>([]);
  const [invitadosVip, setInvitadosVip] = useState(0);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: "", email: "", phone: "", notes: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const [guestOpenId, setGuestOpenId] = useState<number | null>(null);
  const [guestForm, setGuestForm] = useState<GuestForm>({ name: "", phone: "", email: "" });
  const [guestSaving, setGuestSaving] = useState(false);
  const [guestByLead, setGuestByLead] = useState<Record<number, Guest>>({});

  const [vipMarkingId, setVipMarkingId] = useState<number | null>(null);

  const [ponenteFormOpen, setPonenteFormOpen] = useState(false);
  const [ponenteForm, setPonenteForm] = useState<PonenteForm>({ name: "", phone: "", email: "", pais: "" });
  const [ponenteSaving, setPonenteSaving] = useState(false);

  async function cargarResumen() {
    try {
      const res = await fetch("/api/evento/checkin-resumen", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        const filas: ResumenTier[] = data.resumen ?? [];
        const invitados = filas.find((r) => r.tier === "__invitados_vip__");
        setResumen(filas.filter((r) => r.tier !== "__invitados_vip__"));
        setInvitadosVip(invitados ? Number(invitados.total) : 0);
      }
    } catch {
      // el resumen es informativo — si falla, no bloquea el resto de la pantalla
    }
  }

  useEffect(() => {
    cargarResumen();
    const interval = setInterval(cargarResumen, 4000);
    return () => clearInterval(interval);
  }, []);

  function limpiarBusqueda() {
    setQuery("");
    setResultados([]);
    setSearched(false);
    setError(null);
    setEditingId(null);
    setGuestOpenId(null);
    setPonenteFormOpen(false);
  }

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    setEditingId(null);
    try {
      const res = await fetch(`/api/evento/buscar?q=${encodeURIComponent(query.trim())}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No pudimos hacer la búsqueda. Intenta de nuevo.");
        setResultados([]);
        return;
      }
      setResultados(data.inscritos ?? []);
    } catch {
      setError("No pudimos conectar. Revisa tu internet e intenta de nuevo.");
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
      cargarResumen();
    } finally {
      setBusyId(null);
    }
  }

  async function deshacerCheckin(leadId: number) {
    if (!confirm("¿Deshacer el check-in de esta persona?")) return;
    setBusyId(leadId);
    try {
      const res = await fetch("/api/evento/checkin-deshacer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No se pudo deshacer el check-in");
        return;
      }
      setResultados((prev) => prev.map((r) => (r.lead_id === leadId ? { ...r, checked_in: false } : r)));
      cargarResumen();
    } finally {
      setBusyId(null);
    }
  }

  async function abrirEdicion(leadId: number) {
    setEditingId(leadId);
    setEditLoading(true);
    try {
      const res = await fetch(`/api/evento/lead-detalle?lead_id=${leadId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No se pudo cargar el inscrito");
        setEditingId(null);
        return;
      }
      const lead = data.lead ?? {};
      setEditForm({
        name: lead.name ?? "",
        email: lead.email ?? "",
        phone: lead.phone ?? "",
        notes: lead.notes ?? "",
      });
    } finally {
      setEditLoading(false);
    }
  }

  function cancelarEdicion() {
    setEditingId(null);
  }

  async function guardarEdicion(leadId: number) {
    setEditSaving(true);
    try {
      const res = await fetch("/api/evento/lead-actualizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId, ...editForm }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No se pudo guardar");
        return;
      }
      setResultados((prev) =>
        prev.map((r) => (r.lead_id === leadId ? { ...r, name: editForm.name, email: editForm.email, phone: editForm.phone } : r))
      );
      setEditingId(null);
    } finally {
      setEditSaving(false);
    }
  }

  function abrirInvitado(leadId: number) {
    setGuestForm({ name: "", phone: "", email: "" });
    setGuestOpenId(leadId);
  }

  function cancelarInvitado() {
    setGuestOpenId(null);
  }

  async function guardarInvitado(leadId: number) {
    if (!guestForm.name.trim()) return;
    setGuestSaving(true);
    try {
      const res = await fetch("/api/evento/invitado-guardar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId, ...guestForm }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No se pudo guardar el invitado");
        return;
      }
      setGuestByLead((prev) => ({ ...prev, [leadId]: { ...guestForm } }));
      setGuestOpenId(null);
      cargarResumen();
    } finally {
      setGuestSaving(false);
    }
  }

  async function marcarVip(leadId: number, nombre: string | null) {
    if (!confirm(`¿Seguro que quieres marcar a "${nombre || "esta persona"}" como VIP?`)) return;
    setVipMarkingId(leadId);
    try {
      const res = await fetch("/api/evento/marcar-vip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No se pudo marcar como VIP");
        return;
      }
      setResultados((prev) => prev.map((r) => (r.lead_id === leadId ? { ...r, tier: "VIP" } : r)));
      cargarResumen();
    } finally {
      setVipMarkingId(null);
    }
  }

  async function quitarVip(leadId: number, nombre: string | null) {
    if (!confirm(`¿Quitarle el VIP a "${nombre || "esta persona"}"? Volverá al tier gratuito.`)) return;
    setVipMarkingId(leadId);
    try {
      const res = await fetch("/api/evento/quitar-vip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No se pudo quitar el VIP");
        return;
      }
      setResultados((prev) => prev.map((r) => (r.lead_id === leadId ? { ...r, tier: "General (gratis)" } : r)));
      cargarResumen();
    } finally {
      setVipMarkingId(null);
    }
  }

  async function registrarPonente(e: React.FormEvent) {
    e.preventDefault();
    if (!ponenteForm.name.trim() || !ponenteForm.pais.trim()) return;
    setPonenteSaving(true);
    try {
      const res = await fetch("/api/evento/registrar-invitado-ponente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ponenteForm),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No se pudo registrar el invitado");
        return;
      }
      const lead = data.lead ?? {};
      const nuevo: Inscrito = {
        lead_id: lead.lead_id,
        name: lead.name ?? ponenteForm.name,
        email: lead.email ?? ponenteForm.email,
        phone: lead.phone ?? ponenteForm.phone,
        country: lead.country ?? ponenteForm.pais,
        campaign_name: "Invitados de Ponentes",
        tier: "VIP",
        checked_in: false,
      };
      setResultados((prev) => [nuevo, ...prev]);
      setSearched(true);
      setPonenteForm({ name: "", phone: "", email: "", pais: "" });
      setPonenteFormOpen(false);
      cargarResumen();
    } finally {
      setPonenteSaving(false);
    }
  }

  const totalGeneral = resumen.reduce((acc, r) => acc + Number(r.total), 0);
  const checkedInGeneral = resumen.reduce((acc, r) => acc + Number(r.checked_in), 0);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex justify-end items-center gap-2 px-4 pt-4">
        <ThemeModeToggle mode={mode} onToggle={toggleMode} />
        <button
          onClick={handleLogout}
          className="text-xs text-on-surface-variant hover:text-on-surface border border-outline rounded-full px-3 py-1.5 transition"
        >
          Salir
        </button>
      </div>
      <div className="w-full max-w-lg mx-auto px-4 pb-8">
        <div className="flex flex-col items-center gap-1 mb-6 text-center">
          <span className="text-[11px] uppercase tracking-[0.14em] text-primary font-mono">The Trading Experience</span>
          <h1 className="font-display text-2xl text-on-surface font-semibold">Check-in del evento</h1>
          <p className="text-sm text-on-surface-faint">Busca al inscrito por nombre, correo o teléfono y confirma su entrada.</p>
        </div>

        {resumen.length > 0 && (
          <div className="rounded-lg border border-outline bg-surface p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs uppercase tracking-[0.08em] text-on-surface-faint">En vivo · personas en el evento ahora</span>
              </div>
              <span className="text-2xl font-bold text-on-surface tabular-nums">{checkedInGeneral + invitadosVip}</span>
            </div>
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-outline">
              <span className="text-xs uppercase tracking-[0.08em] text-on-surface-faint">Entradas confirmadas</span>
              <span className="text-sm font-semibold text-on-surface tabular-nums">
                {checkedInGeneral} / {totalGeneral}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {resumen.map((r) => {
                const total = Number(r.total);
                const checkedIn = Number(r.checked_in);
                const pct = total > 0 ? (checkedIn / total) * 100 : 0;
                return (
                  <div key={r.tier} className="flex items-center gap-3">
                    <span className="text-xs text-on-surface-variant w-24 shrink-0 truncate">{tierLabel(r.tier)}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-on-surface-faint/10 overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-on-surface-faint tabular-nums w-14 text-right shrink-0">
                      {checkedIn}/{total}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-outline">
              <span className="text-xs text-violet-300">Invitados VIP</span>
              <span className="text-sm font-semibold text-violet-300 tabular-nums">{invitadosVip}</span>
            </div>
          </div>
        )}

        <form onSubmit={buscar} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre, correo o teléfono"
              autoFocus
              className="w-full bg-surface border border-outline rounded-md px-3 py-3 pr-9 text-base text-on-surface focus:border-primary outline-none"
            />
            {(query || searched) && (
              <button
                type="button"
                onClick={limpiarBusqueda}
                aria-label="Borrar búsqueda"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-faint hover:text-on-surface text-lg leading-none px-1"
              >
                ×
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-primary text-on-primary font-semibold rounded-md px-5 py-3 text-sm disabled:opacity-50"
          >
            {loading ? "Buscando…" : "Buscar"}
          </button>
        </form>

        {error && <p className="text-sm text-error mb-4">{error}</p>}

        {searched && !loading && !error && resultados.length === 0 && (
          <div className="text-center mb-4">
            <p className="text-sm text-on-surface-faint mb-3">No se encontró ningún inscrito con ese dato.</p>
            {!ponenteFormOpen ? (
              <button
                onClick={() => {
                  setPonenteForm({ name: query, phone: "", email: "", pais: "" });
                  setPonenteFormOpen(true);
                }}
                className="text-xs text-violet-300 hover:text-violet-200 underline"
              >
                + Registrar invitado de ponente (VIP)
              </button>
            ) : null}
          </div>
        )}

        {!searched && (
          <div className="text-center mb-4">
            <button
              onClick={() => {
                setPonenteForm({ name: "", phone: "", email: "", pais: "" });
                setPonenteFormOpen((v) => !v);
              }}
              className="text-xs text-violet-300 hover:text-violet-200 underline"
            >
              {ponenteFormOpen ? "Cerrar" : "+ Registrar invitado de ponente (VIP)"}
            </button>
          </div>
        )}

        {ponenteFormOpen && (
          <form onSubmit={registrarPonente} className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 mb-6 flex flex-col gap-3">
            <p className="text-[11px] text-on-surface-faint">
              Invitado de un ponente — entra sin pagar, se registra directo como VIP y ocupa cupo VIP.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.06em] text-on-surface-faint">Nombre</span>
                <input
                  value={ponenteForm.name}
                  onChange={(e) => setPonenteForm((f) => ({ ...f, name: e.target.value }))}
                  autoFocus
                  className="bg-background border border-outline rounded-md px-3 py-2 text-sm text-on-surface focus:border-primary outline-none"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.06em] text-on-surface-faint">Teléfono</span>
                <input
                  value={ponenteForm.phone}
                  onChange={(e) => setPonenteForm((f) => ({ ...f, phone: e.target.value }))}
                  className="bg-background border border-outline rounded-md px-3 py-2 text-sm text-on-surface focus:border-primary outline-none"
                />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.06em] text-on-surface-faint">Correo</span>
                <input
                  value={ponenteForm.email}
                  onChange={(e) => setPonenteForm((f) => ({ ...f, email: e.target.value }))}
                  className="bg-background border border-outline rounded-md px-3 py-2 text-sm text-on-surface focus:border-primary outline-none"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.06em] text-on-surface-faint">País *</span>
                <input
                  value={ponenteForm.pais}
                  onChange={(e) => setPonenteForm((f) => ({ ...f, pais: e.target.value }))}
                  placeholder="Ej. Colombia"
                  required
                  className="bg-background border border-outline rounded-md px-3 py-2 text-sm text-on-surface focus:border-primary outline-none"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPonenteFormOpen(false)} className="text-xs text-on-surface-faint hover:text-on-surface px-3 py-2">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={ponenteSaving || !ponenteForm.name.trim() || !ponenteForm.pais.trim()}
                className="bg-violet-500 text-white font-semibold rounded-md px-4 py-2 text-xs disabled:opacity-50"
              >
                {ponenteSaving ? "Registrando…" : "Registrar como VIP"}
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-col gap-3">
          {resultados.map((r) => (
            <div key={r.lead_id} className="rounded-lg border border-outline bg-surface p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-on-surface font-medium truncate">{r.name || "(sin nombre)"}</p>
                    <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-[0.06em] rounded-full px-2 py-0.5 border whitespace-nowrap ${tierBadgeClass(r.tier)}`}>
                      {tierLabel(r.tier)}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-faint truncate">{r.email}</p>
                  {r.phone && <p className="text-xs text-on-surface-faint truncate">{r.phone}</p>}
                  <p className="text-[11px] uppercase tracking-[0.08em] text-on-surface-variant mt-1">{r.campaign_name}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {r.checked_in ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1.5 whitespace-nowrap">
                        ✓ Ya ingresó
                      </span>
                      <button
                        onClick={() => deshacerCheckin(r.lead_id)}
                        disabled={busyId === r.lead_id}
                        className="text-xs text-on-surface-faint hover:text-error underline disabled:opacity-50"
                      >
                        Deshacer
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => marcarCheckin(r.lead_id)}
                      disabled={busyId === r.lead_id}
                      className="bg-primary text-on-primary font-semibold rounded-md px-4 py-2.5 text-sm disabled:opacity-50 whitespace-nowrap"
                    >
                      {busyId === r.lead_id ? "Marcando…" : "Marcar check-in"}
                    </button>
                  )}
                  <button
                    onClick={() => (editingId === r.lead_id ? cancelarEdicion() : abrirEdicion(r.lead_id))}
                    className="text-xs text-on-surface-faint hover:text-on-surface underline"
                  >
                    {editingId === r.lead_id ? "Cerrar" : "Editar"}
                  </button>
                  {r.tier !== "VIP" ? (
                    <button
                      onClick={() => marcarVip(r.lead_id, r.name)}
                      disabled={vipMarkingId === r.lead_id}
                      className="text-xs text-violet-300 hover:text-violet-200 underline whitespace-nowrap disabled:opacity-50"
                    >
                      {vipMarkingId === r.lead_id ? "Marcando…" : "Marcar como VIP"}
                    </button>
                  ) : (
                    <button
                      onClick={() => quitarVip(r.lead_id, r.name)}
                      disabled={vipMarkingId === r.lead_id}
                      className="text-xs text-on-surface-faint hover:text-error underline whitespace-nowrap disabled:opacity-50"
                    >
                      {vipMarkingId === r.lead_id ? "Quitando…" : "Quitar VIP"}
                    </button>
                  )}
                  {r.tier === "VIP" &&
                    (guestByLead[r.lead_id] ? (
                      <span className="text-[11px] text-on-surface-faint whitespace-nowrap">+1 {guestByLead[r.lead_id].name}</span>
                    ) : (
                      <button
                        onClick={() => (guestOpenId === r.lead_id ? cancelarInvitado() : abrirInvitado(r.lead_id))}
                        className="text-xs text-violet-300 hover:text-violet-200 underline whitespace-nowrap"
                      >
                        {guestOpenId === r.lead_id ? "Cerrar" : "+ Agregar invitado"}
                      </button>
                    ))}
                </div>
              </div>

              {guestOpenId === r.lead_id && (
                <div className="mt-4 pt-4 border-t border-outline flex flex-col gap-3">
                  <p className="text-[11px] text-on-surface-faint">Como entrada VIP, puede traer un invitado. Registra sus datos.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-[0.06em] text-on-surface-faint">Nombre del invitado</span>
                      <input
                        value={guestForm.name}
                        onChange={(e) => setGuestForm((f) => ({ ...f, name: e.target.value }))}
                        className="bg-background border border-outline rounded-md px-3 py-2 text-sm text-on-surface focus:border-primary outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-[0.06em] text-on-surface-faint">Teléfono</span>
                      <input
                        value={guestForm.phone}
                        onChange={(e) => setGuestForm((f) => ({ ...f, phone: e.target.value }))}
                        className="bg-background border border-outline rounded-md px-3 py-2 text-sm text-on-surface focus:border-primary outline-none"
                      />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-[0.06em] text-on-surface-faint">Correo</span>
                    <input
                      value={guestForm.email}
                      onChange={(e) => setGuestForm((f) => ({ ...f, email: e.target.value }))}
                      className="bg-background border border-outline rounded-md px-3 py-2 text-sm text-on-surface focus:border-primary outline-none"
                    />
                  </label>
                  <div className="flex justify-end gap-2">
                    <button onClick={cancelarInvitado} className="text-xs text-on-surface-faint hover:text-on-surface px-3 py-2">
                      Cancelar
                    </button>
                    <button
                      onClick={() => guardarInvitado(r.lead_id)}
                      disabled={guestSaving || !guestForm.name.trim()}
                      className="bg-primary text-on-primary font-semibold rounded-md px-4 py-2 text-xs disabled:opacity-50"
                    >
                      {guestSaving ? "Guardando…" : "Guardar invitado"}
                    </button>
                  </div>
                </div>
              )}

              {editingId === r.lead_id && (
                <div className="mt-4 pt-4 border-t border-outline flex flex-col gap-3">
                  {editLoading ? (
                    <p className="text-xs text-on-surface-faint">Cargando datos…</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase tracking-[0.06em] text-on-surface-faint">Nombre</span>
                          <input
                            value={editForm.name}
                            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                            className="bg-background border border-outline rounded-md px-3 py-2 text-sm text-on-surface focus:border-primary outline-none"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase tracking-[0.06em] text-on-surface-faint">Teléfono</span>
                          <input
                            value={editForm.phone}
                            onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                            className="bg-background border border-outline rounded-md px-3 py-2 text-sm text-on-surface focus:border-primary outline-none"
                          />
                        </label>
                      </div>
                      <label className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-[0.06em] text-on-surface-faint">Correo</span>
                        <input
                          value={editForm.email}
                          onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                          className="bg-background border border-outline rounded-md px-3 py-2 text-sm text-on-surface focus:border-primary outline-none"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-[0.06em] text-on-surface-faint">Notas del equipo de acceso</span>
                        <textarea
                          value={editForm.notes}
                          onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                          placeholder="Ej. llegó sin cédula, cambio de nombre autorizado…"
                          rows={2}
                          className="bg-background border border-outline rounded-md px-3 py-2 text-sm text-on-surface focus:border-primary outline-none resize-none"
                        />
                      </label>
                      <div className="flex justify-end gap-2">
                        <button onClick={cancelarEdicion} className="text-xs text-on-surface-faint hover:text-on-surface px-3 py-2">
                          Cancelar
                        </button>
                        <button
                          onClick={() => guardarEdicion(r.lead_id)}
                          disabled={editSaving}
                          className="bg-primary text-on-primary font-semibold rounded-md px-4 py-2 text-xs disabled:opacity-50"
                        >
                          {editSaving ? "Guardando…" : "Guardar"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
