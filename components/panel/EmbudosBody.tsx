"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Campana = { id: number; cliente_id: string; name: string; strategy_type: string; status: string; slug: string | null };

// URLs bajo el propio dominio (proxeadas por app/api/hooks/[...path]) — el
// cliente nunca ve que por detrás corre n8n.
function embudoWebinarBase() {
  return `${typeof window !== "undefined" ? window.location.origin : ""}/api/hooks/embudo-webinar`;
}

const PASOS: { paso: string; label: string; descripcion: string }[] = [
  { paso: "registro", label: "Página de registro", descripcion: "Pégala en tu formulario o automatización de registro." },
  { paso: "encuesta", label: "Encuesta", descripcion: "Se dispara cuando el lead completa la encuesta." },
  { paso: "whatsapp", label: "Grupo de WhatsApp", descripcion: "Se dispara cuando el lead se une al grupo." },
  { paso: "registro-webinar", label: "Registro al webinar", descripcion: "Se dispara cuando el lead se registra para el webinar en vivo." },
];

export default function EmbudosBody() {
  const searchParams = useSearchParams();

  const [clienteId, setClienteId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [clientes, setClientes] = useState<{ id: string; name: string }[] | null>(null);

  const [nombreDraft, setNombreDraft] = useState<Record<number, string>>({});
  const [guardandoId, setGuardandoId] = useState<number | null>(null);
  const [formError, setFormError] = useState<Record<number, string>>({});
  const [copiado, setCopiado] = useState<string | null>(null);

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
          const res = await fetch("/api/clientes", { cache: "no-store" }).catch(() => null);
          const data = res && res.ok ? await res.json().catch(() => null) : null;
          setClientes(data?.clientes ?? []);
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

  async function cargarCampanas(id: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/campanas?cliente_id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudieron cargar tus embudos");
        return;
      }
      const todas: Campana[] = data.campanas ?? [];
      setCampanas(todas.filter((c) => c.strategy_type === "webinar_automatizado"));
    } catch {
      setError("No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (clienteId) cargarCampanas(clienteId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  async function activarEmbudo(c: Campana) {
    const nombre = (nombreDraft[c.id] || "").trim();
    setFormError((prev) => ({ ...prev, [c.id]: "" }));
    if (!nombre) {
      setFormError((prev) => ({ ...prev, [c.id]: "Ponle un nombre a este embudo (ej. Webinar Octubre 2026)." }));
      return;
    }
    setGuardandoId(c.id);
    try {
      const res = await fetch("/api/embudo/configurar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, campaign_id: c.id, nombre }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError((prev) => ({ ...prev, [c.id]: data.error || "No se pudo activar el embudo" }));
        return;
      }
      if (clienteId) await cargarCampanas(clienteId);
    } catch {
      setFormError((prev) => ({ ...prev, [c.id]: "No se pudo conectar al servidor" }));
    } finally {
      setGuardandoId(null);
    }
  }

  async function copiar(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(url);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      // el navegador puede bloquear el portapapeles; el texto igual queda visible para copiar a mano
    }
  }

  return (
    <div className="max-w-3xl flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.14em] text-primary font-mono">Embudos</span>
          <h1 className="font-display text-2xl text-on-surface font-semibold">Embudo de Webinar</h1>
          <p className="text-[15px] text-on-surface-variant">
            Página de registro → Encuesta → Grupo de WhatsApp → Registro al webinar. Activa un embudo y te damos los enlaces para
            pegar en cada paso de tu proceso — nunca vas a necesitar tocar nuestra automatización directamente.
          </p>
        </div>
      </header>

      {error && <div className="rounded-lg border border-outline-error bg-error-container px-4 py-3 text-sm text-error">{error}</div>}

      {loading ? (
        <p className="text-[15px] text-on-surface-variant">Cargando…</p>
      ) : clienteId ? (
        <div className="flex flex-col gap-4">
          {campanas.length === 0 && (
            <p className="text-[15px] text-on-surface-variant">
              Tu cuenta todavía no tiene ningún proyecto de Webinar Automático — pídele a tu agencia que te lo habilite.
            </p>
          )}
          {campanas.map((c, i) => (
            <div
              key={c.id}
              style={{ animationDelay: `${i * 40}ms` }}
              className="animate-fade-in-up rounded-lg border border-outline bg-surface p-5 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[14px] font-medium text-on-surface truncate">{c.slug ? c.name : "Embudo sin activar"}</span>
                  <span className="text-[13px] text-on-surface-variant">
                    {c.slug ? `Identificador: ${c.slug}` : "Ponle un nombre para generar tus enlaces de captación."}
                  </span>
                </div>
                {c.slug && (
                  <span className="text-[13px] px-3 py-1.5 rounded-full border border-primary text-primary shrink-0">Activo</span>
                )}
              </div>

              {!c.slug ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={nombreDraft[c.id] || ""}
                    onChange={(e) => setNombreDraft((prev) => ({ ...prev, [c.id]: e.target.value }))}
                    placeholder="Ej. Webinar Octubre 2026"
                    className="flex-1 bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface focus:border-primary outline-none transition-colors duration-150"
                  />
                  <button
                    onClick={() => activarEmbudo(c)}
                    disabled={guardandoId === c.id}
                    className="press bg-primary text-on-primary font-semibold rounded-md px-4 py-2.5 text-[14px] disabled:opacity-50 disabled:active:scale-100 transition-transform duration-150 shrink-0"
                  >
                    {guardandoId === c.id ? "Activando…" : "Activar embudo"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {PASOS.map((p) => {
                    const url = `${embudoWebinarBase()}/${p.paso}?cliente_id=${clienteId}&campaign=${c.slug}`;
                    return (
                      <div key={p.paso} className="flex flex-col gap-1.5 rounded-md bg-background border border-outline p-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[13px] font-medium text-on-surface">{p.label}</span>
                          <span className="text-xs text-on-surface-faint">{p.descripcion}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 min-w-0 truncate bg-surface border border-outline rounded-md px-2.5 py-1.5 text-[12px] text-on-surface-variant font-mono">
                            {url}
                          </code>
                          <button
                            type="button"
                            onClick={() => copiar(url)}
                            className="press text-[12px] px-2.5 py-1.5 rounded-md bg-primary text-on-primary font-medium shrink-0 transition-transform duration-150"
                          >
                            {copiado === url ? "¡Copiado!" : "Copiar"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {formError[c.id] && <p className="text-sm text-error">{formError[c.id]}</p>}
            </div>
          ))}
        </div>
      ) : isAdmin ? (
        <div className="flex flex-col gap-2">
          <p className="text-[15px] text-on-surface-variant">Elegí un cliente para ver o activar sus embudos.</p>
          {(clientes ?? []).map((c, i) => (
            <button
              key={c.id}
              onClick={() => setClienteId(c.id)}
              style={{ animationDelay: `${i * 40}ms` }}
              className="press animate-fade-in-up text-left rounded-lg border border-outline bg-surface p-4 flex items-center justify-between gap-4 hover:border-primary transition-colors duration-150"
            >
              <span className="text-[14px] font-medium text-on-surface">{c.name}</span>
              <span className="text-[13px] px-3 py-1.5 rounded-full border border-outline text-on-surface-variant shrink-0">Revisar →</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
