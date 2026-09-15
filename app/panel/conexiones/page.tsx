"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useThemeMode } from "@/components/ThemeModeProvider";
import AppSidebar from "@/components/AppSidebar";

type EstadoConexion = { integration_type: string; status: string; updated_at: string; tiene_credencial: boolean };

// El webhook de ClaseEspecial es un mismo endpoint compartido para todos los
// clientes — se diferencia por el ?cliente_id= en la URL, no por credencial.
const CLASE_ESPECIAL_WEBHOOK_BASE = "https://n8n-n8n.hbus8n.easypanel.host/webhook/dsm-webinarkit";

const INTEGRACIONES: { tipo: string; label: string; descripcion: string; disponible: boolean }[] = [
  { tipo: "ghl", label: "GoHighLevel", descripcion: "Tu CRM — donde llegan tus leads y oportunidades.", disponible: true },
  { tipo: "meta_ads", label: "Meta Ads", descripcion: "Para traer el gasto e inversión de tus campañas.", disponible: false },
  { tipo: "whop", label: "Whop", descripcion: "Para sincronizar compras y membresías.", disponible: false },
  {
    tipo: "webinarkit",
    label: "ClaseEspecial",
    descripcion: "Para trackear asistencia y % de reproducción de tus webinars.",
    disponible: true,
  },
];

function PanelConexionesContent() {
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

  const [webhookAbierto, setWebhookAbierto] = useState(false);
  const [webhookCopiado, setWebhookCopiado] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
      const me = meRes && meRes.ok ? await meRes.json().catch(() => null) : null;
      setIsAdmin(me?.role === "admin");
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

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

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

  async function copiarWebhook(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setWebhookCopiado(true);
      setTimeout(() => setWebhookCopiado(false), 2000);
    } catch {
      // Si el navegador bloquea el clipboard, el usuario igual puede
      // seleccionar el texto a mano — no hace falta un error visible.
    }
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
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <AppSidebar active="conexiones" isAdmin={isAdmin} mode={mode} onToggleMode={toggleMode} onLogout={handleLogout} />
      <main className="min-h-screen px-4 py-8 md:px-8 md:ml-[240px] max-w-3xl flex flex-col gap-6 bg-background">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.14em] text-primary font-mono">Onboarding</span>
          <h1 className="font-display text-2xl text-on-surface font-semibold">Tus conexiones</h1>
          <p className="text-sm text-on-surface-variant">Conecta tus cuentas para que empecemos a traer tus datos automáticamente.</p>
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
                  integ.tipo === "webinarkit" ? (
                    <button
                      onClick={() => setWebhookAbierto((v) => !v)}
                      className="text-xs px-3 py-1.5 rounded-full border border-outline hover:border-primary text-on-surface font-medium shrink-0 transition"
                    >
                      {webhookAbierto ? "Ocultar webhook" : "Ver webhook"}
                    </button>
                  ) : conectada ? (
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

          {webhookAbierto && (
            <div className="rounded-lg border border-outline bg-surface p-5 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-on-surface">Webhook de ClaseEspecial</span>
                <p className="text-xs text-on-surface-variant">
                  Pegá esta URL en la configuración de webhooks de tu plataforma de ClaseEspecial (o WebinarKit) — así nos avisa
                  automáticamente cuando alguien se registra o asiste a tu webinar.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 min-w-0 truncate bg-background border border-outline rounded-md px-3 py-2 text-xs text-on-surface font-mono">
                  {CLASE_ESPECIAL_WEBHOOK_BASE}?cliente_id={clienteId}
                </code>
                <button
                  type="button"
                  onClick={() => copiarWebhook(`${CLASE_ESPECIAL_WEBHOOK_BASE}?cliente_id=${clienteId}`)}
                  className="text-xs px-3 py-2 rounded-md bg-primary text-on-primary font-medium shrink-0"
                >
                  {webhookCopiado ? "¡Copiado!" : "Copiar"}
                </button>
              </div>
            </div>
          )}

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
    </div>
  );
}

export default function PanelConexionesPage() {
  return (
    <Suspense fallback={null}>
      <PanelConexionesContent />
    </Suspense>
  );
}
