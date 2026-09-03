"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useThemeMode } from "@/components/ThemeModeProvider";
import ThemeModeToggle from "@/components/ThemeModeToggle";

type Usuario = {
  id: number;
  email: string;
  name: string;
  role: "admin" | "client";
  created_at: string;
  clientes: string[];
};

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

  async function cambiarRol(userId: number, role: "admin" | "client") {
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
    <main className="min-h-screen px-4 py-8 md:px-8 max-w-5xl mx-auto flex flex-col gap-6 bg-background">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.14em] text-primary font-mono">Panel de Administración</span>
          <h1 className="font-display text-2xl text-on-surface font-semibold">Usuarios</h1>
          <p className="text-sm text-on-surface-variant">Cambia roles y asigna qué clientes puede ver cada usuario.</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeModeToggle mode={mode} onToggle={toggleMode} />
          <a href="/admin/clientes" className="text-xs text-on-surface-variant hover:text-on-surface border border-outline rounded-full px-3 py-1.5 transition">
            Clientes →
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

      {loading ? (
        <p className="text-sm text-on-surface-variant">Cargando usuarios…</p>
      ) : (
        <div className="rounded-lg border border-outline bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline text-left text-[11px] uppercase tracking-[0.1em] text-on-surface-faint">
                <th className="px-4 py-3 font-medium">Usuario</th>
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
                      <div className="text-on-surface-variant text-xs">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        disabled={isBusy}
                        onChange={(e) => cambiarRol(u.id, e.target.value as "admin" | "client")}
                        className="bg-background border border-outline rounded-md px-2 py-1.5 text-sm text-on-surface focus:border-primary outline-none disabled:opacity-50"
                      >
                        <option value="client">client</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {u.role === "admin" ? (
                        <span className="text-xs text-on-surface-faint">Ve todos los clientes (es admin)</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {clientesDisponibles.map((c) => {
                            const tieneAcceso = u.clientes.includes(c.id);
                            return (
                              <button
                                key={c.id}
                                disabled={isBusy}
                                onClick={() => toggleCliente(u.id, c.id, tieneAcceso)}
                                className={`text-xs px-2.5 py-1 rounded-full border transition disabled:opacity-50 ${
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
                        className="text-xs text-error border border-outline-error rounded-full px-3 py-1.5 hover:bg-error-container transition disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-on-surface-variant text-sm">
                    No hay usuarios registrados todavía.
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
