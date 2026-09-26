"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Check, Link2, Plus, X } from "lucide-react";
import VermetricasLoader from "@/components/VermetricasLoader";

type EstadoConexion = { integration_type: string; status: string; updated_at: string; tiene_credencial: boolean };
type CuentaForm = { id: string; label: string };

function nuevaFila(): CuentaForm {
  return { id: "", label: "" };
}

export default function V3ConexionesPage() {
  const params = useParams<{ clienteId: string }>();
  const clienteId = params.clienteId;

  const [estado, setEstado] = useState<EstadoConexion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formAbierto, setFormAbierto] = useState(false);
  const [cuentas, setCuentas] = useState<CuentaForm[]>([nuevaFila()]);
  const [accessToken, setAccessToken] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [ghlFormAbierto, setGhlFormAbierto] = useState(false);
  const [ghlLocationId, setGhlLocationId] = useState("");
  const [ghlToken, setGhlToken] = useState("");
  const [ghlGuardando, setGhlGuardando] = useState(false);
  const [ghlFormError, setGhlFormError] = useState<string | null>(null);

  const [hotmartFormAbierto, setHotmartFormAbierto] = useState(false);
  const [hotmartHottok, setHotmartHottok] = useState("");
  const [hotmartGuardando, setHotmartGuardando] = useState(false);
  const [hotmartFormError, setHotmartFormError] = useState<string | null>(null);
  const [hotmartWebhookAbierto, setHotmartWebhookAbierto] = useState(false);
  const [hotmartCopiado, setHotmartCopiado] = useState(false);

  async function cargarEstado() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/onboarding/estado?cliente_id=${encodeURIComponent(clienteId)}`, { cache: "no-store" });
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
    if (clienteId) cargarEstado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  const metaConectado = estado.find((e) => e.integration_type === "meta_ads" && e.status === "active" && e.tiene_credencial) || null;
  const ghlConectado = estado.find((e) => e.integration_type === "ghl" && e.status === "active" && e.tiene_credencial) || null;
  const hotmartConectado = estado.find((e) => e.integration_type === "hotmart" && e.status === "active" && e.tiene_credencial) || null;
  const hotmartWebhookUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/hooks/integraciones/hotmart-venta?cliente_id=${clienteId}`;

  function actualizarCuenta(i: number, campo: "id" | "label", valor: string) {
    setCuentas((prev) => prev.map((c, idx) => (idx === i ? { ...c, [campo]: valor } : c)));
  }

  function agregarCuenta() {
    setCuentas((prev) => [...prev, nuevaFila()]);
  }

  function quitarCuenta(i: number) {
    setCuentas((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  async function conectarMeta(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const cuentasValidas = cuentas.map((c) => ({ id: c.id.trim(), label: c.label.trim() })).filter((c) => c.id.length > 0);
    if (cuentasValidas.length === 0) {
      setFormError("Agregá al menos una cuenta publicitaria.");
      return;
    }
    if (!accessToken.trim()) {
      setFormError("Falta el token de acceso.");
      return;
    }
    setGuardando(true);
    try {
      const res = await fetch("/api/onboarding/conectar-meta-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, adAccounts: cuentasValidas, accessToken: accessToken.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "No se pudo guardar la conexión");
        return;
      }
      setCuentas([nuevaFila()]);
      setAccessToken("");
      setFormAbierto(false);
      await cargarEstado();
    } catch {
      setFormError("No se pudo conectar al servidor");
    } finally {
      setGuardando(false);
    }
  }

  async function conectarGhl(e: React.FormEvent) {
    e.preventDefault();
    setGhlFormError(null);
    if (!ghlLocationId.trim()) {
      setGhlFormError("Falta el Location ID de Go High Level.");
      return;
    }
    if (!ghlToken.trim()) {
      setGhlFormError("Falta el token de Integración Privada.");
      return;
    }
    setGhlGuardando(true);
    try {
      const res = await fetch("/api/onboarding/conectar-ghl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, locationId: ghlLocationId.trim(), token: ghlToken.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGhlFormError(data.error || "No se pudo guardar la conexión");
        return;
      }
      setGhlLocationId("");
      setGhlToken("");
      setGhlFormAbierto(false);
      await cargarEstado();
    } catch {
      setGhlFormError("No se pudo conectar al servidor");
    } finally {
      setGhlGuardando(false);
    }
  }

  async function conectarHotmart(e: React.FormEvent) {
    e.preventDefault();
    setHotmartFormError(null);
    if (!hotmartHottok.trim()) {
      setHotmartFormError("Falta el Hottok de Hotmart.");
      return;
    }
    setHotmartGuardando(true);
    try {
      const res = await fetch("/api/onboarding/conectar-hotmart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, hottok: hotmartHottok.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHotmartFormError(data.error || "No se pudo guardar la conexión");
        return;
      }
      setHotmartHottok("");
      setHotmartFormAbierto(false);
      await cargarEstado();
    } catch {
      setHotmartFormError("No se pudo conectar al servidor");
    } finally {
      setHotmartGuardando(false);
    }
  }

  function copiarWebhookHotmart() {
    navigator.clipboard
      ?.writeText(hotmartWebhookUrl)
      .then(() => {
        setHotmartCopiado(true);
        setTimeout(() => setHotmartCopiado(false), 2000);
      })
      .catch(() => {});
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <VermetricasLoader />
      </div>
    );
  }

  return (
    <div className="px-4 py-8 md:px-8 max-w-3xl mx-auto flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-[0.14em] text-primary font-mono">Conexiones</span>
        <h1 className="font-display text-2xl text-on-surface font-semibold">Fuentes de datos</h1>
        <p className="text-sm text-on-surface-variant">Conectá una o más cuentas de Meta Ads para ver el Administrador de Anuncios con datos reales.</p>
      </header>

      {error && <div className="rounded-lg border border-outline-error bg-error-container px-4 py-3 text-sm text-error">{error}</div>}

      <div className="rounded-lg border border-outline bg-surface p-5 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] font-medium text-on-surface">Go High Level</span>
          <span className="text-[13px] text-on-surface-variant">Tu CRM — para crear y etiquetar contactos automáticamente cuando captes un lead.</span>
        </div>
        {ghlFormAbierto ? null : ghlConectado ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-2 text-[13px] px-3 py-1.5 rounded-full border border-outline-success bg-success-container text-success">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              Conectado
            </span>
            <button
              onClick={() => setGhlFormAbierto(true)}
              className="press text-[13px] px-3 py-1.5 rounded-full border border-outline hover:border-primary text-on-surface font-medium transition-colors duration-150"
            >
              Reconectar
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-2 text-[13px] px-3 py-1.5 rounded-full border border-outline text-on-surface-faint">
              <span className="h-2 w-2 rounded-full bg-on-surface-faint" />
              No conectado
            </span>
            <button
              onClick={() => setGhlFormAbierto(true)}
              className="press text-[13px] px-3 py-1.5 rounded-full bg-primary text-on-primary font-medium shrink-0 transition-transform duration-150"
            >
              Conectar
            </button>
          </div>
        )}
      </div>

      {ghlFormAbierto && (
        <form onSubmit={conectarGhl} className="animate-fade-in-up rounded-lg border border-outline bg-surface p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[14px] font-medium text-on-surface">{ghlConectado ? "Reconectar Go High Level" : "Conectar Go High Level"}</span>
            <p className="text-[13px] text-on-surface-variant">
              Necesitamos el <span className="font-mono">Location ID</span> de tu sub-cuenta y un token de{" "}
              <span className="font-medium">Integración Privada</span> (Settings → Private Integrations en GHL) con permisos de Contacts.
              {ghlConectado && " Esto reemplaza la conexión guardada."}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Location ID</label>
            <input
              type="text"
              value={ghlLocationId}
              onChange={(e) => setGhlLocationId(e.target.value)}
              placeholder="Ej. inP4J6Az84JrpelPM1ZE"
              className="bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface font-mono focus:border-primary outline-none transition-colors duration-150"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Token de Integración Privada</label>
            <input
              type="password"
              value={ghlToken}
              onChange={(e) => setGhlToken(e.target.value)}
              placeholder="pit-..."
              className="bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface font-mono focus:border-primary outline-none transition-colors duration-150"
            />
          </div>

          {ghlFormError && <p className="text-sm text-error">{ghlFormError}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={ghlGuardando}
              className="press rounded-md bg-primary text-on-primary text-[14px] font-medium px-4 py-2.5 disabled:opacity-50 disabled:active:scale-100 transition-transform duration-150"
            >
              {ghlGuardando ? "Guardando…" : "Guardar conexión"}
            </button>
            <button
              type="button"
              onClick={() => {
                setGhlFormAbierto(false);
                setGhlFormError(null);
              }}
              className="press text-[14px] text-on-surface-variant hover:text-on-surface transition-colors duration-150"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="rounded-lg border border-outline bg-surface p-5 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] font-medium text-on-surface">Meta Ads</span>
          <span className="text-[13px] text-on-surface-variant">Para traer el gasto, impresiones y clics de tus campañas y anuncios.</span>
        </div>
        {formAbierto ? null : metaConectado ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-2 text-[13px] px-3 py-1.5 rounded-full border border-outline-success bg-success-container text-success">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              Conectado
            </span>
            <button
              onClick={() => setFormAbierto(true)}
              className="press text-[13px] px-3 py-1.5 rounded-full border border-outline hover:border-primary text-on-surface font-medium transition-colors duration-150"
            >
              Reconectar
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-2 text-[13px] px-3 py-1.5 rounded-full border border-outline text-on-surface-faint">
              <span className="h-2 w-2 rounded-full bg-on-surface-faint" />
              No conectado
            </span>
            <button
              onClick={() => setFormAbierto(true)}
              className="press text-[13px] px-3 py-1.5 rounded-full bg-primary text-on-primary font-medium shrink-0 transition-transform duration-150"
            >
              Conectar
            </button>
          </div>
        )}
      </div>

      {formAbierto && (
        <form onSubmit={conectarMeta} className="animate-fade-in-up rounded-lg border border-outline bg-surface p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[14px] font-medium text-on-surface">{metaConectado ? "Reconectar Meta Ads" : "Conectar Meta Ads"}</span>
            <p className="text-[13px] text-on-surface-variant">
              Agregá el <span className="font-mono">ID</span> de cada cuenta publicitaria (Administrador comercial → Cuentas
              publicitarias) que quieras ver, con un nombre para identificarla, y un <span className="font-medium">token de acceso</span>{" "}
              con permiso de lectura y gestión de anuncios (<span className="font-mono">ads_read</span>,{" "}
              <span className="font-mono">ads_management</span>) — este último permite pausar/activar desde el panel.
              {metaConectado && " Esto reemplaza la lista completa de cuentas conectadas."}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Cuentas publicitarias</label>
            {cuentas.map((cuenta, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={cuenta.id}
                  onChange={(e) => actualizarCuenta(i, "id", e.target.value)}
                  placeholder="ID (ej. 1335449911466240)"
                  className="flex-1 min-w-0 bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface font-mono focus:border-primary outline-none transition-colors duration-150"
                />
                <input
                  type="text"
                  value={cuenta.label}
                  onChange={(e) => actualizarCuenta(i, "label", e.target.value)}
                  placeholder="Nombre (ej. CP2 - El Loco)"
                  className="flex-1 min-w-0 bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface focus:border-primary outline-none transition-colors duration-150"
                />
                <button
                  type="button"
                  onClick={() => quitarCuenta(i)}
                  disabled={cuentas.length === 1}
                  title="Quitar cuenta"
                  className="press w-9 h-9 rounded-md border border-outline hover:border-error text-on-surface-variant hover:text-error grid place-items-center shrink-0 disabled:opacity-30 disabled:hover:border-outline disabled:hover:text-on-surface-variant transition-colors duration-150"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={agregarCuenta}
              className="press self-start flex items-center gap-1.5 text-[13px] text-primary hover:underline"
            >
              <Plus size={14} /> Agregar otra cuenta
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Token de acceso</label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="EAAG..."
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

      <div className="rounded-lg border border-outline bg-surface p-5 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] font-medium text-on-surface">Hotmart</span>
          <span className="text-[13px] text-on-surface-variant">De acá llegan tus ventas — se reflejan solas en Base de datos.</span>
        </div>
        {hotmartFormAbierto ? null : hotmartConectado ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-2 text-[13px] px-3 py-1.5 rounded-full border border-outline-success bg-success-container text-success">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              Conectado
            </span>
            <button
              type="button"
              onClick={() => setHotmartWebhookAbierto((v) => !v)}
              className="press text-[13px] px-3 py-1.5 rounded-full border border-outline hover:border-primary text-on-surface font-medium transition-colors duration-150"
            >
              {hotmartWebhookAbierto ? "Ocultar webhook" : "Ver webhook"}
            </button>
            <button
              onClick={() => setHotmartFormAbierto(true)}
              className="press text-[13px] px-3 py-1.5 rounded-full border border-outline hover:border-primary text-on-surface font-medium transition-colors duration-150"
            >
              Reconectar
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-2 text-[13px] px-3 py-1.5 rounded-full border border-outline text-on-surface-faint">
              <span className="h-2 w-2 rounded-full bg-on-surface-faint" />
              No conectado
            </span>
            <button
              onClick={() => setHotmartFormAbierto(true)}
              className="press text-[13px] px-3 py-1.5 rounded-full bg-primary text-on-primary font-medium shrink-0 transition-transform duration-150"
            >
              Conectar
            </button>
          </div>
        )}
      </div>

      {hotmartConectado && hotmartWebhookAbierto && !hotmartFormAbierto && (
        <div className="animate-fade-in-up rounded-lg border border-outline bg-surface p-5 flex flex-col gap-3">
          <p className="text-[13px] text-on-surface-variant">
            Pegá este webhook en tu cuenta de Hotmart (Herramientas → Webhooks) para que cada venta llegue automáticamente.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 min-w-0 truncate bg-background border border-outline rounded-md px-3 py-2 text-[13px] text-on-surface font-mono">
              {hotmartWebhookUrl}
            </code>
            <button
              type="button"
              onClick={copiarWebhookHotmart}
              className="press flex items-center gap-1.5 text-[13px] px-3 py-2 rounded-md border border-outline hover:border-primary text-on-surface font-medium shrink-0 transition-colors duration-150"
            >
              {hotmartCopiado ? (
                <>
                  <Check size={14} /> Copiado
                </>
              ) : (
                <>
                  <Link2 size={14} /> Copiar
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {hotmartFormAbierto && (
        <form onSubmit={conectarHotmart} className="animate-fade-in-up rounded-lg border border-outline bg-surface p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[14px] font-medium text-on-surface">{hotmartConectado ? "Reconectar Hotmart" : "Conectar Hotmart"}</span>
            <p className="text-[13px] text-on-surface-variant">
              Necesitamos el <span className="font-medium">Hottok</span> de tu cuenta de Hotmart (Herramientas → Webhooks → Hottok) para
              verificar que las ventas que lleguen sean realmente tuyas.
              {hotmartConectado && " Esto reemplaza el Hottok guardado."}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-[0.1em] text-on-surface-faint">Hottok</label>
            <input
              type="password"
              value={hotmartHottok}
              onChange={(e) => setHotmartHottok(e.target.value)}
              placeholder="Tu Hottok"
              className="bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface font-mono focus:border-primary outline-none transition-colors duration-150"
            />
          </div>

          {hotmartFormError && <p className="text-sm text-error">{hotmartFormError}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={hotmartGuardando}
              className="press rounded-md bg-primary text-on-primary text-[14px] font-medium px-4 py-2.5 disabled:opacity-50 disabled:active:scale-100 transition-transform duration-150"
            >
              {hotmartGuardando ? "Guardando…" : "Guardar conexión"}
            </button>
            <button
              type="button"
              onClick={() => {
                setHotmartFormAbierto(false);
                setHotmartFormError(null);
              }}
              className="press text-[14px] text-on-surface-variant hover:text-on-surface transition-colors duration-150"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
