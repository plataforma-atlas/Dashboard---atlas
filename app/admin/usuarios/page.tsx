"use client";

import { useRouter } from "next/navigation";
import { useThemeMode } from "@/components/ThemeModeProvider";
import AppSidebar from "@/components/AppSidebar";
import UsuariosAdminPanel from "@/components/v3/UsuariosAdminPanel";

// Versión vieja, se conserva como respaldo. La gestión de usuarios vive en la V3 (/v3/usuarios).
export default function AdminUsuariosPage() {
  const router = useRouter();
  const { mode, toggleMode } = useThemeMode();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
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
        <UsuariosAdminPanel />
      </main>
    </div>
  );
}
