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

export type CopyCaptura = {
  titulo: string;
  subtitulo: string;
  bullets: string[];
  textoBoton: string;
  pedirWhatsapp: boolean;
};

export type CopyEncuestaIntro = {
  titulo: string;
  subtitulo: string;
  textoBoton: string;
};

export type Copy = { captura: CopyCaptura; encuestaIntro: CopyEncuestaIntro };

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
      captura: {
        titulo: "Reservá tu lugar",
        subtitulo: "Dejanos tus datos y te enviamos el acceso.",
        bullets: [],
        textoBoton: "Quiero mi lugar",
        pedirWhatsapp: true,
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

/** slugs reales de WordPress derivados del slug base guardado en `landing_pages`. */
export function slugsDePagina(slugBase: string) {
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
  opts: { eventoUrl: string; clienteId: string; paginaId: number | string; urlEncuesta: string }
): string {
  const c = spec.copy.captura;
  const bullets = (c.bullets || []).filter((b) => b.trim()).map((b) => `<li>${esc(b)}</li>`).join("");
  const hero = spec.imagenes.capturaUrl
    ? `<img class="hero" src="${esc(spec.imagenes.capturaUrl)}" alt="" />`
    : "";
  const eventoFullUrl = `${opts.eventoUrl}?cliente_id=${encodeURIComponent(opts.clienteId)}&pagina_id=${encodeURIComponent(
    String(opts.paginaId)
  )}`;

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
    ${hero}
    <h1>${esc(c.titulo)}</h1>
    <p class="sub">${esc(c.subtitulo)}</p>
    ${bullets ? `<ul class="bullets">${bullets}</ul>` : ""}
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
        <input type="tel" id="whatsapp" name="whatsapp" required />
      </div>`
          : ""
      }
      <button type="submit" class="enviar">${esc(c.textoBoton)}</button>
      <p class="error-msg" id="error-msg">No pudimos guardar tus datos. Probá de nuevo.</p>
    </form>
  </div>
  <script>
    ${UTM_SCRIPT}
    var form = document.getElementById('form-captura');
    var urlEncuesta = ${embedJson(opts.urlEncuesta)};
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var btn = form.querySelector('button.enviar');
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
          var next = urlEncuesta + '?email=' + encodeURIComponent(email) + '&whatsapp=' + encodeURIComponent(whatsapp);
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
