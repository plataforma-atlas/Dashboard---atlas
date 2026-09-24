// Generador de HTML para el constructor de páginas propio (sección 21 de
// DOCUMENTACION.md). Módulo "puro" sin dependencias de Next/servidor — solo
// arma strings de HTML a partir del spec del wizard. Vive en lib/ (no en
// app/api/) para poder importarse tanto desde la ruta que genera el HTML
// como, si hace falta, desde tests.
//
// Contrato real de "Núcleo — Páginas de Captación" (confirmado leyendo el
// workflow en n8n, no solo la documentación en prosa):
// - guardar: { cliente_id, nombre, slug, tipo_funil, plantilla, colores (obj),
//   copy (obj libre), encuesta (ARRAY, no objeto), gracias (obj), imagenes (obj) }
// - evento: { tipo: 'lead'|'pesquisa', nombre, email, whatsapp,
//   utm: { utm_source, utm_medium, utm_campaign, utm_term, utm_content,
//          fbclid, gclid, ttclid, referrer, landing }, respuestas } vía
//   POST a `${eventoUrl}?cliente_id=&pagina_id=` — cliente_id/pagina_id van
//   en la URL, no en el body (el nodo acepta ambos pero nosotros los mandamos
//   siempre por query, son fijos por página ya publicada).

export const PLANTILLA_ID = "clasica-01";

export type Colores = { primario: string; fondo: string; texto: string };

export type WhatsappFormato = "brasil" | "internacional";

// Estructura real relevada de páginas de referencia (johnbenalanza.com/captura-*):
// hero con foto de fondo → sección "mecanismo" → checklist ("para quién es") →
// sección del experto (foto circular + bio + stats) → footer → un CTA fijo
// pegado abajo del viewport. Ninguna de esas páginas tiene el formulario
// inline: todos los botones "Garantizar mi lugar" abren el mismo popup con
// nombre/email/WhatsApp.
export type SeccionMecanismo = { eyebrow: string; titulo: string; parrafos: string[] };
export type SeccionChecklist = { eyebrow: string; titulo: string; items: string[]; notaFinal: string };
export type SeccionExperto = {
  eyebrow: string;
  titulo: string;
  parrafos: string[];
  fotoUrl: string;
  fraseDestacada: string;
  stats: string[];
};

export type CopyCaptura = {
  badge: string;
  /** Podés resaltar una palabra/frase envolviéndola en **así** — se renderiza con el color primario. */
  titulo: string;
  subtitulo: string;
  textoBoton: string;
  trustBullets: string[];
  mecanismo: SeccionMecanismo;
  checklist: SeccionChecklist;
  experto: SeccionExperto;
  pedirWhatsapp: boolean;
  whatsappFormato: WhatsappFormato;
};

export type CopyEncuestaIntro = {
  titulo: string;
  subtitulo: string;
  textoBoton: string;
};

/** Cuántas páginas genera el embudo — sin o con encuesta intermedia. */
export type Flujo = "captura_gracias" | "captura_encuesta_gracias";

export type SlugsPaginas = { captura: string; encuesta: string; gracias: string };

// `copy` viaja como JSON libre hacia n8n (sin schema del lado del workflow —
// ver nota de contrato arriba), así que "flujo" y "slugsPaginas" viven acá
// adentro en vez de agregar columnas nuevas a `landing_pages`.
export type Copy = {
  flujo: Flujo;
  slugsPaginas: SlugsPaginas;
  captura: CopyCaptura;
  encuestaIntro: CopyEncuestaIntro;
};

export type PreguntaEncuesta = { texto: string; tipo: "opciones" | "abierta"; opciones: string[] };

export type Gracias = { titulo: string; subtitulo: string; textoBoton: string; linkBoton: string };

export type Imagenes = { capturaUrl: string; graciasUrl: string };

export type PaginaSpec = {
  nombre: string;
  slug: string;
  tipo_funil: "webinario" | "sesion_estrategica";
  plantilla: string;
  colores: Colores;
  copy: Copy;
  encuesta: PreguntaEncuesta[];
  gracias: Gracias;
  imagenes: Imagenes;
};

