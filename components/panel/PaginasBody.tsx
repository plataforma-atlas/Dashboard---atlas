"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSidePanel } from "@/components/SidePanelProvider";
import {
  paginaSpecVacio,
  slugsDePagina,
  generarHtmlEncuesta,
  preguntaDemo,
  type PaginaSpec,
  type Colores,
  type CopyCaptura,
  type CopyEncuestaIntro,
  type Gracias,
  type Imagenes,
  type PreguntaEncuesta,
  type Flujo,
  type SlugsPaginas,
  type WhatsappFormato,
  type SeccionMecanismo,
  type SeccionChecklist,
  type SeccionExperto,
  type PlantillaEncuesta,
} from "@/lib/paginas/templates";

function listSet(list: string[], i: number, value: string): string[] {
  return list.map((v, idx) => (idx === i ? value : v));
}
function listAdd(list: string[]): string[] {
  return [...list, ""];
}
function listRemove(list: string[], i: number): string[] {
  return list.filter((_, idx) => idx !== i);
}

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

type PasoKey = "basicos" | "funil" | "flujo" | "modelo" | "colores" | "captura" | "encuesta" | "gracias" | "revision";

const STEP_DEFS: { key: PasoKey; label: string }[] = [
  { key: "basicos", label: "Datos básicos" },
  { key: "funil", label: "Funil" },
  { key: "flujo", label: "Flujo" },
  { key: "modelo", label: "Modelo" },
  { key: "colores", label: "Colores" },
  { key: "captura", label: "Copy — Captura" },
  { key: "encuesta", label: "Encuesta" },
  { key: "gracias", label: "Gracias" },
  { key: "revision", label: "Revisión" },
];

const FUNNEL_OPTIONS: { value: PaginaSpec["tipo_funil"]; label: string; descripcion: string; pasos: string[] }[] = [
  {
    value: "webinario",
    label: "Webinario",
    descripcion:
      "El embudo clásico de webinario automático: vendé el evento en vivo, calificá al lead con una encuesta rápida, y llevalo hasta el día del webinario.",
    pasos: [
      "El lead se registra en la página de captura del webinario.",
      "Cae directo al grupo de WhatsApp del webinario.",
      "Responde una encuesta corta para calificarlo.",
      "Recibe los recordatorios de tu automatización hasta el día del evento.",
    ],
  },
  {
    value: "sesion_estrategica",
    label: "Sesión estratégica",
    descripcion: "Pensado para agendar llamadas 1 a 1: filtrá quién realmente aplica antes de ofrecerle un horario.",
    pasos: [
      "El lead se registra para aplicar a una sesión estratégica gratuita.",
      "Responde una breve encuesta de calificación.",
      "Si califica, agenda su sesión; si no, queda en lista de espera.",
    ],
  },
];

const FLUJO_OPTIONS: { value: Flujo; label: string; paginas: number; descripcion: string }[] = [
  {
    value: "captura_encuesta_gracias",
    label: "Captura + Encuesta + Gracias",
    paginas: 3,
    descripcion:
      "El lead completa el formulario, responde una encuesta corta (queda guardada en el mismo registro, identificado por su email o WhatsApp) y recién ahí llega a la página de gracias. Recomendada si necesitás calificar o segmentar tus leads.",
  },
  {
    value: "captura_gracias",
    label: "Captura + Gracias",
    paginas: 2,
    descripcion:
      "El lead completa el formulario y pasa directo a la página de gracias con el botón de acceso (grupo de WhatsApp, sala del webinario, etc). Sin encuesta.",
  },
];

const TEMPLATES: { id: string; nombre: string; disponible: boolean; descripcion: string; colorVista: string }[] = [
  {
    id: "clasica-01",
    nombre: "Estándar",
    disponible: true,
    descripcion:
      "Hero con foto de fondo + 4 secciones (mecanismo, checklist, quién conduce) + CTA fijo global. Todos los botones abren el mismo popup con el formulario.",
    colorVista: "linear-gradient(160deg, #123524, #05100a)",
  },
  {
    id: "urgencia",
    nombre: "Urgencia",
    disponible: false,
    descripcion: "Centrada al 100%: barra de urgencia/contador + hero con foto de fondo + retos + beneficios + quién conduce.",
    colorVista: "linear-gradient(160deg, #4a2600, #1a0f00)",
  },
  {
    id: "webinario-vsl",
    nombre: "Webinario + VSL",
    disponible: false,
    descripcion: "Hero con video (VSL) + contraste antes/después + 3 pasos + 4 entregables. Cada botón abre el popup, sin formulario visible en la página.",
    colorVista: "linear-gradient(160deg, #0a1a33, #000814)",
  },
];

