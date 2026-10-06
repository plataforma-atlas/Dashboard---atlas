"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Mail, Trash2, UserPlus } from "lucide-react";
import VermetricasLoader from "@/components/VermetricasLoader";

type Miembro = { id: number; email: string; name: string; role: string; created_at: string };

export default function V3EquipoPage() {
  const params = useParams<{ clienteId: string }>();
  const clienteId = params.clienteId;

  const [clienteNombre, setClienteNombre] = useState(clienteId);
  const [miUserId, setMiUserId] = useState<number | null>(null);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [invitando, setInvitando] = useState(false);
  const [invitarError, setInvitarError] = useState<string | null>(null);
  const [invitarOk, setInvitarOk] = useState<string | null>(null);

  const [quitandoId, setQuitandoId] = useState<number | null>(null);

  async function cargarMiembros() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v3/equipo?cliente_id=${encodeURIComponent(clienteId)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo cargar el equipo");
        return;
      }
      setMiembros(Array.isArray(data.miembros) ? data.miembros : []);
    } catch {
      setError("No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarMiembros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setMiUserId(typeof data?.user_id === "number" ? data.user_id : null))
      .catch(() => setMiUserId(null));
    fetch("/api/clientes", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const c = (data.clientes ?? []).find((x: { id: string; name: string }) => x.id === clienteId);
        if (c?.name) setClienteNombre(c.name);
      })
      .catch(() => {});
  }, [clienteId]);

  async function invitar(e: React.FormEvent) {
    e.preventDefault();
    setInvitarError(null);
    setInvitarOk(null);
    if (!email.trim()) {
      setInvitarError("Escribí el correo de la persona a invitar.");
      return;
    }
    setInvitando(true);
    try {
      const res = await fetch("/api/v3/equipo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, cliente_nombre: clienteNombre, email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInvitarError(data.error || "No se pudo enviar la invitación");
        return;
      }
      setInvitarOk(`Invitación enviada a ${email.trim()}.`);
      setEmail("");
    } catch {
      setInvitarError("No se pudo conectar al servidor");
    } finally {
      setInvitando(false);
    }
  }

  async function quitar(userId: number) {
    setQuitandoId(userId);
    try {
      const res = await fetch("/api/v3/equipo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo quitar el acceso");
        return;
      }
      await cargarMiembros();
    } catch {
      setError("No se pudo conectar al servidor");
    } finally {
      setQuitandoId(null);
    }
  }

  return (
    <div className="px-4 py-8 md:px-8 max-w-3xl mx-auto flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-[0.14em] text-primary font-mono">Equipo</span>
        <h1 className="font-display text-2xl text-on-surface font-semibold">Quién tiene acceso</h1>
        <p className="text-sm text-on-surface-variant">
          Invitá a alguien de tu equipo por correo — va a tener exactamente el mismo acceso que vos a este dashboard.
        </p>
      </header>

      <form onSubmit={invitar} className="rounded-lg border border-outline bg-surface p-4 flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Correo de la persona a invitar</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nombre@empresa.com"
            className="bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface focus:border-primary outline-none transition-colors duration-150"
          />
        </div>
        <button
          type="submit"
          disabled={invitando}
          className="press flex items-center gap-1.5 rounded-md bg-primary text-on-primary text-[14px] font-medium px-4 py-2.5 disabled:opacity-50 shrink-0 transition-transform duration-150"
        >
          <UserPlus size={14} /> {invitando ? "Enviando…" : "Invitar"}
        </button>
      </form>
      {invitarError && <p className="text-sm text-error">{invitarError}</p>}
      {invitarOk && (
        <p className="text-sm text-success flex items-center gap-1.5">
          <Mail size={14} /> {invitarOk}
        </p>
      )}

      {loading ? (
        <div className="min-h-[20vh] flex items-center justify-center">
          <VermetricasLoader />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-outline-error bg-error-container px-4 py-3 text-sm text-error">{error}</div>
      ) : miembros.length === 0 ? null : (
        <div className="rounded-lg border border-outline bg-surface overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-on-surface-faint uppercase tracking-[0.08em] text-[11px] border-b border-outline">
                <th className="px-4 py-2.5 font-medium">Nombre</th>
                <th className="px-4 py-2.5 font-medium">Correo</th>
                <th className="px-4 py-2.5 font-medium">Desde</th>
                <th className="px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {miembros.map((m) => {
                const esYo = m.id === miUserId;
                return (
                  <tr key={m.id} className="border-b border-outline last:border-0">
                    <td className="px-4 py-2.5 text-on-surface">
                      <div className="flex items-center gap-2">
                        <span>{m.name || "—"}</span>
                        {esYo && (
                          <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border border-outline text-on-surface-faint shrink-0">
                            Vos
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-on-surface-variant">{m.email}</td>
                    <td className="px-4 py-2.5 text-on-surface-faint">{new Date(m.created_at).toLocaleDateString("es-CO")}</td>
                    <td className="px-4 py-2.5">
                      {!esYo && (
                        <button
                          type="button"
                          onClick={() => quitar(m.id)}
                          disabled={quitandoId === m.id}
                          title="Quitar acceso"
                          className="press text-on-surface-faint hover:text-error disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
