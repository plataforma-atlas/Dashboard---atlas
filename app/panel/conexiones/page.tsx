"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useThemeMode } from "@/components/ThemeModeProvider";
import ThemeModeToggle from "@/components/ThemeModeToggle";

type EstadoConexion = { integration_type: string; status: string; updated_at: string; tiene_credencial: boolean };

const INTEGRACIONES: { tipo: string; label: string; descripcion: string; disponible: boolean }[] = [
  { tipo: "ghl", label: "GoHighLevel", descripcion: "Tu CRM — donde llegan tus leads y oportunidades.", disponible: true },
  { tipo: "meta_ads", label: "Meta Ads", descripcion: "Para traer el gasto e inversión de tus campañas.", disponible: false },
  { tipo: "whop", label: "Whop", descripcion: "Para sincronizar compras y membresías.", disponible: false },
  { tipo: "webinarkit", label: "WebinarKit", descripcion: "Para trackear asistencia y visualización de tus webinars.", disponible: false },
];

export default function PanelConexionesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mode, toggleMode } = useThemeMode();

  const [clienteId, setClienteId] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoConexion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formAbierto, setFormAbierto] = useState(false);
  const [locationId, setLocationId] = useState("");
  const [tokenGhl, setTokenGhl] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
      const me = meRes && meRes.ok ? await meRes.json().catch(() => null) : null;
      const fromQuery = searchParams.get("cliente_id");
      const propio = me?.clientes?.[0] ?? null;
      const id = fromQuery || propio;
      if (!id) {
        setError("Tu cuenta no tiene un cliente asignado todavía.");
        setLoading(false);
        return;
      }
      setClienteId(id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargarEstado(id: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/onboarding/estado?cliente_id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo cargar el estado de tus conexiones");
        return;
      }
      setEstado(Array.isArray(data) ? data : []);
    } catch {
      setError("No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (clienteId) cargarEstado(clienteId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  function estadoDe(tipo: string) {
    return estado.find((e) => e.integration_type === tipo && e.status === "active" && e.tiene_credencial) || null;
  }

  async function conectarGhl(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!locationId.trim()) {
      setFormError("Falta el Location ID.");
      return;
    }
    if (!tokenGhl.trim()) {
      setFormError("Falta el token de la Integración Privada de GoHighLevel.");
      return;
    }
    setGuardando(true);
    try {
      const res = await fetch("/api/onboarding/conectar-ghl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, locationId: locationId.trim(), token: tokenGhl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "No se pudo guardar la conexión");
        return;
      }
      setLocationId("");
      setTokenGhl("");
      setFormAbierto(false);
      if (clienteId) await cargarEstado(clienteId);
    } catch {
      setFormError("No se pudo conectar al servidor");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 md:px-8 max-w-3xl mx-auto flex flex-col gap-6 bg-background">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mode === "dark" ? "/brand/vermetricas-horizontal-dark.png" : "/brand/vermetricas-horizontal-light.png"}
            alt="Vermetricas"
            className="h-7 w-auto self-start mb-1"
          />
          <span className="text-[11px] uppercase tracking-[0.14em] text-primary font-mono">Onboarding</span>
          <h1 className="font-display text-2xl text-on-surface font-semibold">Tus conexiones</h1>
          <p className="text-sm text-on-surface-variant">Conecta tus cuentas para que empecemos a traer tus datos automáticamente.</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeModeToggle mode={mode} onToggle={toggleMode} />
          <a href="/" className="text-xs text-on-surface-variant hover:text-on-surface border border-outline rounded-full px-3 py-1.5 transition">
            ← Volver al dashboard
          </a>
        </div>
      </header>

      {error && <div className="rounded-lg border border-outline-error bg-error-container px-4 py-3 text-sm text-error">{error}</div>}

      {loading ? (
        <p className="text-sm text-on-surface-variant">Cargando…</p>
      ) : clienteId ? (
        <div className="flex flex-col gap-3">
          {INTEGRACIONES.map((integ) => {
            const conectada = estadoDe(integ.tipo);
            return (
              <div key={integ.tipo} className="rounded-lg border border-outline bg-surface p-5 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-on-surface">{integ.label}</span>
                  <span className="text-xs text-on-surface-variant">{integ.descripcion}</span>
                  {!integ.disponible && <span className="text-[11px] text-on-surface-faint mt-0.5">Próximamente</span>}
                </div>
                {integ.disponible ? (
                  conectada ? (
                    <span className="text-xs px-3 py-1.5 rounded-full border border-primary text-primary shrink-0">Conectado</span>
                  ) : integ.tipo === "ghl" && formAbierto ? null : (
                    <button
                      onClick={() => setFormAbierto(true)}
                      className="text-xs px-3 py-1.5 rounded-full bg-primary text-on-primary font-medium shrink-0"
                    >
                      Conectar
                    </button>
                  )
                ) : (
                  <span className="text-xs px-3 py-1.5 rounded-full border border-outline text-on-surface-faint shrink-0">No disponible</span>
                )}
              </div>
            );
          })}

          {formAbierto && (
            <form onSubmit={conectarGhl} className="rounded-lg border border-outline bg-surface p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-on-surface">Conectar GoHighLevel</span>
                <p className="text-xs text-on-surface-variant">
                  Necesitamos el <span className="font-mono">Location ID</span> de tu sub-cuenta y un token de{" "}
                  <span className="font-medium">Integración Privada</span> (Settings → Private Integrations en GHL) con permisos de
                  Contacts y Opportunities.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-[0.1em] text-on-surface-faint">Location ID</label>
                <input
                  type="text"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  placeholder="Ej. 5MJtQR1kaVBPCbgkiUJS"
                  className="bg-background border border-outline rounded-md px-3 py-2 text-sm text-on-surface font-mono focus:border-primary outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-[0.1em] text-on-surface-faint">Token de Integración Privada</label>
                <input
                  type="password"
                  value={tokenGhl}
                  onChange={(e) => setTokenGhl(e.target.value)}
                  placeholder="pit-..."
                  className="bg-background border border-outline rounded-md px-3 py-2 text-sm text-on-surface font-mono focus:border-primary outline-none"
                />
              </div>

              {formError && <p className="text-sm text-error">{formError}</p>}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-md bg-primary text-on-primary text-sm font-medium px-4 py-2.5 disabled:opacity-50"
                >
                  {guardando ? "Guardando…" : "Guardar conexión"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormAbierto(false);
                    setFormError(null);
                  }}
                  className="text-sm text-on-surface-variant hover:text-on-surface"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      ) : null}
    </main>
  );
}
