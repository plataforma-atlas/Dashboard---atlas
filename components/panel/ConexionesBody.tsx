"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type EstadoConexion = { integration_type: string; status: string; updated_at: string; tiene_credencial: boolean };

// El webhook de ClaseEspecial es un mismo endpoint compartido para todos los
// clientes — se diferencia por el ?cliente_id= en la URL, no por credencial.
// Se sirve bajo el propio dominio (proxeado por app/api/hooks/[...path]) para
// que el cliente nunca vea que por detrás corre n8n.
function claseEspecialWebhookBase() {
  return `${typeof window !== "undefined" ? window.location.origin : ""}/api/hooks/dsm-webinarkit`;
}

const INTEGRACIONES: { tipo: string; label: string; descripcion: string; disponible: boolean }[] = [
  { tipo: "ghl", label: "GoHighLevel", descripcion: "Tu CRM — donde llegan tus leads y oportunidades.", disponible: true },
  { tipo: "meta_ads", label: "Meta Ads", descripcion: "Para traer el gasto e inversión de tus campañas.", disponible: true },
  { tipo: "whop", label: "Whop", descripcion: "Para sincronizar compras y membresías.", disponible: false },
  {
    tipo: "webinarkit",
    label: "ClaseEspecial",
    descripcion: "Para trackear asistencia y % de reproducción de tus webinars.",
    disponible: true,
  },
];