export function paginaSpecVacio(): PaginaSpec {
  return {
    nombre: "",
    slug: "",
    tipo_funil: "webinario",
    plantilla: PLANTILLA_ID,
    colores: { primario: "#7c3aed", fondo: "#f5f3ff", texto: "#1e1b2e" },
    copy: {
      flujo: "captura_encuesta_gracias",
      slugsPaginas: { captura: "", encuesta: "", gracias: "" },
      captura: {
        badge: "Próximo martes a las 7:00 PM hora Colombia",
        titulo: "Reservá tu lugar en la masterclass en vivo",
        subtitulo: "Aprendé en vivo cómo armar tu propio sistema — sin volver a empezar desde cero cada vez.",
        textoBoton: "Quiero mi lugar",
        trustBullets: ["Clase en vivo · Única sesión", "Cupos limitados", "100% gratuito · En vivo"],
        mecanismo: { eyebrow: "LO QUE VAS A VER EN LA CLASE", titulo: "", parrafos: [] },
        checklist: { eyebrow: "PARA QUIÉN ES ESTA CLASE", titulo: "Esta clase es para vos si…", items: [], notaFinal: "Cupos limitados" },
        experto: { eyebrow: "QUIÉN CONDUCE", titulo: "", parrafos: [], fotoUrl: "", fraseDestacada: "", stats: [] },
        pedirWhatsapp: true,
        whatsappFormato: "internacional",
      },
      encuestaIntro: {
        titulo: "Antes de continuar",
        subtitulo: "Contanos un poco más para preparar el contenido.",
        textoBoton: "Enviar respuestas",
      },
    },
    encuesta: [],
    gracias: {
      titulo: "¡Listo, ya estás dentro!",
      subtitulo: "Guardá esta página, ahí vas a encontrar todos los próximos pasos.",
      textoBoton: "Unirme al grupo de WhatsApp",
      linkBoton: "",
    },
    imagenes: { capturaUrl: "", graciasUrl: "" },
  };
}

/** Sugerencia inicial de slugs por página a partir del slug base — el wizard la usa una sola vez al entrar al paso "Flujo"; de ahí en más el cliente los edita a mano. */
export function slugsDePagina(slugBase: string): SlugsPaginas {
  const base = slugBase.trim().replace(/\/+$/, "");
  return {
    captura: base,
    encuesta: `${base}-encuesta`,
    gracias: `${base}-gracias`,
  };
}

function esc(str: string): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Serializa para incrustar en un <script> sin riesgo de cerrar la etiqueta antes de tiempo. */
function embedJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
}

/** `**palabra**` → <span class="destacado">palabra</span>, sobre texto ya escapado. */
function destacar(texto: string): string {
  return esc(texto).replace(/\*\*(.+?)\*\*/g, '<span class="destacado">$1</span>');
}

/** Negro o blanco según la luminancia del color, para que el texto de los botones sea legible con cualquier "primario". */
function colorContraste(hex: string): string {
  const limpio = hex.replace("#", "");
  if (limpio.length !== 6) return "#ffffff";
  const r = parseInt(limpio.slice(0, 2), 16);
  const g = parseInt(limpio.slice(2, 4), 16);
  const b = parseInt(limpio.slice(4, 6), 16);
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminancia > 0.6 ? "#111111" : "#ffffff";
}

function baseStyles(colores: Colores): string {
  return `
    :root { --primario: ${colores.primario}; --fondo: ${colores.fondo}; --texto: ${colores.texto}; }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; background: var(--fondo); color: var(--texto);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex; align-items: center; justify-content: center; padding: 24px;
    }
    .card {
      width: 100%; max-width: 520px; background: #ffffff; border-radius: 16px;
      padding: 32px 28px; box-shadow: 0 20px 50px -20px rgba(0,0,0,0.25);
    }
    .hero { width: 100%; border-radius: 12px; margin-bottom: 20px; display: block; }
    h1 { font-size: 26px; line-height: 1.25; margin: 0 0 8px; font-weight: 800; }
    p.sub { font-size: 15px; line-height: 1.5; margin: 0 0 20px; opacity: 0.85; }
    ul.bullets { margin: 0 0 22px; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 10px; }
    ul.bullets li { display: flex; gap: 10px; font-size: 14.5px; line-height: 1.4; }
    ul.bullets li:before { content: "✓"; color: var(--primario); font-weight: 700; flex-shrink: 0; }
    label { display: block; font-size: 13px; font-weight: 600; margin: 0 0 6px; opacity: 0.75; }
    .campo { margin-bottom: 14px; }
    input[type="text"], input[type="email"], input[type="tel"] {
      width: 100%; padding: 12px 14px; border-radius: 10px; border: 1.5px solid #e2e0ea;
      font-size: 15px; outline: none; transition: border-color 0.15s ease;
    }
    input:focus { border-color: var(--primario); }
    .opciones { display: flex; flex-direction: column; gap: 8px; }
    .opciones label { display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 14.5px; opacity: 1; margin: 0; cursor: pointer; }
    button.enviar {
      width: 100%; padding: 14px 18px; margin-top: 6px; border: none; border-radius: 10px;
      background: var(--primario); color: #fff; font-size: 15.5px; font-weight: 700; cursor: pointer;
      transition: transform 0.12s ease, opacity 0.12s ease;
    }
    button.enviar:active { transform: scale(0.98); }
    button.enviar:disabled { opacity: 0.6; cursor: default; }
    .error-msg { color: #c0392b; font-size: 13.5px; margin-top: 10px; display: none; }
    .cta-link {
      display: inline-block; text-align: center; width: 100%; padding: 14px 18px; margin-top: 10px;
      border-radius: 10px; background: var(--primario); color: #fff; font-size: 15.5px; font-weight: 700;
      text-decoration: none; box-sizing: border-box;
    }
  `;
}

