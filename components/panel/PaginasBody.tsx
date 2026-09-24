"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSidePanel } from "@/components/SidePanelProvider";
import {
  paginaSpecVacio,
  type PaginaSpec,
  type Colores,
  type CopyCaptura,
  type CopyEncuestaIntro,
  type Gracias,
  type Imagenes,
  type PreguntaEncuesta,
} from "@/lib/paginas/templates";

type PaginaListado = {
  id: number;
  slug: string;
  nombre: string;
  tipo_funil: string;
  plantilla: string;
  status: string;
  updated_at: string;
};

type HtmlGenerado = { slug: string; titulo: string; html: string };
type ResultadosPublicacion = {
  captura?: { tipo: string; ok: boolean; url?: string; omitido?: boolean; error?: string };
  encuesta?: { tipo: string; ok: boolean; url?: string; omitido?: boolean; error?: string };
  gracias?: { tipo: string; ok: boolean; url?: string; omitido?: boolean; error?: string };
};

function slugify(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const PASOS = ["Datos básicos", "Colores", "Captura", "Encuesta", "Gracias", "Revisión"];

export default function PaginasBody() {
  const searchParams = useSearchParams();
  const { openConfiguracion } = useSidePanel();

  const [clienteId, setClienteId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [clientes, setClientes] = useState<{ id: string; name: string }[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [wpEstado, setWpEstado] = useState<{ conectado: boolean; site_url?: string } | null>(null);

  const [vista, setVista] = useState<"lista" | "wizard">("lista");
  const [paginas, setPaginas] = useState<PaginaListado[]>([]);
  const [cargandoLista, setCargandoLista] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [spec, setSpec] = useState<PaginaSpec>(paginaSpecVacio());
  const [slugTocado, setSlugTocado] = useState(false);
  const [paso, setPaso] = useState(0);

  const [guardando, setGuardando] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [accionError, setAccionError] = useState<string | null>(null);
  const [resultados, setResultados] = useState<ResultadosPublicacion | null>(null);

  const [preview, setPreview] = useState<{ captura: HtmlGenerado; encuesta: HtmlGenerado; gracias: HtmlGenerado } | null>(null);
  const [previewTab, setPreviewTab] = useState<"captura" | "encuesta" | "gracias">("captura");
  const [generandoPreview, setGenerandoPreview] = useState(false);

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

  async function cargarLista(id: string) {
    setCargandoLista(true);
    setError(null);
    try {
      const res = await fetch(`/api/paginas?cliente_id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudieron cargar tus páginas");
        return;
      }
      setPaginas(Array.isArray(data.paginas) ? data.paginas : []);
    } catch {
      setError("No se pudo conectar al servidor");
    } finally {
      setCargandoLista(false);
      setLoading(false);
    }
  }

  async function cargarEstadoWordpress(id: string) {
    try {
      const res = await fetch(`/api/onboarding/wordpress-estado?cliente_id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = await res.json().catch(() => null);
      setWpEstado(res.ok ? data : { conectado: false });
    } catch {
      setWpEstado({ conectado: false });
    }
  }

  useEffect(() => {
    if (clienteId) {
      cargarLista(clienteId);
      cargarEstadoWordpress(clienteId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  function nuevaPagina() {
    setEditingId(null);
    setSpec(paginaSpecVacio());
    setSlugTocado(false);
    setPaso(0);
    setPreview(null);
    setResultados(null);
    setAccionError(null);
    setVista("wizard");
  }

  async function editarPagina(id: number) {
    if (!clienteId) return;
    setError(null);
    try {
      const res = await fetch(`/api/paginas/${id}?cliente_id=${encodeURIComponent(clienteId)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.pagina) {
        setError(data.error || "No se pudo cargar la página");
        return;
      }
      const p = data.pagina;
      const base = paginaSpecVacio();
      setSpec({
        nombre: p.nombre ?? base.nombre,
        slug: p.slug ?? base.slug,
        tipo_funil: p.tipo_funil === "sesion_estrategica" ? "sesion_estrategica" : "webinario",
        plantilla: p.plantilla || base.plantilla,
        colores: { ...base.colores, ...(p.colores || {}) },
        copy: {
          captura: { ...base.copy.captura, ...(p.copy?.captura || {}) },
          encuestaIntro: { ...base.copy.encuestaIntro, ...(p.copy?.encuestaIntro || {}) },
        },
        encuesta: Array.isArray(p.encuesta) ? p.encuesta : base.encuesta,
        gracias: { ...base.gracias, ...(p.gracias || {}) },
        imagenes: { ...base.imagenes, ...(p.imagenes || {}) },
      });
      setEditingId(id);
      setSlugTocado(true);
      setPaso(0);
      setPreview(null);
      setResultados(null);
      setAccionError(null);
      setVista("wizard");
    } catch {
      setError("No se pudo conectar al servidor");
    }
  }

  function updateSpec(patch: Partial<PaginaSpec>) {
    setSpec((prev) => ({ ...prev, ...patch }));
  }
  function updateColores(patch: Partial<Colores>) {
    setSpec((prev) => ({ ...prev, colores: { ...prev.colores, ...patch } }));
  }
  function updateCaptura(patch: Partial<CopyCaptura>) {
    setSpec((prev) => ({ ...prev, copy: { ...prev.copy, captura: { ...prev.copy.captura, ...patch } } }));
  }
  function updateEncuestaIntro(patch: Partial<CopyEncuestaIntro>) {
    setSpec((prev) => ({ ...prev, copy: { ...prev.copy, encuestaIntro: { ...prev.copy.encuestaIntro, ...patch } } }));
  }
  function updateGracias(patch: Partial<Gracias>) {
    setSpec((prev) => ({ ...prev, gracias: { ...prev.gracias, ...patch } }));
  }
  function updateImagenes(patch: Partial<Imagenes>) {
    setSpec((prev) => ({ ...prev, imagenes: { ...prev.imagenes, ...patch } }));
  }

  function setBullet(i: number, value: string) {
    updateCaptura({ bullets: spec.copy.captura.bullets.map((b, idx) => (idx === i ? value : b)) });
  }
  function addBullet() {
    updateCaptura({ bullets: [...spec.copy.captura.bullets, ""] });
  }
  function removeBullet(i: number) {
    updateCaptura({ bullets: spec.copy.captura.bullets.filter((_, idx) => idx !== i) });
  }

  function setPregunta(i: number, patch: Partial<PreguntaEncuesta>) {
    setSpec((prev) => ({ ...prev, encuesta: prev.encuesta.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) }));
  }
  function addPregunta() {
    setSpec((prev) => ({ ...prev, encuesta: [...prev.encuesta, { texto: "", tipo: "abierta", opciones: [] }] }));
  }
  function removePregunta(i: number) {
    setSpec((prev) => ({ ...prev, encuesta: prev.encuesta.filter((_, idx) => idx !== i) }));
  }

  function onNombreChange(value: string) {
    updateSpec({ nombre: value, slug: slugTocado ? spec.slug : slugify(value) });
  }

  async function generarPreview() {
    if (!clienteId) return;
    setGenerandoPreview(true);
    setAccionError(null);
    try {
      const res = await fetch("/api/paginas/generar-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: clienteId,
          pagina_id: editingId ?? "preview",
          site_url: wpEstado?.site_url ?? "",
          spec,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAccionError(data.error || "No se pudo generar la vista previa");
        return;
      }
      setPreview(data);
    } catch {
      setAccionError("No se pudo conectar al servidor");
    } finally {
      setGenerandoPreview(false);
    }
  }

  useEffect(() => {
    if (vista === "wizard" && paso === 5) generarPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso, vista]);

  async function guardar(): Promise<{ id: number; slug: string } | null> {
    if (!clienteId) return null;
    setGuardando(true);
    setAccionError(null);
    try {
      const res = await fetch("/api/paginas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: clienteId,
          nombre: spec.nombre,
          slug: spec.slug,
          tipo_funil: spec.tipo_funil,
          plantilla: spec.plantilla,
          colores: spec.colores,
          copy: spec.copy,
          encuesta: spec.encuesta,
          gracias: spec.gracias,
          imagenes: spec.imagenes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAccionError(data.error || "No se pudo guardar la página");
        return null;
      }
      setEditingId(data.id);
      await cargarLista(clienteId);
      return { id: data.id, slug: data.slug };
    } catch {
      setAccionError("No se pudo conectar al servidor");
      return null;
    } finally {
      setGuardando(false);
    }
  }

  async function guardarYPublicar() {
    if (!clienteId || !wpEstado?.conectado) return;
    setPublicando(true);
    setAccionError(null);
    setResultados(null);
    try {
      const guardado = await guardar();
      if (!guardado) return;
      const htmlRes = await fetch("/api/paginas/generar-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, pagina_id: guardado.id, site_url: wpEstado.site_url ?? "", spec }),
      });
      const htmlData = await htmlRes.json();
      if (!htmlRes.ok) {
        setAccionError(htmlData.error || "No se pudo generar el HTML para publicar");
        return;
      }
      setPreview(htmlData);
      const pubRes = await fetch("/api/paginas/publicar-wordpress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: clienteId,
          captura: htmlData.captura,
          encuesta: htmlData.encuesta,
          gracias: htmlData.gracias,
        }),
      });
      const pubData = await pubRes.json();
      if (!pubRes.ok) {
        setAccionError(pubData.error || "No se pudo publicar en WordPress");
        return;
      }
      const lista: Array<{ tipo: string; ok: boolean; url?: string; omitido?: boolean; error?: string }> = pubData.resultados ?? [];
      const porTipo: ResultadosPublicacion = {};
      for (const r of lista) {
        if (r.tipo === "captura" || r.tipo === "encuesta" || r.tipo === "gracias") porTipo[r.tipo] = r;
      }
      setResultados(porTipo);
    } catch {
      setAccionError("No se pudo conectar al servidor");
    } finally {
      setPublicando(false);
    }
  }

  const puedeAvanzarPaso0 = spec.nombre.trim().length > 0 && spec.slug.trim().length > 0;

  const inputClass =
    "w-full bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface focus:border-primary outline-none transition-colors duration-150";
  const labelClass = "text-[13px] font-medium text-on-surface-variant";
  const cardClass = "animate-fade-in-up rounded-lg border border-outline bg-surface p-5 flex flex-col gap-4";

  if (loading) {
    return <p className="text-[15px] text-on-surface-variant">Cargando…</p>;
  }

  if (!clienteId && isAdmin) {
    return (
      <div className="max-w-3xl flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.14em] text-primary font-mono">Páginas</span>
          <h1 className="font-display text-2xl text-on-surface font-semibold">Constructor de páginas</h1>
        </header>
        <p className="text-[15px] text-on-surface-variant">Elegí un cliente para ver o crear sus páginas.</p>
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
    );
  }

  if (!clienteId) {
    return <div className="rounded-lg border border-outline-error bg-error-container px-4 py-3 text-sm text-error">{error}</div>;
  }

  if (vista === "lista") {
    return (
      <div className="max-w-3xl flex flex-col gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.14em] text-primary font-mono">Páginas</span>
            <h1 className="font-display text-2xl text-on-surface font-semibold">Constructor de páginas</h1>
            <p className="text-[15px] text-on-surface-variant">
              Armá tu página de captación, la encuesta y la página de gracias, y publicalas directo en tu WordPress — sin depender de
              otra herramienta.
            </p>
          </div>
          <button
            type="button"
            onClick={nuevaPagina}
            className="press bg-primary text-on-primary font-semibold rounded-md px-4 py-2.5 text-[14px] shrink-0 transition-transform duration-150"
          >
            + Nueva página
          </button>
        </header>

        {!wpEstado?.conectado && (
          <div className="rounded-lg border border-outline bg-surface-high px-4 py-3 text-sm text-on-surface-variant flex items-center justify-between gap-4">
            <span>Todavía no conectaste WordPress — vas a poder armar páginas igual, pero para publicarlas necesitás conectarlo.</span>
            <button type="button" onClick={openConfiguracion} className="press text-[13px] px-3 py-1.5 rounded-full border border-primary text-primary shrink-0">
              Conectar
            </button>
          </div>
        )}

        {error && <div className="rounded-lg border border-outline-error bg-error-container px-4 py-3 text-sm text-error">{error}</div>}

        {cargandoLista ? (
          <p className="text-[15px] text-on-surface-variant">Cargando…</p>
        ) : paginas.length === 0 ? (
          <p className="text-[15px] text-on-surface-variant">Todavía no armaste ninguna página. Arrancá con &quot;Nueva página&quot;.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {paginas.map((p, i) => (
              <button
                key={p.id}
                onClick={() => editarPagina(p.id)}
                style={{ animationDelay: `${i * 40}ms` }}
                className="press animate-fade-in-up text-left rounded-lg border border-outline bg-surface p-4 flex items-center justify-between gap-4 hover:border-primary transition-colors duration-150"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[14px] font-medium text-on-surface truncate">{p.nombre}</span>
                  <span className="text-[13px] text-on-surface-variant">
                    /{p.slug} · {p.tipo_funil === "sesion_estrategica" ? "Sesión estratégica" : "Webinario"}
                  </span>
                </div>
                <span className="text-[13px] px-3 py-1.5 rounded-full border border-outline text-on-surface-variant shrink-0">Editar →</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // vista === "wizard"
  return (
    <div className="max-w-3xl flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.14em] text-primary font-mono">Páginas</span>
          <h1 className="font-display text-2xl text-on-surface font-semibold">{editingId ? "Editar página" : "Nueva página"}</h1>
        </div>
        <button
          type="button"
          onClick={() => setVista("lista")}
          className="press text-[13px] px-3 py-1.5 rounded-full border border-outline text-on-surface-variant hover:text-on-surface hover:border-primary transition-colors duration-150 shrink-0"
        >
          ← Volver a mis páginas
        </button>
      </header>

      <div className="flex flex-wrap gap-2">
        {PASOS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setPaso(i)}
            className={`press text-[12.5px] px-3 py-1.5 rounded-full border transition-colors duration-150 ${
              paso === i ? "border-primary text-primary" : "border-outline text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {paso === 0 && (
        <div className={cardClass}>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Nombre del embudo</label>
            <input type="text" value={spec.nombre} onChange={(e) => onNombreChange(e.target.value)} placeholder="Ej. Webinar Octubre 2026" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Slug (parte de la URL)</label>
            <input
              type="text"
              value={spec.slug}
              onChange={(e) => {
                setSlugTocado(true);
                updateSpec({ slug: slugify(e.target.value) });
              }}
              placeholder="webinar-octubre-2026"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Tipo de embudo</label>
            <div className="flex gap-2">
              {(["webinario", "sesion_estrategica"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => updateSpec({ tipo_funil: t })}
                  className={`press text-[13px] px-3 py-2 rounded-md border transition-colors duration-150 ${
                    spec.tipo_funil === t ? "border-primary text-primary" : "border-outline text-on-surface-variant"
                  }`}
                >
                  {t === "webinario" ? "Webinario" : "Sesión estratégica"}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            disabled={!puedeAvanzarPaso0}
            onClick={() => setPaso(1)}
            className="press bg-primary text-on-primary font-semibold rounded-md px-4 py-2.5 text-[14px] self-start disabled:opacity-50 disabled:active:scale-100 transition-transform duration-150"
          >
            Siguiente
          </button>
        </div>
      )}

      {paso === 1 && (
        <div className={cardClass}>
          {(
            [
              ["primario", "Color principal (botones, acentos)"],
              ["fondo", "Color de fondo"],
              ["texto", "Color de texto"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center gap-3">
              <input type="color" value={spec.colores[key]} onChange={(e) => updateColores({ [key]: e.target.value } as Partial<Colores>)} className="w-10 h-10 rounded-md border border-outline cursor-pointer" />
              <div className="flex flex-col gap-1 flex-1">
                <label className={labelClass}>{label}</label>
                <input type="text" value={spec.colores[key]} onChange={(e) => updateColores({ [key]: e.target.value } as Partial<Colores>)} className={inputClass} />
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <button type="button" onClick={() => setPaso(0)} className="press text-[13px] px-3 py-1.5 rounded-full border border-outline text-on-surface-variant">
              Atrás
            </button>
            <button type="button" onClick={() => setPaso(2)} className="press bg-primary text-on-primary font-semibold rounded-md px-4 py-2.5 text-[14px] transition-transform duration-150">
              Siguiente
            </button>
          </div>
        </div>
      )}

      {paso === 2 && (
        <div className={cardClass}>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Título</label>
            <input type="text" value={spec.copy.captura.titulo} onChange={(e) => updateCaptura({ titulo: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Subtítulo</label>
            <input type="text" value={spec.copy.captura.subtitulo} onChange={(e) => updateCaptura({ subtitulo: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Beneficios (bullets)</label>
            {spec.copy.captura.bullets.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="text" value={b} onChange={(e) => setBullet(i, e.target.value)} className={inputClass} />
                <button type="button" onClick={() => removeBullet(i)} className="press text-[12px] px-2.5 py-1.5 rounded-md border border-outline text-on-surface-variant shrink-0">
                  Quitar
                </button>
              </div>
            ))}
            <button type="button" onClick={addBullet} className="press text-[13px] px-3 py-1.5 rounded-md border border-outline text-on-surface-variant self-start">
              + Agregar beneficio
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Texto del botón</label>
            <input type="text" value={spec.copy.captura.textoBoton} onChange={(e) => updateCaptura({ textoBoton: e.target.value })} className={inputClass} />
          </div>
          <label className="flex items-center gap-2 text-[13px] text-on-surface-variant">
            <input type="checkbox" checked={spec.copy.captura.pedirWhatsapp} onChange={(e) => updateCaptura({ pedirWhatsapp: e.target.checked })} />
            Pedir WhatsApp además de email
          </label>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Imagen (URL, opcional)</label>
            <input type="text" value={spec.imagenes.capturaUrl} onChange={(e) => updateImagenes({ capturaUrl: e.target.value })} placeholder="https://…" className={inputClass} />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPaso(1)} className="press text-[13px] px-3 py-1.5 rounded-full border border-outline text-on-surface-variant">
              Atrás
            </button>
            <button type="button" onClick={() => setPaso(3)} className="press bg-primary text-on-primary font-semibold rounded-md px-4 py-2.5 text-[14px] transition-transform duration-150">
              Siguiente
            </button>
          </div>
        </div>
      )}

      {paso === 3 && (
        <div className={cardClass}>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Título de la encuesta</label>
            <input type="text" value={spec.copy.encuestaIntro.titulo} onChange={(e) => updateEncuestaIntro({ titulo: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Subtítulo</label>
            <input type="text" value={spec.copy.encuestaIntro.subtitulo} onChange={(e) => updateEncuestaIntro({ subtitulo: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Preguntas</label>
            {spec.encuesta.map((p, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-md bg-background border border-outline p-3">
                <div className="flex items-center gap-2">
                  <input type="text" value={p.texto} onChange={(e) => setPregunta(i, { texto: e.target.value })} placeholder="Texto de la pregunta" className={inputClass} />
                  <select value={p.tipo} onChange={(e) => setPregunta(i, { tipo: e.target.value as PreguntaEncuesta["tipo"] })} className={`${inputClass} w-40 shrink-0`}>
                    <option value="abierta">Respuesta abierta</option>
                    <option value="opciones">Opción múltiple</option>
                  </select>
                  <button type="button" onClick={() => removePregunta(i)} className="press text-[12px] px-2.5 py-1.5 rounded-md border border-outline text-on-surface-variant shrink-0">
                    Quitar
                  </button>
                </div>
                {p.tipo === "opciones" && (
                  <input
                    type="text"
                    value={p.opciones.join(", ")}
                    onChange={(e) => setPregunta(i, { opciones: e.target.value.split(",").map((o) => o.trim()) })}
                    placeholder="Opción A, Opción B, Opción C"
                    className={inputClass}
                  />
                )}
              </div>
            ))}
            <button type="button" onClick={addPregunta} className="press text-[13px] px-3 py-1.5 rounded-md border border-outline text-on-surface-variant self-start">
              + Agregar pregunta
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Texto del botón</label>
            <input type="text" value={spec.copy.encuestaIntro.textoBoton} onChange={(e) => updateEncuestaIntro({ textoBoton: e.target.value })} className={inputClass} />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPaso(2)} className="press text-[13px] px-3 py-1.5 rounded-full border border-outline text-on-surface-variant">
              Atrás
            </button>
            <button type="button" onClick={() => setPaso(4)} className="press bg-primary text-on-primary font-semibold rounded-md px-4 py-2.5 text-[14px] transition-transform duration-150">
              Siguiente
            </button>
          </div>
        </div>
      )}

      {paso === 4 && (
        <div className={cardClass}>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Título</label>
            <input type="text" value={spec.gracias.titulo} onChange={(e) => updateGracias({ titulo: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Subtítulo</label>
            <input type="text" value={spec.gracias.subtitulo} onChange={(e) => updateGracias({ subtitulo: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Texto del botón (opcional)</label>
            <input type="text" value={spec.gracias.textoBoton} onChange={(e) => updateGracias({ textoBoton: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Link del botón (ej. grupo de WhatsApp)</label>
            <input type="text" value={spec.gracias.linkBoton} onChange={(e) => updateGracias({ linkBoton: e.target.value })} placeholder="https://chat.whatsapp.com/…" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Imagen (URL, opcional)</label>
            <input type="text" value={spec.imagenes.graciasUrl} onChange={(e) => updateImagenes({ graciasUrl: e.target.value })} placeholder="https://…" className={inputClass} />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPaso(3)} className="press text-[13px] px-3 py-1.5 rounded-full border border-outline text-on-surface-variant">
              Atrás
            </button>
            <button type="button" onClick={() => setPaso(5)} className="press bg-primary text-on-primary font-semibold rounded-md px-4 py-2.5 text-[14px] transition-transform duration-150">
              Siguiente
            </button>
          </div>
        </div>
      )}

      {paso === 5 && (
        <div className={cardClass}>
          <div className="flex flex-wrap gap-2">
            {(["captura", "encuesta", "gracias"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPreviewTab(tab)}
                className={`press text-[13px] px-3 py-1.5 rounded-full border transition-colors duration-150 ${
                  previewTab === tab ? "border-primary text-primary" : "border-outline text-on-surface-variant"
                }`}
              >
                {tab === "captura" ? "Captura" : tab === "encuesta" ? "Encuesta" : "Gracias"}
              </button>
            ))}
            <button type="button" onClick={generarPreview} disabled={generandoPreview} className="press text-[13px] px-3 py-1.5 rounded-full border border-outline text-on-surface-variant ml-auto">
              {generandoPreview ? "Actualizando…" : "Actualizar vista previa"}
            </button>
          </div>

          {preview ? (
            <iframe
              key={previewTab}
              sandbox="allow-scripts allow-forms allow-same-origin"
              srcDoc={preview[previewTab].html}
              className="w-full rounded-md border border-outline bg-white"
              style={{ height: 520 }}
              title={`Vista previa — ${previewTab}`}
            />
          ) : (
            <p className="text-[14px] text-on-surface-variant">Generando vista previa…</p>
          )}

          {accionError && <p className="text-sm text-error">{accionError}</p>}

          {resultados && (
            <div className="flex flex-col gap-1.5 rounded-md bg-background border border-outline p-3">
              {(["captura", "encuesta", "gracias"] as const).map((tipo) => {
                const r = resultados[tipo];
                if (!r) return null;
                return (
                  <div key={tipo} className="text-[13px] text-on-surface-variant">
                    <span className="font-medium text-on-surface capitalize">{tipo}: </span>
                    {r.omitido ? "omitida" : r.ok ? (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        {r.url}
                      </a>
                    ) : (
                      <span className="text-error">{r.error || "error al publicar"}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setPaso(4)} className="press text-[13px] px-3 py-1.5 rounded-full border border-outline text-on-surface-variant">
              Atrás
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={guardando || publicando}
              className="press text-[14px] px-4 py-2.5 rounded-md border border-outline text-on-surface disabled:opacity-50 transition-transform duration-150"
            >
              {guardando ? "Guardando…" : "Guardar borrador"}
            </button>
            {wpEstado?.conectado ? (
              <button
                type="button"
                onClick={guardarYPublicar}
                disabled={guardando || publicando}
                className="press bg-primary text-on-primary font-semibold rounded-md px-4 py-2.5 text-[14px] disabled:opacity-50 disabled:active:scale-100 transition-transform duration-150"
              >
                {publicando ? "Publicando…" : "Guardar y publicar en WordPress"}
              </button>
            ) : (
              <button type="button" onClick={openConfiguracion} className="press text-[14px] px-4 py-2.5 rounded-md border border-primary text-primary transition-transform duration-150">
                Conectar WordPress para publicar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