export default function ConexionesBody() {
  const searchParams = useSearchParams();

  const [clienteId, setClienteId] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoConexion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formAbierto, setFormAbierto] = useState(false);
  const [locationId, setLocationId] = useState("");
  const [tokenGhl, setTokenGhl] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [metaFormAbierto, setMetaFormAbierto] = useState(false);
  const [metaAdAccountId, setMetaAdAccountId] = useState("");
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [metaGuardando, setMetaGuardando] = useState(false);
  const [metaFormError, setMetaFormError] = useState<string | null>(null);

  const [webhookAbierto, setWebhookAbierto] = useState(false);
  const [webhookCopiado, setWebhookCopiado] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [clientesPendientes, setClientesPendientes] = useState<{ id: string; name: string; faltantes: string[] }[] | null>(null);
  const [cargandoPendientes, setCargandoPendientes] = useState(false);

  async function cargarClientesPendientes() {
    setCargandoPendientes(true);
    try {
      const res = await fetch("/api/clientes", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      const clientes: { id: string; name: string }[] = data?.clientes ?? [];
      const conEstado = await Promise.all(
        clientes.map(async (c) => {
          const r = await fetch(`/api/onboarding/estado?cliente_id=${encodeURIComponent(c.id)}`, { cache: "no-store" }).catch(() => null);
          const est: EstadoConexion[] = r && r.ok ? await r.json().catch(() => []) : [];
          const conectada = (tipo: string) => est.some((e) => e.integration_type === tipo && e.status === "active" && e.tiene_credencial);
          const faltantes = INTEGRACIONES.filter((i) => i.disponible && !conectada(i.tipo)).map((i) => i.label);
          return { id: c.id, name: c.name, faltantes };
        })
      );
      setClientesPendientes(conEstado.filter((c) => c.faltantes.length > 0));
    } catch {
      setClientesPendientes([]);
    } finally {
      setCargandoPendientes(false);
    }
  }

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
      const me = meRes && meRes.ok ? await meRes.json().catch(() => null) : null;
      const esAdmin = me?.role === "admin";
      setIsAdmin(esAdmin);
      const fromQuery = searchParams.get("cliente_id");
      const propio = me?.clientes?.[0] ?? null;
      const id = fromQuery || propio;
      if (!id) {
        if (esAdmin) {
          setLoading(false);
          await cargarClientesPendientes();
          return;
        }
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

  async function conectarMeta(e: React.FormEvent) {
    e.preventDefault();
    setMetaFormError(null);
    if (!metaAdAccountId.trim()) {
      setMetaFormError("Falta el ID de la cuenta publicitaria.");
      return;
    }
    if (!metaAccessToken.trim()) {
      setMetaFormError("Falta el token de acceso.");
      return;
    }
    setMetaGuardando(true);
    try {
      const res = await fetch("/api/onboarding/conectar-meta-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, adAccountId: metaAdAccountId.trim(), accessToken: metaAccessToken.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMetaFormError(data.error || "No se pudo guardar la conexión");
        return;
      }
      setMetaAdAccountId("");
      setMetaAccessToken("");
      setMetaFormAbierto(false);
      if (clienteId) await cargarEstado(clienteId);
    } catch {
      setMetaFormError("No se pudo conectar al servidor");
    } finally {
      setMetaGuardando(false);
    }
  }

  return (
    <div className="max-w-3xl flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.14em] text-primary font-mono">Onboarding</span>
          <h1 className="font-display text-2xl text-on-surface font-semibold">Tus conexiones</h1>
          <p className="text-[15px] text-on-surface-variant">Conecta tus cuentas para que empecemos a traer tus datos automáticamente.</p>
        </div>
      </header>

      {error && <div className="rounded-lg border border-outline-error bg-error-container px-4 py-3 text-sm text-error">{error}</div>}

      {loading ? (
        <p className="text-[15px] text-on-surface-variant">Cargando…</p>
      ) : clienteId ? (
        <div className="flex flex-col gap-3">
          {INTEGRACIONES.map((integ, i) => {
            const conectada = estadoDe(integ.tipo);
            return (
              <div
                key={integ.tipo}
                style={{ animationDelay: `${i * 40}ms` }}
                className="animate-fade-in-up rounded-lg border border-outline bg-surface p-5 flex items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-medium text-on-surface">{integ.label}</span>
                  <span className="text-[13px] text-on-surface-variant">{integ.descripcion}</span>
                  {!integ.disponible && <span className="text-xs text-on-surface-faint mt-0.5">Próximamente</span>}
                </div>
                {integ.disponible ? (
                  integ.tipo === "webinarkit" ? (
                    <button
                      onClick={() => setWebhookAbierto((v) => !v)}
                      className="press text-[13px] px-3 py-1.5 rounded-full border border-outline hover:border-primary text-on-surface font-medium shrink-0 transition-colors duration-150"
                    >
                      {webhookAbierto ? "Ocultar webhook" : "Ver webhook"}
                    </button>
                  ) : conectada ? (
                    <span className="text-[13px] px-3 py-1.5 rounded-full border border-primary text-primary shrink-0">Conectado</span>
                  ) : integ.tipo === "ghl" && formAbierto ? null : integ.tipo === "meta_ads" && metaFormAbierto ? null : (
                    <button
                      onClick={() => (integ.tipo === "meta_ads" ? setMetaFormAbierto(true) : setFormAbierto(true))}
                      className="press text-[13px] px-3 py-1.5 rounded-full bg-primary text-on-primary font-medium shrink-0 transition-transform duration-150"
                    >
                      Conectar
                    </button>
                  )
                ) : (
                  <span className="text-[13px] px-3 py-1.5 rounded-full border border-outline text-on-surface-faint shrink-0">No disponible</span>
                )}
              </div>
            );
          })}

          {webhookAbierto && (
            <div className="animate-pop-in rounded-lg border border-outline bg-surface p-5 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[14px] font-medium text-on-surface">Webhook de ClaseEspecial</span>
                <p className="text-[13px] text-on-surface-variant">
                  Pegá esta URL en la configuración de webhooks de tu plataforma de ClaseEspecial (o WebinarKit) — así nos avisa
                  automáticamente cuando alguien se registra o asiste a tu webinar.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 min-w-0 truncate bg-background border border-outline rounded-md px-3 py-2 text-[13px] text-on-surface font-mono">
                  {claseEspecialWebhookBase()}?cliente_id={clienteId}
                </code>
                <button
                  type="button"
                  onClick={() => copiarWebhook(`${claseEspecialWebhookBase()}?cliente_id=${clienteId}`)}
                  className="press text-[13px] px-3 py-2 rounded-md bg-primary text-on-primary font-medium shrink-0 transition-transform duration-150"
                >
                  {webhookCopiado ? "¡Copiado!" : "Copiar"}
                </button>
              </div>
            </div>
          )}

          {formAbierto && (
            <form onSubmit={conectarGhl} className="animate-fade-in-up rounded-lg border border-outline bg-surface p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[14px] font-medium text-on-surface">Conectar GoHighLevel</span>
                <p className="text-[13px] text-on-surface-variant">
                  Necesitamos el <span className="font-mono">Location ID</span> de tu sub-cuenta y un token de{" "}
                  <span className="font-medium">Integración Privada</span> (Settings → Private Integrations en GHL) con permisos de
                  Contacts y Opportunities.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Location ID</label>
                <input
                  type="text"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  placeholder="Ej. 5MJtQR1kaVBPCbgkiUJS"
                  className="bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface font-mono focus:border-primary outline-none transition-colors duration-150"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Token de Integración Privada</label>
                <input
                  type="password"
                  value={tokenGhl}
                  onChange={(e) => setTokenGhl(e.target.value)}
                  placeholder="pit-..."
                  className="bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface font-mono focus:border-primary outline-none transition-colors duration-150"
                />
              </div>

              {formError && <p className="text-sm text-error">{formError}</p>}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={guardando}
                  className="press rounded-md bg-primary text-on-primary text-[14px] font-medium px-4 py-2.5 disabled:opacity-50 disabled:active:scale-100 transition-transform duration-150"
                >
                  {guardando ? "Guardando…" : "Guardar conexión"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormAbierto(false);
                    setFormError(null);
                  }}
                  className="press text-[14px] text-on-surface-variant hover:text-on-surface transition-colors duration-150"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {metaFormAbierto && (
            <form onSubmit={conectarMeta} className="animate-fade-in-up rounded-lg border border-outline bg-surface p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[14px] font-medium text-on-surface">Conectar Meta Ads</span>
                <p className="text-[13px] text-on-surface-variant">
                  Necesitamos el <span className="font-mono">ID de tu cuenta publicitaria</span> (Administrador comercial → Cuentas
                  publicitarias) y un <span className="font-medium">token de acceso</span> con permisos de lectura de anuncios
                  (<span className="font-mono">ads_read</span>).
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">ID de cuenta publicitaria</label>
                <input
                  type="text"
                  value={metaAdAccountId}
                  onChange={(e) => setMetaAdAccountId(e.target.value)}
                  placeholder="Ej. 123456789012345 (con o sin act_)"
                  className="bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface font-mono focus:border-primary outline-none transition-colors duration-150"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Token de acceso</label>
                <input
                  type="password"
                  value={metaAccessToken}
                  onChange={(e) => setMetaAccessToken(e.target.value)}
                  placeholder="EAAG..."
                  className="bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface font-mono focus:border-primary outline-none transition-colors duration-150"
                />
              </div>

              {metaFormError && <p className="text-sm text-error">{metaFormError}</p>}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={metaGuardando}
                  className="press rounded-md bg-primary text-on-primary text-[14px] font-medium px-4 py-2.5 disabled:opacity-50 disabled:active:scale-100 transition-transform duration-150"
                >
                  {metaGuardando ? "Guardando…" : "Guardar conexión"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMetaFormAbierto(false);
                    setMetaFormError(null);
                  }}
                  className="press text-[14px] text-on-surface-variant hover:text-on-surface transition-colors duration-150"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      ) : isAdmin ? (
        <div className="flex flex-col gap-3">
          <p className="text-[15px] text-on-surface-variant">
            Elegí un cliente para ver o completar sus conexiones. Solo se muestran los clientes con integraciones pendientes.
          </p>
          {cargandoPendientes ? (
            <p className="text-[15px] text-on-surface-variant">Revisando conexiones de cada cliente…</p>
          ) : clientesPendientes && clientesPendientes.length > 0 ? (
            <div className="flex flex-col gap-2">
              {clientesPendientes.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setClienteId(c.id)}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className="press animate-fade-in-up text-left rounded-lg border border-outline bg-surface p-4 flex items-center justify-between gap-4 hover:border-primary transition-colors duration-150"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[14px] font-medium text-on-surface">{c.name}</span>
                    <span className="text-[13px] text-on-surface-variant">Falta conectar: {c.faltantes.join(", ")}</span>
                  </div>
                  <span className="text-[13px] px-3 py-1.5 rounded-full border border-outline text-on-surface-variant shrink-0">Revisar →</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[15px] text-on-surface-variant">Todos los clientes tienen sus conexiones al día. 🎉</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