// Estilos de la página de captura "Estándar" — layout largo tipo landing de
// venta, distinto del `.card` centrado que usan encuesta/gracias.
function capturaStyles(colores: Colores): string {
  const textoBoton = colorContraste(colores.primario);
  return `
    :root { --primario: ${colores.primario}; --fondo: ${colores.fondo}; --texto: ${colores.texto}; --texto-boton: ${textoBoton}; }
    * { box-sizing: border-box; }
    body {
      margin: 0; background: var(--fondo); color: var(--texto);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding-bottom: 84px;
    }
    .destacado { color: var(--primario); }
    .btn-cta {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      border: none; border-radius: 999px; background: var(--primario); color: var(--texto-boton);
      font-size: 16px; font-weight: 700; padding: 16px 28px; cursor: pointer;
      transition: transform 0.12s ease; text-decoration: none;
    }
    .btn-cta:active { transform: scale(0.98); }
    .hero {
      position: relative; padding: 72px 20px 48px; text-align: center;
      background-size: cover; background-position: center;
    }
    .hero-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(180deg, rgba(0,0,0,0.35) 0%, var(--fondo) 92%);
    }
    .hero-content { position: relative; max-width: 640px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 18px; }
    .badge {
      display: inline-block; padding: 6px 14px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.3);
      background: rgba(0,0,0,0.25); color: #fff; font-size: 12.5px; font-weight: 600; letter-spacing: 0.02em;
    }
    .hero h1 { font-size: 34px; line-height: 1.2; font-weight: 800; margin: 0; color: #fff; }
    .hero p.sub { font-size: 16px; line-height: 1.5; margin: 0; color: rgba(255,255,255,0.85); max-width: 520px; }
    .trust-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 14px; font-size: 12.5px; color: rgba(255,255,255,0.75); }
    .seccion { max-width: 640px; margin: 0 auto; padding: 56px 20px; text-align: center; border-top: 1px solid rgba(127,127,127,0.15); display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .eyebrow { font-size: 12.5px; font-weight: 700; letter-spacing: 0.08em; color: var(--primario); }
    .seccion h2 { font-size: 26px; line-height: 1.3; font-weight: 800; margin: 0; }
    .parrafo { font-size: 15px; line-height: 1.6; opacity: 0.85; margin: 0; }
    .checklist { display: flex; flex-direction: column; gap: 10px; width: 100%; }
    .check-item {
      display: flex; align-items: center; gap: 10px; text-align: left; font-size: 14.5px; font-weight: 500;
      padding: 14px 18px; border-radius: 10px; border: 1px solid rgba(127,127,127,0.25);
    }
    .check-item:before { content: "✓"; color: var(--primario); font-weight: 700; flex-shrink: 0; }
    .nota-final { font-weight: 700; margin: 0; }
    .foto-experto {
      width: 220px; height: 220px; border-radius: 50%; overflow: hidden; border: 3px solid var(--primario);
      box-shadow: 0 0 32px -6px var(--primario);
    }
    .foto-experto img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .frase-destacada { font-size: 17px; font-weight: 700; border-top: 2px solid var(--primario); padding-top: 16px; margin: 0; }
    .stats-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
    .stat-pill { font-size: 13px; font-weight: 600; padding: 10px 16px; border-radius: 999px; border: 1px solid rgba(127,127,127,0.3); }
    .footer { text-align: center; font-size: 12.5px; opacity: 0.6; padding: 32px 20px; }
    .cta-fijo {
      position: fixed; left: 0; right: 0; bottom: 0; padding: 12px 16px; z-index: 40;
      background: var(--fondo); border-top: 1px solid rgba(127,127,127,0.2);
      display: flex; justify-content: center;
    }
    .cta-fijo .btn-cta { width: 100%; max-width: 420px; }
    .popup-overlay {
      display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100;
      align-items: center; justify-content: center; padding: 20px;
    }
    .popup-overlay.activo { display: flex; }
    .popup-card {
      position: relative; width: 100%; max-width: 420px; background: #ffffff; color: #1a1a1a;
      border-radius: 16px; padding: 32px 28px; box-shadow: 0 20px 50px -20px rgba(0,0,0,0.4);
    }
    .popup-cerrar {
      position: absolute; top: 12px; right: 14px; border: none; background: none; font-size: 22px;
      line-height: 1; cursor: pointer; color: #888;
    }
    .popup-card h3 { font-size: 20px; margin: 0 0 18px; padding-right: 20px; }
    .popup-card label { display: block; font-size: 13px; font-weight: 600; margin: 0 0 6px; opacity: 0.75; }
    .popup-card .campo { margin-bottom: 14px; }
    .popup-card input[type="text"], .popup-card input[type="email"], .popup-card input[type="tel"] {
      width: 100%; padding: 12px 14px; border-radius: 10px; border: 1.5px solid #e2e0ea;
      font-size: 15px; outline: none; transition: border-color 0.15s ease;
    }
    .popup-card input:focus { border-color: var(--primario); }
    .popup-card button[type="submit"] { width: 100%; margin-top: 6px; }
    .popup-card button[type="submit"]:disabled { opacity: 0.6; cursor: default; }
    .popup-card .error-msg { color: #c0392b; font-size: 13.5px; margin-top: 10px; display: none; }
  `;
}

