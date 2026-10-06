"use client";

import UsuariosAdminPanel from "@/components/v3/UsuariosAdminPanel";

export default function V3UsuariosPage() {
  return (
    <div className="px-4 py-8 md:px-8 max-w-5xl mx-auto flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-[0.14em] text-primary font-mono">Administración</span>
        <h1 className="font-display text-2xl text-on-surface font-semibold">Usuarios</h1>
        <p className="text-sm text-on-surface-variant">Creá usuarios, cambiá su acceso y sus correos.</p>
      </header>
      <UsuariosAdminPanel />
    </div>
  );
}
