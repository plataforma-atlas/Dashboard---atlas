"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useThemeMode } from "@/components/ThemeModeProvider";
import ThemeModeToggle from "@/components/ThemeModeToggle";

const ESTRATEGIAS: { id: string; label: string }[] = [
  { id: "lanzamiento", label: "Lanzamiento" },
  { id: "webinar_automatizado", label: "Webinar Automático" },
  { id: "vsl", label: "VSL" },
  { id: "evento_presencial", label: "Evento Presencial" },
];

type Cliente = { id: string; name: string; status: "active" | "archived" };

export default function AdminClientesPage() {
  const router = useRouter();
  const { mode, toggleMode } = useThemeMode();
  const [vista, setVista] = useState<"active" | "archived">("active");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [estrategias, setEstrategias] = useState<string[]>([]);
  const [creando, setCreando] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [invitandoId, setInvitandoId] = useState<string | null>(null);
  const [linkInvitacion, setLinkInvitacion] = useState<{ clienteId: string; url: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function cargar() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/clientes?estado=${vista}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo cargar la lista");
        return;
      }
      setClientes(data.clientes ?? []);
    } catch {
      setError("No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista]);

  async function cambiarEstado(id: string, nuevoEstado: "active" | "archived") {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/estado-cliente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, estado: nuevoEstado }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No se pudo actualizar el cliente");
        return;
      }
      await cargar();
    } finally {
      setBusyId(null);
    }
  }

  async function generarInvitacion(c: Cliente) {
    setInvitandoId(c.id);
    setLinkInvitacion(null);
    setCopiado(false);
    try {
      const res = await fetch("/api/admin/generar-invitacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: c.id, cliente_nombre: c.name }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No se pudo generar la invitación");
        return;
      }
      setLinkInvitacion({ clienteId: c.id, url: data.url });
    } finally {
      setInvitandoId(null);
    }
  }

  async function copiarLink() {
    if (!linkInvitacion) return;
    try {
      await navigator.clipboard.writeText(linkInvitacion.url);
      setCopiado(true);
    } catch {
      // el navegador puede bloquear el portapapeles; el link se queda visible para copiar a mano
    }
  }

  function toggleEstrategia(id: string) {
    setEstrategias((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));
  }

  async function crearCliente(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!nombre.trim()) {
      setFormError("Ponle un nombre al cliente.");
      return;
    }
    if (estrategias.length === 0) {
      setFormError("Elige al menos una estrategia.");
      return;
    }
    setCreando(true);
    try {
      const res = await fetch("/api/admin/crear-cliente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nombre.trim(), strategies: estrategias }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "No se pudo crear el cliente");
        return;
      }
      setNombre("");
      setEstrategias([]);
      setShowForm(false);
      await cargar();
    } catch {
      setFormError("No se pudo conectar al servidor");
    } finally {
      setCreando(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 md:px-8 max-w-5xl mx-auto flex flex-col gap-6 bg-background">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.14em] text-primary font-mono">Panel de Administración</span>
          <h1 className="font-display text-2xl text-on-surface font-semibold">Clientes</h1>
          <p className="text-sm text-on-surface-variant">
            Crea clientes nuevos con sus campañas iniciales, o desactívalos sin borrar sus datos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeModeToggle mode={mode} onToggle={toggleMode} />
          <a href="/admin/usuarios" className="text-xs text-on-surface-variant hover:text-on-surface border border-outline rounded-full px-3 py-1.5 transition">
            ← Usuarios
          </a>
          <a href="/" className="text-xs text-on-surface-variant hover:text-on-surface border border-outline rounded-full px-3 py-1.5 transition">
            ← Volver al dashboard
          </a>
          <button onClick={handleLogout} className="text-xs text-on-surface-variant hover:text-on-surface border border-outline rounded-full px-3 py-1.5 transition">
            Salir
          </button>
        </div>
      </header>

      {error && <div className="rounded-lg border border-outline-error bg-error-container px-4 py-3 text-sm text-error">{error}</div>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-on-primary font-semibold rounded-md px-4 py-2.5 text-sm"
          >
            + Nuevo cliente
          </button>
        )}
        <div className="flex items-center gap-1.5 rounded-full border border-outline bg-surface p-1 ml-auto">
          {(["active", "archived"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition ${
                vista === v ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {v === "active" ? "Activos" : "Archivados"}
            </button>
          ))}
        </div>
      </div>

      {showForm && (
        <form onSubmit={crearCliente} className="rounded-lg border border-outline bg-surface p-5 flex flex-col gap-4 max-w-md">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-[0.1em] text-on-surface-faint">Nombre del cliente</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Juan Pérez"
              autoFocus
              className="bg-background border border-outline rounded-md px-3 py-2 text-sm text-on-surface focus:border-primary outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-[0.1em] text-on-surface-faint">Estrategias que va a usar</label>
            <div className="flex flex-wrap gap-2">
              {ESTRATEGIAS.map((s) => {
                const activa = estrategias.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleEstrategia(s.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition ${
                      activa ? "bg-primary text-on-primary border-primary" : "border-outline text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {formError && <p className="text-sm text-error">{formError}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={creando}
              className="bg-primary text-on-primary font-semibold rounded-md px-4 py-2.5 text-sm disabled:opacity-50"
            >
              {creando ? "Creando…" : "Crear cliente"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFormError(null);
              }}
              className="text-sm text-on-surface-variant hover:text-on-surface"
            >
              Cancelar
            </button>
          </div>
          <p className="text-xs text-on-surface-faint">
            El tema visual queda genérico por defecto. La conexión con el formulario real de captación (GHL, landing page, etc.) se
            construye aparte una vez definan de dónde van a llegar los leads.
          </p>
        </form>
      )}

      {linkInvitacion && (
        <div className="rounded-lg border border-primary bg-surface p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-on-surface">
              Link de invitación para <span className="font-mono text-primary">{linkInvitacion.clienteId}</span>
            </span>
            <button onClick={() => setLinkInvitacion(null)} className="text-xs text-on-surface-variant hover:text-on-surface">
              Cerrar
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={linkInvitacion.url}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 bg-background border border-outline rounded-md px-3 py-2 text-xs font-mono text-on-surface-variant outline-none"
            />
            <button
              onClick={copiarLink}
              className="text-xs px-3 py-2 rounded-md bg-primary text-on-primary font-medium shrink-0"
            >
              {copiado ? "¡Copiado!" : "Copiar"}
            </button>
          </div>
          <p className="text-xs text-on-surface-faint">
            Válido por 7 días. Quien lo abra crea su cuenta y queda asignado directamente a este cliente — ya no necesitas asignarlo a mano en Usuarios.
          </p>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-on-surface-variant">Cargando clientes…</p>
      ) : (
        <div className="rounded-lg border border-outline bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline text-left text-[11px] uppercase tracking-[0.1em] text-on-surface-faint">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Identificador</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => {
                const isBusy = busyId === c.id;
                return (
                  <tr key={c.id} className="border-b border-outline/50 last:border-0">
                    <td className="px-4 py-3 text-on-surface">{c.name}</td>
                    <td className="px-4 py-3 text-on-surface-faint font-mono text-xs">{c.id}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {vista === "active" && (
                          <button
                            disabled={invitandoId === c.id}
                            onClick={() => generarInvitacion(c)}
                            className="text-xs px-3 py-1.5 rounded-full border border-primary text-primary hover:bg-primary hover:text-on-primary transition disabled:opacity-50"
                          >
                            {invitandoId === c.id ? "…" : "Invitar"}
                          </button>
                        )}
                        {vista === "active" ? (
                          <button
                            disabled={isBusy}
                            onClick={() => cambiarEstado(c.id, "archived")}
                            className="text-xs px-3 py-1.5 rounded-full border border-outline text-on-surface-variant hover:text-error hover:border-outline-error transition disabled:opacity-50"
                          >
                            {isBusy ? "…" : "Desactivar"}
                          </button>
                        ) : (
                          <button
                            disabled={isBusy}
                            onClick={() => cambiarEstado(c.id, "active")}
                            className="text-xs px-3 py-1.5 rounded-full border border-outline text-on-surface-variant hover:text-primary hover:border-primary transition disabled:opacity-50"
                          >
                            {isBusy ? "…" : "Reactivar"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {clientes.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-on-surface-variant text-sm">
                    {vista === "active" ? "No hay clientes activos todavía." : "No hay clientes archivados."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