const UTM_SCRIPT = `
  function leerUtm() {
    var p = new URLSearchParams(window.location.search);
    return {
      utm_source: p.get('utm_source') || '',
      utm_medium: p.get('utm_medium') || '',
      utm_campaign: p.get('utm_campaign') || '',
      utm_term: p.get('utm_term') || '',
      utm_content: p.get('utm_content') || '',
      fbclid: p.get('fbclid') || '',
      gclid: p.get('gclid') || '',
      ttclid: p.get('ttclid') || '',
      referrer: document.referrer || '',
      landing: window.location.href
    };
  }
`;

export function generarHtmlCaptura(
  spec: PaginaSpec,
  opts: { eventoUrl: string; clienteId: string; paginaId: number | string; urlSiguiente: string }
): string {
  const c = spec.copy.captura;
  const whatsappPlaceholder = c.whatsappFormato === "brasil" ? "(11) 91234-5678" : "+57 321 8998981";
  const eventoFullUrl = `${opts.eventoUrl}?cliente_id=${encodeURIComponent(opts.clienteId)}&pagina_id=${encodeURIComponent(
    String(opts.paginaId)
  )}`;

  const heroBg = spec.imagenes.capturaUrl ? ` style="background-image:url('${esc(spec.imagenes.capturaUrl)}')"` : "";
  const trustRow = (c.trustBullets || [])
    .filter((b) => b.trim())
    .map((b) => `<span>✓ ${esc(b)}</span>`)
    .join('<span>·</span>');

  const m = c.mecanismo;
  const seccionMecanismo =
    m.titulo || m.parrafos.some((p) => p.trim())
      ? `<section class="seccion">
        <span class="eyebrow">${esc(m.eyebrow)}</span>
        <h2>${destacar(m.titulo)}</h2>
        ${m.parrafos.filter((p) => p.trim()).map((p) => `<p class="parrafo">${esc(p)}</p>`).join("")}
        <button type="button" class="btn-cta abrir-popup">${esc(c.textoBoton)} →</button>
      </section>`
      : "";

  const ch = c.checklist;
  const itemsChecklist = (ch.items || []).filter((i) => i.trim());
  const seccionChecklist = itemsChecklist.length
    ? `<section class="seccion">
        <span class="eyebrow">${esc(ch.eyebrow)}</span>
        <h2>${destacar(ch.titulo)}</h2>
        <div class="checklist">${itemsChecklist.map((i) => `<div class="check-item">${esc(i)}</div>`).join("")}</div>
        ${ch.notaFinal ? `<p class="nota-final">${esc(ch.notaFinal)}</p>` : ""}
        <button type="button" class="btn-cta abrir-popup">${esc(c.textoBoton)} →</button>
      </section>`
    : "";

  const e = c.experto;
  const seccionExperto =
    e.titulo || e.parrafos.some((p) => p.trim())
      ? `<section class="seccion">
        ${e.fotoUrl ? `<div class="foto-experto"><img src="${esc(e.fotoUrl)}" alt="" /></div>` : ""}
        <span class="eyebrow">${esc(e.eyebrow)}</span>
        <h2>${destacar(e.titulo)}</h2>
        ${e.parrafos.filter((p) => p.trim()).map((p) => `<p class="parrafo">${esc(p)}</p>`).join("")}
        ${e.fraseDestacada ? `<p class="frase-destacada">${esc(e.fraseDestacada)}</p>` : ""}
        ${
          e.stats.filter((s) => s.trim()).length
            ? `<div class="stats-row">${e.stats.filter((s) => s.trim()).map((s) => `<span class="stat-pill">${esc(s)}</span>`).join("")}</div>`
            : ""
        }
        <button type="button" class="btn-cta abrir-popup">${esc(c.textoBoton)} →</button>
      </section>`
      : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(spec.nombre || c.titulo)}</title>