const WHATSAPP_FORMATOS: { value: WhatsappFormato; label: string; ejemplo: string; detalle: string }[] = [
  {
    value: "internacional",
    label: "Internacional — código de país + número",
    ejemplo: "+57 321 8998981",
    detalle: "Formato LATAM estándar (código de país + número); el código de país es obligatorio.",
  },
  {
    value: "brasil",
    label: "Brasil — DDD + número",
    ejemplo: "(11) 91234-5678",
    detalle: "Valida 10-11 dígitos, sin código de país.",
  },
];

const PLANTILLAS_ENCUESTA: { id: PlantillaEncuesta; nombre: string; descripcion: string; colorVista: string }[] = [
  {
    id: "padrao",
    nombre: "Estándar",
    descripcion: "Card centrada en los colores de la página, opciones con letra (A/B/C…) y barra de progreso.",
    colorVista: "linear-gradient(160deg, #1c1030, #05030a)",
  },
  {
    id: "urgencia",
    nombre: "Urgencia",
    descripcion: "Quiz claro estilo funil de anuncio: barra de progreso fija arriba, opciones con círculo o emoji.",
    colorVista: "linear-gradient(160deg, #f0f0f3, #d8d8de)",
  },
];

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
  const [paso, setPaso] = useState<PasoKey>("basicos");

  const [guardando, setGuardando] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [accionError, setAccionError] = useState<string | null>(null);
  const [resultados, setResultados] = useState<ResultadosPublicacion | null>(null);

  const [preview, setPreview] = useState<{ captura: HtmlGenerado; encuesta: HtmlGenerado | null; gracias: HtmlGenerado } | null>(null);
  const [previewTab, setPreviewTab] = useState<"captura" | "encuesta" | "gracias">("captura");
  const [generandoPreview, setGenerandoPreview] = useState(false);
  const [previewPlantillaEncuesta, setPreviewPlantillaEncuesta] = useState<PlantillaEncuesta | null>(null);

  const conEncuesta = spec.copy.flujo === "captura_encuesta_gracias";
  const visibleSteps = STEP_DEFS.filter((s) => s.key !== "encuesta" || conEncuesta);

  function avanzar() {
    const idx = visibleSteps.findIndex((s) => s.key === paso);
    if (idx >= 0 && idx < visibleSteps.length - 1) setPaso(visibleSteps[idx + 1].key);
  }
  function retroceder() {
    const idx = visibleSteps.findIndex((s) => s.key === paso);
    if (idx > 0) setPaso(visibleSteps[idx - 1].key);
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
    setPaso("basicos");
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
          flujo: p.copy?.flujo === "captura_gracias" ? "captura_gracias" : base.copy.flujo,
          slugsPaginas: { ...base.copy.slugsPaginas, ...(p.copy?.slugsPaginas || {}) },
          captura: {
            ...base.copy.captura,
            ...(p.copy?.captura || {}),
            mecanismo: { ...base.copy.captura.mecanismo, ...(p.copy?.captura?.mecanismo || {}) },
            checklist: { ...base.copy.captura.checklist, ...(p.copy?.captura?.checklist || {}) },
            experto: { ...base.copy.captura.experto, ...(p.copy?.captura?.experto || {}) },
          },
          encuestaIntro: { ...base.copy.encuestaIntro, ...(p.copy?.encuestaIntro || {}) },
        },
        encuesta: Array.isArray(p.encuesta)
          ? p.encuesta.map((q: Partial<PreguntaEncuesta>) => ({
              texto: q.texto || "",
              tipo: q.tipo === "abierta" ? "abierta" : "opciones",
              opciones: Array.isArray(q.opciones) ? q.opciones : [],
              emojis: Array.isArray(q.emojis) ? q.emojis : [],
            }))
          : base.encuesta,
        gracias: { ...base.gracias, ...(p.gracias || {}) },
        imagenes: { ...base.imagenes, ...(p.imagenes || {}) },
      });
      setEditingId(id);
      setSlugTocado(true);
      setPaso("basicos");
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
  function updateFlujo(flujo: Flujo) {
    setSpec((prev) => ({ ...prev, copy: { ...prev.copy, flujo } }));
  }
  function updateSlugsPaginas(patch: Partial<SlugsPaginas>) {
    setSpec((prev) => ({ ...prev, copy: { ...prev.copy, slugsPaginas: { ...prev.copy.slugsPaginas, ...patch } } }));
  }
  function updateCaptura(patch: Partial<CopyCaptura>) {
    setSpec((prev) => ({ ...prev, copy: { ...prev.copy, captura: { ...prev.copy.captura, ...patch } } }));
  }
  function updateMecanismo(patch: Partial<SeccionMecanismo>) {
    setSpec((prev) => ({ ...prev, copy: { ...prev.copy, captura: { ...prev.copy.captura, mecanismo: { ...prev.copy.captura.mecanismo, ...patch } } } }));
  }
  function updateChecklist(patch: Partial<SeccionChecklist>) {
    setSpec((prev) => ({ ...prev, copy: { ...prev.copy, captura: { ...prev.copy.captura, checklist: { ...prev.copy.captura.checklist, ...patch } } } }));
  }
  function updateExperto(patch: Partial<SeccionExperto>) {
    setSpec((prev) => ({ ...prev, copy: { ...prev.copy, captura: { ...prev.copy.captura, experto: { ...prev.copy.captura.experto, ...patch } } } }));
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

  function editorLista(valores: string[], onChange: (nuevos: string[]) => void, placeholder?: string) {
    return (
      <div className="flex flex-col gap-2">
        {valores.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={v}
              onChange={(e) => onChange(listSet(valores, i, e.target.value))}
              placeholder={placeholder}
              className="w-full bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface focus:border-primary outline-none transition-colors duration-150"
            />
            <button type="button" onClick={() => onChange(listRemove(valores, i))} className="press text-[12px] px-2.5 py-1.5 rounded-md border border-outline text-on-surface-variant shrink-0">
              Quitar
            </button>
          </div>
        ))}
        <button type="button" onClick={() => onChange(listAdd(valores))} className="press text-[13px] px-3 py-1.5 rounded-md border border-outline text-on-surface-variant self-start">
          + Agregar
        </button>
      </div>
    );
  }

  function setPregunta(i: number, patch: Partial<PreguntaEncuesta>) {
    setSpec((prev) => ({ ...prev, encuesta: prev.encuesta.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) }));
  }
  function addPregunta() {
    setSpec((prev) => ({ ...prev, encuesta: [...prev.encuesta, { texto: "", tipo: "opciones", opciones: [], emojis: [] }] }));
  }
  function removePregunta(i: number) {
    setSpec((prev) => ({ ...prev, encuesta: prev.encuesta.filter((_, idx) => idx !== i) }));
  }

  function emojisAlineados(p: PreguntaEncuesta): string[] {
    return p.opciones.map((_, i) => p.emojis[i] || "");
  }
  function setOpcion(preguntaIdx: number, opcionIdx: number, value: string) {
    setPregunta(preguntaIdx, { opciones: listSet(spec.encuesta[preguntaIdx].opciones, opcionIdx, value) });
  }
  function addOpcion(preguntaIdx: number) {
    setPregunta(preguntaIdx, { opciones: listAdd(spec.encuesta[preguntaIdx].opciones) });
  }
  function removeOpcion(preguntaIdx: number, opcionIdx: number) {
    const p = spec.encuesta[preguntaIdx];
    setPregunta(preguntaIdx, { opciones: listRemove(p.opciones, opcionIdx), emojis: listRemove(emojisAlineados(p), opcionIdx) });
  }
  function setEmoji(preguntaIdx: number, opcionIdx: number, value: string) {
    const p = spec.encuesta[preguntaIdx];
    setPregunta(preguntaIdx, { emojis: listSet(emojisAlineados(p), opcionIdx, value) });
  }
  function elegirPlantillaEncuesta(plantilla: PlantillaEncuesta) {
    updateEncuestaIntro({ plantilla });
    setPreviewPlantillaEncuesta(plantilla);
  }

  function onNombreChange(value: string) {
    updateSpec({ nombre: value, slug: slugTocado ? spec.slug : slugify(value) });
  }

  // Al entrar al paso "Flujo" por primera vez, sugerimos los 3 slugs a partir
  // del slug base — de ahí en más el cliente los edita a mano sin que se
  // vuelvan a pisar solos.
  useEffect(() => {
    if (paso !== "flujo") return;
    const s = spec.copy.slugsPaginas;
    if (!s.captura && !s.encuesta && !s.gracias && spec.slug) {
      updateSlugsPaginas(slugsDePagina(spec.slug));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso]);

  // Si el flujo pasa a 2 páginas mientras la pestaña de vista previa activa
  // era "encuesta", volvemos a "captura" para no quedar en una pestaña que ya no existe.
  useEffect(() => {
    if (!conEncuesta && previewTab === "encuesta") setPreviewTab("captura");
  }, [conEncuesta, previewTab]);

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
    if (vista === "wizard" && paso === "revision") generarPreview();
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

  const puedeAvanzarBasicos = spec.nombre.trim().length > 0 && spec.slug.trim().length > 0;
  const puedeAvanzarFlujo =
    spec.copy.slugsPaginas.captura.trim().length > 0 &&
    spec.copy.slugsPaginas.gracias.trim().length > 0 &&
    (!conEncuesta || spec.copy.slugsPaginas.encuesta.trim().length > 0);

  const inputClass =
    "w-full bg-background border border-outline rounded-md px-3 py-2 text-[14px] text-on-surface focus:border-primary outline-none transition-colors duration-150";
  const labelClass = "text-[13px] font-medium text-on-surface-variant";
  const cardClass = "animate-fade-in-up rounded-lg border border-outline bg-surface p-5 flex flex-col gap-4";
  const botonAtras = "press text-[13px] px-3 py-1.5 rounded-full border border-outline text-on-surface-variant";
  const botonSiguiente =
    "press bg-primary text-on-primary font-semibold rounded-md px-4 py-2.5 text-[14px] disabled:opacity-50 disabled:active:scale-100 transition-transform duration-150";

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

  const previewEncuestaHtml = previewPlantillaEncuesta
    ? generarHtmlEncuesta(
        {
          ...spec,
          encuesta: spec.encuesta.length ? spec.encuesta : [preguntaDemo()],
          copy: {
            ...spec.copy,
            encuestaIntro: {
              ...spec.copy.encuestaIntro,
              plantilla: previewPlantillaEncuesta,
              titulo: spec.copy.encuestaIntro.titulo || "Esta información nos ayudará a entender mejor tu negocio.",
              textoBoton: spec.copy.encuestaIntro.textoBoton || "Continuar",
            },
          },
        },
        { eventoUrl: "#", clienteId: "", paginaId: "preview", urlGracias: "#" }
      )
    : null;

  // vista === "wizard"
  return (
    <>
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
        {visibleSteps.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setPaso(s.key)}
            className={`press text-[12.5px] px-3 py-1.5 rounded-full border transition-colors duration-150 ${
              paso === s.key ? "border-primary text-primary" : "border-outline text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {i + 1}. {s.label}
          </button>
        ))}
      </div>

      {paso === "basicos" && (
        <div className={cardClass}>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Nombre del embudo</label>
            <input type="text" value={spec.nombre} onChange={(e) => onNombreChange(e.target.value)} placeholder="Ej. Webinar Octubre 2026" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Slug base (identificador interno)</label>
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
          <button type="button" disabled={!puedeAvanzarBasicos} onClick={avanzar} className={`${botonSiguiente} self-start`}>
            Siguiente
          </button>
        </div>
      )}

      {paso === "funil" && (
        <div className={cardClass}>
          <p className="text-[14px] text-on-surface-variant">
            Elegí el tipo de embudo — define qué le mostramos al lead y qué recorrido hace después de dejar sus datos.
          </p>
          <div className="flex flex-col gap-3">
            {FUNNEL_OPTIONS.map((opt) => {
              const activo = spec.tipo_funil === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateSpec({ tipo_funil: opt.value })}
                  className={`press text-left rounded-lg border p-4 flex flex-col gap-2 transition-colors duration-150 ${
                    activo ? "border-primary bg-surface-high" : "border-outline hover:border-primary"
                  }`}
                >
                  <span className="text-[14.5px] font-semibold text-on-surface">{opt.label}</span>
                  <span className="text-[13px] text-on-surface-variant">{opt.descripcion}</span>
                  <ol className="flex flex-col gap-1 mt-1">
                    {opt.pasos.map((p, i) => (
                      <li key={i} className="text-[12.5px] text-on-surface-variant flex gap-2">
                        <span className="text-primary font-semibold shrink-0">{i + 1}.</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ol>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={retroceder} className={botonAtras}>
              Atrás
            </button>
            <button type="button" onClick={avanzar} className={botonSiguiente}>
              Siguiente
            </button>
          </div>
        </div>
      )}

      {paso === "flujo" && (
        <div className={cardClass}>
          <p className="text-[14px] text-on-surface-variant">¿Cuántas páginas necesita este embudo?</p>
          <div className="flex flex-col gap-3">
            {FLUJO_OPTIONS.map((opt) => {
              const activo = spec.copy.flujo === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateFlujo(opt.value)}
                  className={`press text-left rounded-lg border p-4 flex flex-col gap-2 transition-colors duration-150 ${
                    activo ? "border-primary bg-surface-high" : "border-outline hover:border-primary"
                  }`}
                >
                  <span className="text-[14.5px] font-semibold text-on-surface">
                    {opt.label} <span className="text-on-surface-variant font-normal">· {opt.paginas} páginas</span>
                  </span>
                  <span className="text-[13px] text-on-surface-variant">{opt.descripcion}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 pt-2 border-t border-outline">
            <label className={labelClass}>Slug — página de captura</label>
            <input
              type="text"
              value={spec.copy.slugsPaginas.captura}
              onChange={(e) => updateSlugsPaginas({ captura: slugify(e.target.value) })}
              className={inputClass}
            />
            {conEncuesta && (
              <>
                <label className={labelClass}>Slug — página de encuesta</label>
                <input
                  type="text"
                  value={spec.copy.slugsPaginas.encuesta}
                  onChange={(e) => updateSlugsPaginas({ encuesta: slugify(e.target.value) })}
                  className={inputClass}
                />
              </>
            )}
            <label className={labelClass}>Slug — página de gracias</label>
            <input
              type="text"
              value={spec.copy.slugsPaginas.gracias}
              onChange={(e) => updateSlugsPaginas({ gracias: slugify(e.target.value) })}
              className={inputClass}
            />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={retroceder} className={botonAtras}>
              Atrás
            </button>
            <button type="button" disabled={!puedeAvanzarFlujo} onClick={avanzar} className={botonSiguiente}>
              Siguiente
            </button>
          </div>
        </div>
      )}

      {paso === "modelo" && (
        <div className={cardClass}>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Modelo de la página de captura</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TEMPLATES.map((t) => {
                const activo = spec.plantilla === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={!t.disponible}
                    onClick={() => updateSpec({ plantilla: t.id })}
                    className={`press text-left rounded-lg border overflow-hidden flex flex-col transition-colors duration-150 ${
                      !t.disponible ? "opacity-50 cursor-not-allowed border-outline" : activo ? "border-primary" : "border-outline hover:border-primary"
                    }`}
                  >
                    <div className="h-24 flex flex-col justify-end gap-1 p-3 shrink-0" style={{ background: t.colorVista }}>
                      <div className="h-1.5 w-2/3 rounded-full bg-white/70" />
                      <div className="h-1.5 w-1/2 rounded-full bg-white/40" />
                      <div className="h-4 w-16 rounded-full bg-white/90 mt-1" />
                    </div>
                    <div className="p-3 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13.5px] font-semibold text-on-surface">{t.nombre}</span>
                        {!t.disponible && (
                          <span className="text-[10.5px] px-1.5 py-0.5 rounded-full border border-outline text-on-surface-faint shrink-0">
                            Próximamente
                          </span>
                        )}
                      </div>
                      <span className="text-[12px] text-on-surface-variant leading-snug">{t.descripcion}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 border-t border-outline">
            <label className="flex items-center gap-2 text-[13px] text-on-surface-variant">
              <input type="checkbox" checked={spec.copy.captura.pedirWhatsapp} onChange={(e) => updateCaptura({ pedirWhatsapp: e.target.checked })} />
              Pedir WhatsApp en el formulario de captura
            </label>
            {spec.copy.captura.pedirWhatsapp && (
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Formato del WhatsApp en el popup</label>
                {WHATSAPP_FORMATOS.map((f) => {
                  const activo = spec.copy.captura.whatsappFormato === f.value;
                  return (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => updateCaptura({ whatsappFormato: f.value })}
                      className={`press text-left rounded-md border p-3 flex flex-col gap-1 transition-colors duration-150 ${
                        activo ? "border-primary bg-surface-high" : "border-outline hover:border-primary"
                      }`}
                    >
                      <span className="text-[13.5px] font-medium text-on-surface">{f.label}</span>
                      <span className="text-[12px] text-on-surface-variant">
                        Ej.: {f.ejemplo} · {f.detalle}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={retroceder} className={botonAtras}>
              Atrás
            </button>
            <button type="button" onClick={avanzar} className={botonSiguiente}>
              Siguiente
            </button>
          </div>
        </div>
      )}

      {paso === "colores" && (
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
            <button type="button" onClick={retroceder} className={botonAtras}>
              Atrás
            </button>
            <button type="button" onClick={avanzar} className={botonSiguiente}>
              Siguiente
            </button>
          </div>
        </div>
      )}

      {paso === "captura" && (
        <div className={cardClass}>
          <p className="text-[13px] text-on-surface-variant">
            Todos los botones "{spec.copy.captura.textoBoton || "…"}" de la página abren el mismo popup con el formulario — no hay
            formulario suelto en el medio de la página, igual que en las páginas de referencia.
          </p>

          <span className="text-xs uppercase tracking-wide text-on-surface-faint">Hero</span>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Badge (fecha/hora, opcional)</label>
            <input type="text" value={spec.copy.captura.badge} onChange={(e) => updateCaptura({ badge: e.target.value })} placeholder="Próximo martes a las 7:00 PM hora Colombia" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Título — envolvé una palabra en **así** para resaltarla</label>
            <input type="text" value={spec.copy.captura.titulo} onChange={(e) => updateCaptura({ titulo: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Subtítulo</label>
            <input type="text" value={spec.copy.captura.subtitulo} onChange={(e) => updateCaptura({ subtitulo: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Texto del botón (se repite en toda la página)</label>
            <input type="text" value={spec.copy.captura.textoBoton} onChange={(e) => updateCaptura({ textoBoton: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Frases de confianza (debajo del botón del hero)</label>
            {editorLista(spec.copy.captura.trustBullets, (v) => updateCaptura({ trustBullets: v }), "Ej. Cupos limitados")}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Imagen de fondo del hero (URL, opcional)</label>
            <input type="text" value={spec.imagenes.capturaUrl} onChange={(e) => updateImagenes({ capturaUrl: e.target.value })} placeholder="https://…" className={inputClass} />
          </div>

          <span className="text-xs uppercase tracking-wide text-on-surface-faint pt-2 border-t border-outline">Mecanismo</span>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Eyebrow (etiqueta pequeña arriba del título)</label>
            <input type="text" value={spec.copy.captura.mecanismo.eyebrow} onChange={(e) => updateMecanismo({ eyebrow: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Título de la sección</label>
            <input type="text" value={spec.copy.captura.mecanismo.titulo} onChange={(e) => updateMecanismo({ titulo: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Párrafos</label>
            {editorLista(spec.copy.captura.mecanismo.parrafos, (v) => updateMecanismo({ parrafos: v }), "Un párrafo de texto")}
          </div>

          <span className="text-xs uppercase tracking-wide text-on-surface-faint pt-2 border-t border-outline">Para quién es (checklist)</span>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Eyebrow</label>
            <input type="text" value={spec.copy.captura.checklist.eyebrow} onChange={(e) => updateChecklist({ eyebrow: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Título de la sección</label>
            <input type="text" value={spec.copy.captura.checklist.titulo} onChange={(e) => updateChecklist({ titulo: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Items del checklist</label>
            {editorLista(spec.copy.captura.checklist.items, (v) => updateChecklist({ items: v }), "Ej. Semanas de presión en cada lanzamiento")}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Nota final (opcional, ej. "Cupos limitados")</label>
            <input type="text" value={spec.copy.captura.checklist.notaFinal} onChange={(e) => updateChecklist({ notaFinal: e.target.value })} className={inputClass} />
          </div>

          <span className="text-xs uppercase tracking-wide text-on-surface-faint pt-2 border-t border-outline">Quién conduce (experto)</span>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Eyebrow</label>
            <input type="text" value={spec.copy.captura.experto.eyebrow} onChange={(e) => updateExperto({ eyebrow: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Título de la sección</label>
            <input type="text" value={spec.copy.captura.experto.titulo} onChange={(e) => updateExperto({ titulo: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Foto del experto (URL, circular)</label>
            <input type="text" value={spec.copy.captura.experto.fotoUrl} onChange={(e) => updateExperto({ fotoUrl: e.target.value })} placeholder="https://…" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Párrafos de la bio</label>
            {editorLista(spec.copy.captura.experto.parrafos, (v) => updateExperto({ parrafos: v }), "Un párrafo de la bio")}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Frase destacada (opcional, va en negrita)</label>
            <input type="text" value={spec.copy.captura.experto.fraseDestacada} onChange={(e) => updateExperto({ fraseDestacada: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Números / logros (chips)</label>
            {editorLista(spec.copy.captura.experto.stats, (v) => updateExperto({ stats: v }), "Ej. +USD 8 millones en ventas generadas")}
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={retroceder} className={botonAtras}>
              Atrás
            </button>
            <button type="button" onClick={avanzar} className={botonSiguiente}>
              Siguiente
            </button>
          </div>
        </div>
      )}

      {paso === "encuesta" && (
        <div className={cardClass}>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Modelo de la encuesta — hacé click para ver una vista previa</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PLANTILLAS_ENCUESTA.map((t) => {
                const activo = spec.copy.encuestaIntro.plantilla === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => elegirPlantillaEncuesta(t.id)}
                    className={`press text-left rounded-lg border overflow-hidden flex flex-col transition-colors duration-150 ${
                      activo ? "border-primary" : "border-outline hover:border-primary"
                    }`}
                  >
                    <div className="h-24 flex flex-col justify-center items-center gap-1.5 p-3 shrink-0" style={{ background: t.colorVista }}>
                      <div className="h-1 w-2/3 rounded-full bg-white/50" />
                      <div className="h-4 w-4/5 rounded-md bg-white/80" />
                      <div className="h-4 w-4/5 rounded-md bg-white/60" />
                    </div>
                    <div className="p-3 flex flex-col gap-1">
                      <span className="text-[13.5px] font-semibold text-on-surface">{t.nombre}</span>
                      <span className="text-[12px] text-on-surface-variant leading-snug">{t.descripcion}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Título de la encuesta</label>
            <input type="text" value={spec.copy.encuestaIntro.titulo} onChange={(e) => updateEncuestaIntro({ titulo: e.target.value })} className={inputClass} />
            <p className="text-[12px] text-on-surface-variant">
              Ya viene listo — cambialo si querés. En "Estándar" aparece como título de la card; en "Urgencia", como la línea destacada
              arriba de la pregunta.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Preguntas ({spec.encuesta.length})</label>
            {spec.encuesta.map((p, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-md bg-background border border-outline p-3">
                <div className="flex items-center gap-2">
                  <input type="text" value={p.texto} onChange={(e) => setPregunta(i, { texto: e.target.value })} placeholder="Texto de la pregunta" className={inputClass} />
                  <select value={p.tipo} onChange={(e) => setPregunta(i, { tipo: e.target.value as PreguntaEncuesta["tipo"] })} className={`${inputClass} w-40 shrink-0`}>
                    <option value="opciones">Opción múltiple</option>
                    <option value="abierta">Respuesta abierta</option>
                  </select>
                  <button type="button" onClick={() => removePregunta(i)} className="press text-[12px] px-2.5 py-1.5 rounded-md border border-outline text-on-surface-variant shrink-0">
                    Quitar
                  </button>
                </div>
                {p.tipo === "opciones" && (
                  <div className="flex flex-col gap-1.5 pl-2">
                    {spec.copy.encuestaIntro.plantilla === "urgencia" && (
                      <p className="text-[11.5px] text-on-surface-faint">Cada opción tiene un campo de emoji — dejalo vacío para mostrar solo el círculo de selección.</p>
                    )}
                    {p.opciones.map((o, j) => (
                      <div key={j} className="flex items-center gap-2">
                        {spec.copy.encuestaIntro.plantilla === "urgencia" && (
                          <input
                            type="text"
                            value={emojisAlineados(p)[j]}
                            onChange={(e) => setEmoji(i, j, e.target.value)}
                            placeholder="😊"
                            className={`${inputClass} w-14 text-center shrink-0`}
                          />
                        )}
                        <input type="text" value={o} onChange={(e) => setOpcion(i, j, e.target.value)} className={inputClass} />
                        <button type="button" onClick={() => removeOpcion(i, j)} className="press text-[12px] px-2.5 py-1.5 rounded-md border border-outline text-on-surface-variant shrink-0">
                          Quitar
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addOpcion(i)} className="press text-[13px] px-3 py-1.5 rounded-md border border-outline text-on-surface-variant self-start">
                      + Agregar opción
                    </button>
                  </div>
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
            <button type="button" onClick={retroceder} className={botonAtras}>
              Atrás
            </button>
            <button type="button" onClick={avanzar} className={botonSiguiente}>
              Siguiente
            </button>
          </div>
        </div>
      )}

      {paso === "gracias" && (
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
            <button type="button" onClick={retroceder} className={botonAtras}>
              Atrás
            </button>
            <button type="button" onClick={avanzar} className={botonSiguiente}>
              Siguiente
            </button>
          </div>
        </div>
      )}

      {paso === "revision" && (
        <div className={cardClass}>
          <div className="flex flex-wrap gap-2">
            {(conEncuesta ? (["captura", "encuesta", "gracias"] as const) : (["captura", "gracias"] as const)).map((tab) => (
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

          {preview && preview[previewTab] ? (
            <iframe
              key={previewTab}
              sandbox="allow-scripts allow-forms allow-same-origin"
              srcDoc={preview[previewTab]!.html}
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
            <button type="button" onClick={retroceder} className={botonAtras}>
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
              <button type="button" onClick={guardarYPublicar} disabled={guardando || publicando} className={botonSiguiente}>
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

    {previewPlantillaEncuesta && previewEncuestaHtml && (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-5" onClick={() => setPreviewPlantillaEncuesta(null)}>
        <div className="bg-surface rounded-lg max-w-lg w-full h-[80vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between gap-4 p-4 border-b border-outline">
            <div className="flex flex-col gap-0.5">
              <span className="text-[14px] font-semibold text-on-surface">
                {PLANTILLAS_ENCUESTA.find((t) => t.id === previewPlantillaEncuesta)?.nombre} — preview
              </span>
              <span className="text-[12px] text-on-surface-variant">
                Vista previa ampliada, solo para visualizar — la página real se genera en el paso de Revisión, con tu copy.
              </span>
            </div>
            <button type="button" onClick={() => setPreviewPlantillaEncuesta(null)} className="press text-on-surface-variant hover:text-on-surface text-lg leading-none shrink-0">
              ×
            </button>
          </div>
          <iframe sandbox="allow-scripts" srcDoc={previewEncuestaHtml} className="w-full flex-1 bg-white" title="Vista previa de encuesta" />
          <div className="p-3 border-t border-outline flex justify-end">
            <button type="button" onClick={() => setPreviewPlantillaEncuesta(null)} className={botonAtras}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
