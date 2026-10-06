"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useThemeMode } from "@/components/ThemeModeProvider";
import AppSidebar from "@/components/AppSidebar";

type Usuario = {
  id: number;
  email: string;
  name: string;
  role: "admin" | "client" | "checkin";
  created_at: string;
  clientes: string[];
  estado_cuenta: "activa" | "pago_pendiente" | "bloqueada";
  tipo_acceso: "vitalicio" | "prueba_7" | "demo_15";
  acceso_vence_at: string | null;
  correos_extra: string[];
};

const TIPOS_ACCESO: { id: "vitalicio" | "prueba_7" | "demo_15"; label: string }[] = [
  { id: "vitalicio", label: "Vitalicio" },
  { id: "prueba_7", label: "Prueba 7 días" },
  { id: "demo_15", label: "Prueba 15 días" },
];

const ESTADOS: { id: "activa" | "pago_pendiente" | "bloqueada"; label: string }[] = [
  { id: "activa", label: "Activa" },
  { id: "pago_pendiente", label: "Pago pendiente" },
  { id: "bloqueada", label: "Bloqueada" },
];

export default function AdminUsuariosPage() {
  const router = useRouter();
  const { mode, toggleMode } = useThemeMode();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [clientesDisponibles, setClientesDisponibles] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/clientes", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setClientesDisponibles(data.clientes ?? []))
      .catch(() => setClientesDisponibles([]));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function cargar() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/usuarios", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo cargar la lista");
        return;
      }
      setUsuarios(data.usuarios ?? []);
    } catch {
      setError("No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const [nuevo, setNuevo] = useState({ nombre: "", email: "", rol: "client", tipo: "vitalicio" });
  const [creando, setCreando] = useState(false);
  const [creacionMsg, setCreacionMsg] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  async function crearUsuario(e: React.FormEvent) {
    e.preventDefault();
    setCreacionMsg(null);
    setCreando(true);
    try {
      const res = await fetch("/api/admin/usuario-nuevo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevo.nombre, email: nuevo.email, rol: nuevo.rol, tipo_acceso: nuevo.tipo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreacionMsg({ tipo: "error", texto: data.error || "No se pudo crear el usuario" });
        return;
      }
      setCreacionMsg({
        tipo: "ok",
        texto: data.email_enviado
          ? `Usuario creado. Le enviamos la contraseña temporal a ${nuevo.email}.`
          : `Usuario creado, pero no pudimos enviar el correo a ${nuevo.email}. Avisale a mano.`,
      });
      setNuevo({ nombre: "", email: "", rol: "client", tipo: "vitalicio" });
      await cargar();
    } catch {
      setCreacionMsg({ tipo: "error", texto: "No se pudo conectar al servidor" });
    } finally {
      setCreando(false);
    }
  }

  async function cambiarCuenta(userId: number, cambio: { estado_cuenta?: string; tipo_acceso?: string }) {
    setBusy(userId);
    try {
      const res = await fetch("/api/admin/cuenta-estado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, ...cambio }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No se pudo actualizar la cuenta");
        return;
      }
      await cargar();
    } finally {
      setBusy(null);
    }
  }

  const [correoNuevo, setCorreoNuevo] = useState<Record<number, string>>({});

  async function accionCorreo(userId: number, accion: "agregar" | "quitar" | "cambiar_principal", email: string) {
    if (!email.trim()) return;
    setBusy(userId);
    try {
      const res = await fetch("/api/admin/correos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, accion, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No se pudo actualizar los correos");
        return;
      }
      setCorreoNuevo((prev) => ({ ...prev, [userId]: "" }));
      await cargar();
    } finally {
      setBusy(null);
    }
  }

  async function cambiarRol(userId: number, role: "admin" | "client" | "checkin") {
    setBusy(userId);
    try {
      const res = await fetch("/api/admin/cambiar-rol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No se pudo cambiar el rol");
        return;
      }
      await cargar();
    } finally {
      setBusy(null);
    }
  }

  async function toggleCliente(userId: number, clienteId: string, tieneAcceso: boolean) {
    setBusy(userId);
    try {
      const res = await fetch("/api/admin/cliente-usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, cliente_id: clienteId, accion: tieneAcceso ? "quitar" : "asignar" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No se pudo actualizar el acceso");
        return;
      }
      await cargar();
    } finally {
      setBusy(null);
    }
  }

  async function eliminarUsuario(userId: number, email: string) {
    if (!confirm(`¿Eliminar al usuario ${email}? Esta acción no se puede deshacer.`)) return;
    setBusy(userId);
    try {
      const res = await fetch("/api/admin/eliminar-usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No se pudo eliminar el usuario");
        return;
      }
      await cargar();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <AppSidebar active="usuarios" isAdmin mode={mode} onToggleMode={toggleMode} onLogout={handleLogout} />
      <main className="min-h-screen px-4 py-8 md:px-8 md:ml-[var(--sidebar-w,240px)] max-w-5xl flex flex-col gap-6 bg-background transition-[margin] duration-200">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.14em] text-primary font-mono">Panel de Administración</span>
          <h1 className="font-display text-2xl text-on-surface font-semibold">Usuarios</h1>
          <p className="text-[15px] text-on-surface-variant">Cambia roles y asigna qué clientes puede ver cada usuario.</p>
        </div>
      </header>

      {error && <div className="rounded-lg border border-outline-error bg-error-container px-4 py-3 text-sm text-error">{error}</div>}

      <form onSubmit={crearUsuario} className="rounded-lg border border-outline bg-surface p-4 flex flex-col gap-3">
        <span className="text-[13px] font-medium text-on-surface">Nuevo usuario</span>
        <div className="grid gap-3 md:grid-cols-4">
          <input
            required
            value={nuevo.nombre}
            onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
            placeholder="Nombre (también será el nombre del cliente)"
            className="bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface focus:border-primary outline-none"
          />
          <input
            required
            type="email"
            value={nuevo.email}
            onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })}
            placeholder="correo@ejemplo.com"
            className="bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface focus:border-primary outline-none"
          />
          <select
            value={nuevo.rol}
            onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })}
            className="bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface focus:border-primary outline-none"
          >
            <option value="client">Cliente</option>
            <option value="admin">Admin</option>
            <option value="checkin">Check-in</option>
          </select>
          <select
            value={nuevo.tipo}
            onChange={(e) => setNuevo({ ...nuevo, tipo: e.target.value })}
            className="bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface focus:border-primary outline-none"
          >
            {TIPOS_ACCESO.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={creando}
            className="press bg-primary text-on-primary font-semibold rounded-md px-4 py-2.5 text-[14px] disabled:opacity-50 transition-transform duration-150"
          >
            {creando ? "Creando…" : "Crear y enviar acceso"}
          </button>
          {creacionMsg && (
            <span className={`text-[13px] ${creacionMsg.tipo === "ok" ? "text-success" : "text-error"}`}>{creacionMsg.texto}</span>
          )}
        </div>
      </form>

      {loading ? (
        <p className="text-[15px] text-on-surface-variant">Cargando usuarios…</p>
      ) : (
        <div className="animate-fade-in-up rounded-lg border border-outline bg-surface overflow-hidden">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-outline text-left text-xs uppercase tracking-[0.1em] text-on-surface-faint">
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Cuenta</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Clientes asignados</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const isBusy = busy === u.id;
                return (
                  <tr key={u.id} className="border-b border-outline/50 last:border-0 align-top">
                    <td className="px-4 py-3">
                      <div className="text-on-surface">{u.name}</div>
                      <div className="text-on-surface-variant text-[13px]">{u.email}</div>
                      {u.correos_extra.length > 0 && (
                        <div className="mt-1.5 flex flex-col gap-1">
                          {u.correos_extra.map((c) => (
                            <div key={c} className="flex flex-wrap items-center gap-2 text-[12px] text-on-surface-faint">
                              <span>también entra con {c}</span>
                              <button disabled={isBusy} onClick={() => accionCorreo(u.id, "cambiar_principal", c)} className="press underline hover:text-primary disabled:opacity-50">usar como principal</button>
                              <button disabled={isBusy} onClick={() => accionCorreo(u.id, "quitar", c)} className="press underline hover:text-error disabled:opacity-50">quitar</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="email"
                          value={correoNuevo[u.id] ?? ""}
                          onChange={(e) => setCorreoNuevo((prev) => ({ ...prev, [u.id]: e.target.value }))}
                          placeholder="agregar otro correo"
                          className="bg-background border border-outline rounded-md px-2 py-1 text-[12px] text-on-surface focus:border-primary outline-none w-44"
                        />
                        <button
                          disabled={isBusy || !(correoNuevo[u.id] ?? "").trim()}
                          onClick={() => accionCorreo(u.id, "agregar", correoNuevo[u.id] ?? "")}
                          className="press text-[12px] px-2 py-1 rounded-md border border-outline hover:border-primary text-on-surface disabled:opacity-50"
                        >
                          Agregar
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        <select
                          value={u.estado_cuenta}
                          disabled={isBusy}
                          onChange={(e) => cambiarCuenta(u.id, { estado_cuenta: e.target.value })}
                          className="bg-background border border-outline rounded-md px-2 py-1.5 text-[13px] text-on-surface focus:border-primary outline-none disabled:opacity-50"
                        >
                          {ESTADOS.map((st) => (
                            <option key={st.id} value={st.id}>{st.label}</option>
                          ))}
                        </select>
                        <select
                          value={u.tipo_acceso}
                          disabled={isBusy}
                          onChange={(e) => cambiarCuenta(u.id, { tipo_acceso: e.target.value })}
                          className="bg-background border border-outline rounded-md px-2 py-1.5 text-[13px] text-on-surface focus:border-primary outline-none disabled:opacity-50"
                        >
                          {TIPOS_ACCESO.map((t) => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                          ))}
                        </select>
                        {u.acceso_vence_at && (
                          <span className="text-[12px] text-on-surface-faint">Vence {new Date(u.acceso_vence_at).toLocaleDateString("es-CO")}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        disabled={isBusy}
                        onChange={(e) => cambiarRol(u.id, e.target.value as "admin" | "client" | "checkin")}
                        className="bg-background border border-outline rounded-md px-2 py-1.5 text-[14px] text-on-surface focus:border-primary outline-none disabled:opacity-50 transition-colors duration-150"
                      >
                        <option value="client">client</option>
                        <option value="admin">admin</option>
                        <option value="checkin">check-in</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {u.role === "admin" ? (
                        <span className="text-[13px] text-on-surface-faint">Ve todos los clientes (es admin)</span>
                      ) : u.role === "checkin" ? (
                        <span className="text-[13px] text-on-surface-faint">Solo acceso a Check-in del evento (no ve clientes)</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {clientesDisponibles.map((c) => {
                            const tieneAcceso = u.clientes.includes(c.id);
                            return (
                              <button
                                key={c.id}
                                disabled={isBusy}
                                onClick={() => toggleCliente(u.id, c.id, tieneAcceso)}
                                className={`press text-[13px] px-2.5 py-1 rounded-full border transition-colors duration-150 disabled:opacity-50 disabled:active:scale-100 ${
                                  tieneAcceso ? "bg-primary text-on-primary border-primary" : "border-outline text-on-surface-variant hover:text-on-surface"
                                }`}
                              >
                                {c.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        disabled={isBusy}
                        onClick={() => eliminarUsuario(u.id, u.email)}
                        className="press text-[13px] text-error border border-outline-error rounded-full px-3 py-1.5 hover:bg-error-container transition-colors duration-150 disabled:opacity-50 disabled:active:scale-100"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-on-surface-variant text-[14px]">
                    No hay usuarios registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
    </div>
  );
}