<style>${capturaStyles(spec.colores)}</style>
</head>
<body>
  <section class="hero"${heroBg}>
    <div class="hero-overlay"></div>
    <div class="hero-content">
      ${c.badge ? `<span class="badge">${esc(c.badge)}</span>` : ""}
      <h1>${destacar(c.titulo)}</h1>
      <p class="sub">${esc(c.subtitulo)}</p>
      <button type="button" class="btn-cta abrir-popup">${esc(c.textoBoton)} →</button>
      ${trustRow ? `<div class="trust-row">${trustRow}</div>` : ""}
    </div>
  </section>

  ${seccionMecanismo}
  ${seccionChecklist}
  ${seccionExperto}

  <footer class="footer">${esc(spec.nombre)} · © ${new Date().getFullYear()}</footer>

  <div class="cta-fijo">
    <button type="button" class="btn-cta abrir-popup">${esc(c.textoBoton)} →</button>
  </div>

  <div class="popup-overlay" id="popup-overlay">
    <div class="popup-card">
      <button type="button" class="popup-cerrar" id="popup-cerrar" aria-label="Cerrar">×</button>
      <h3>${esc(c.textoBoton)}</h3>
      <form id="form-captura">
        <div class="campo">
          <label for="nombre">Nombre</label>
          <input type="text" id="nombre" name="nombre" required />
        </div>
        <div class="campo">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required />
        </div>
        ${
          c.pedirWhatsapp
            ? `<div class="campo">
          <label for="whatsapp">WhatsApp</label>
          <input type="tel" id="whatsapp" name="whatsapp" placeholder="${esc(whatsappPlaceholder)}" required />
        </div>`
            : ""
        }
        <button type="submit" class="btn-cta">${esc(c.textoBoton)}</button>
        <p class="error-msg" id="error-msg">No pudimos guardar tus datos. Probá de nuevo.</p>
      </form>
    </div>
  </div>

  <script>
    ${UTM_SCRIPT}
    var overlay = document.getElementById('popup-overlay');
    document.querySelectorAll('.abrir-popup').forEach(function (btn) {
      btn.addEventListener('click', function () { overlay.classList.add('activo'); });
    });
    document.getElementById('popup-cerrar').addEventListener('click', function () { overlay.classList.remove('activo'); });
    overlay.addEventListener('click', function (ev) { if (ev.target === overlay) overlay.classList.remove('activo'); });

    var form = document.getElementById('form-captura');
    var urlSiguiente = ${embedJson(opts.urlSiguiente)};
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var errorMsg = document.getElementById('error-msg');
      errorMsg.style.display = 'none';
      btn.disabled = true;
      var nombre = document.getElementById('nombre').value.trim();
      var email = document.getElementById('email').value.trim();
      var whatsappEl = document.getElementById('whatsapp');
      var whatsapp = whatsappEl ? whatsappEl.value.trim() : '';
      fetch(${embedJson(eventoFullUrl)}, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'lead', nombre: nombre, email: email, whatsapp: whatsapp, utm: leerUtm() })
      })
        .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (r) {
          if (!r.ok) throw new Error('error');
          var next = urlSiguiente + '?email=' + encodeURIComponent(email) + '&whatsapp=' + encodeURIComponent(whatsapp);
          window.location.href = next;
        })
        .catch(function () {
          btn.disabled = false;
          errorMsg.style.display = 'block';
        });
    });
  </script>
