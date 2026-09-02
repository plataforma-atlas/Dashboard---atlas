"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useThemeMode } from "@/components/ThemeModeProvider";
import ThemeModeToggle from "@/components/ThemeModeToggle";
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
    <main className="webinar-os-scope min-h-screen px-4 py-8 md:px-8 max-w-7xl mx-auto flex flex-col gap-6 bg-[var(--wos-surface-alt)]" data-wos-theme={mode}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--wos-primary)] font-mono">Webinar Control Center</span>
          <h1 className="font-display text-2xl text-[var(--wos-ink)] font-semibold">Cartera de clientes</h1>
          <p className="text-sm text-[var(--wos-ink-muted)]">Webinar automático — quién necesita atención, quién puede escalar.</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeModeToggle mode={mode} onToggle={toggleMode} />
          <a href="/" className="text-xs text-[var(--wos-ink-muted)] hover:text-[var(--wos-ink)] border border-[var(--wos-border)] rounded-full px-3 py-1.5 transition">
            ← Volver al dashboard
          </a>
          <button onClick={handleLogout} className="text-xs text-[var(--wos-ink-muted)] hover:text-[var(--wos-ink)] border border-[var(--wos-border)] rounded-full px-3 py-1.5 transition">
            Salir
          </button>
        </div>
      </header>

      {error && <div className="rounded-lg border border-outline-error bg-error-container px-4 py-3 text-sm text-error">{error}</div>}

      {loading ? (
        <p className="text-sm text-[var(--wos-ink-faint)]">Cargando cartera…</p>
      ) : (
        <CarteraGrid cartera={cartera} />
      )}
    </main>
  );
}
