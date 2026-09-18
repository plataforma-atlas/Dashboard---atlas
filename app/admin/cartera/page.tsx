"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useThemeMode } from "@/components/ThemeModeProvider";
import AppSidebar from "@/components/AppSidebar";
import CarteraGrid from "@/components/webinar-os/cartera/CarteraGrid";
import { CarteraCliente } from "@/lib/webinar-os/cartera";

export default function AdminCarteraPage() {
  const router = useRouter();
  const { mode, toggleMode } = useThemeMode();
  const [cartera, setCartera] = useState<CarteraCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/webinar-os/cartera", { cache: "no-store" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setError(data.error || "No se pudo cargar la cartera");
          return;
        }
        setCartera(data.cartera ?? []);
      })
      .catch(() => setError("No se pudo conectar al servidor"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="webinar-os-scope min-h-screen flex flex-col md:flex-row bg-[var(--wos-surface-alt)]" data-wos-theme={mode}>
      <AppSidebar active="cartera" isAdmin mode={mode} onToggleMode={toggleMode} onLogout={handleLogout} />
      <main className="min-h-screen px-4 py-8 md:px-8 md:ml-[var(--sidebar-w,240px)] max-w-7xl flex flex-col gap-6 transition-[margin] duration-200">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.14em] text-[var(--wos-primary)] font-mono">Webinar Control Center</span>
          <h1 className="font-display text-2xl text-[var(--wos-ink)] font-semibold">Cartera de clientes</h1>
          <p className="text-[15px] text-[var(--wos-ink-muted)]">Webinar automático — quién necesita atención, quién puede escalar.</p>
        </div>
      </header>

      {error && <div className="rounded-lg border border-outline-error bg-error-container px-4 py-3 text-sm text-error">{error}</div>}

      {loading ? (
        <p className="text-[15px] text-[var(--wos-ink-faint)]">Cargando cartera…</p>
      ) : (
        <div className="animate-fade-in-up">
          <CarteraGrid cartera={cartera} />
        </div>
      )}
    </main>
    </div>
  );
}