</body>
</html>`;
}

export function generarHtmlEncuesta(
  spec: PaginaSpec,
  opts: { eventoUrl: string; clienteId: string; paginaId: number | string; urlGracias: string }
): string {
  const c = spec.copy.encuestaIntro;
  const eventoFullUrl = `${opts.eventoUrl}?cliente_id=${encodeURIComponent(opts.clienteId)}&pagina_id=${encodeURIComponent(
    String(opts.paginaId)
  )}`;

  const preguntasHtml = spec.encuesta
    .map((p, i) => {
      if (p.tipo === "opciones") {
        const opciones = (p.opciones || [])
          .filter((o) => o.trim())
          .map(
            (o, j) =>
              `<label><input type="radio" name="pregunta-${i}" value="${esc(o)}" ${j === 0 ? "required" : ""} /> ${esc(o)}</label>`
          )
          .join("");
        return `<div class="campo"><label>${esc(p.texto)}</label><div class="opciones">${opciones}</div></div>`;
      }
      return `<div class="campo"><label for="pregunta-${i}">${esc(p.texto)}</label><input type="text" id="pregunta-${i}" name="pregunta-${i}" /></div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(c.titulo)}</title>
<style>${baseStyles(spec.colores)}</style>
</head>
<body>
  <div class="card">
    <h1>${esc(c.titulo)}</h1>
    <p class="sub">${esc(c.subtitulo)}</p>
    <form id="form-encuesta">
      ${preguntasHtml}
      <button type="submit" class="enviar">${esc(c.textoBoton)}</button>
      <p class="error-msg" id="error-msg">No pudimos guardar tus respuestas. Probá de nuevo.</p>
    </form>
  </div>
  <script>
    var preguntas = ${embedJson(spec.encuesta.map((p) => p.texto))};
    var form = document.getElementById('form-encuesta');
    var urlGracias = ${embedJson(opts.urlGracias)};
    var params = new URLSearchParams(window.location.search);
    var email = params.get('email') || '';
    var whatsapp = params.get('whatsapp') || '';
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var btn = form.querySelector('button.enviar');
      var errorMsg = document.getElementById('error-msg');
      errorMsg.style.display = 'none';
      btn.disabled = true;
      var respuestas = {};
      preguntas.forEach(function (texto, i) {
        var campo = form.querySelector('[name="pregunta-' + i + '"]:checked, #pregunta-' + i);
        respuestas[texto] = campo ? campo.value : '';
      });
      fetch(${embedJson(eventoFullUrl)}, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'pesquisa', email: email, whatsapp: whatsapp, respuestas: respuestas })
      })
        .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (r) {
          if (!r.ok) throw new Error('error');
          window.location.href = urlGracias;
        })
        .catch(function () {
          btn.disabled = false;
          errorMsg.style.display = 'block';
        });
    });
  </script>
</body>
</html>`;
}

export function generarHtmlGracias(spec: PaginaSpec): string {
  const g = spec.gracias;
  const hero = spec.imagenes.graciasUrl ? `<img class="hero" src="${esc(spec.imagenes.graciasUrl)}" alt="" />` : "";
  const boton = g.linkBoton
    ? `<a class="cta-link" href="${esc(g.linkBoton)}" target="_blank" rel="noopener">${esc(g.textoBoton)}</a>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(g.titulo)}</title>
<style>${baseStyles(spec.colores)}</style>
</head>
<body>
  <div class="card" style="text-align:center;">
    ${hero}
    <h1>${esc(g.titulo)}</h1>
    <p class="sub">${esc(g.subtitulo)}</p>
    ${boton}
  </div>
</body>
</html>`;
}
