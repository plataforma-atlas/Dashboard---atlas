# Documentación técnica — Panel Vermetricas

> Este documento complementa al [`README.md`](./README.md) (quick-start) con el detalle completo del proyecto: arquitectura, autenticación, modelo de datos, inventario de rutas/APIs, integración con n8n, y los flujos de onboarding de clientes. Generado a partir de una lectura completa del código el 2026-09-14 — todo lo que dice acá está verificado contra archivos reales del repo, no es una descripción genérica.

## 1. Qué es este proyecto

Panel multi-cliente (multi-tenant) en Next.js para la agencia **Vermetricas**. Muestra el embudo de conversión de cada cliente (registro → asistencia → compra) con un módulo de dashboard distinto según la estrategia de cada campaña. **No hay backend propio ni base de datos conectada directamente**: todos los datos vienen de Postgres a través de webhooks de **n8n**. Principio de diseño explícito en el código: nunca se fabrican cifras — todo dato sin fuente real se muestra como `—`.

## 2. Stack tecnológico

- **Next.js 14.2.5** (App Router) + **React 18.3.1**, TypeScript 5.5.4.
- **Tailwind CSS 3.4.7** — sistema de theming por cliente vía variables CSS (`--color-*`), ver sección 9.
- **jose 5.6.3** — firma/verificación de JWT (sesión y tokens de invitación).
- **recharts** — gráficos.
- **jspdf** + **jspdf-autotable** — export de reportes a PDF (Webinar OS).
- Sin ORM, sin cliente de base de datos, sin backend propio: es un frontend/BFF puro que proxea todo a n8n.

Scripts (`package.json`): `npm run dev` / `build` / `start` / `lint`.

## 3. Correr el proyecto localmente

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`. Necesita un `.env.local` con las variables listadas en la sección 6 — no existe un `.env.example` en el repo, así que esta documentación es la referencia.

## 4. Arquitectura general

```
Navegador
   │
   ▼
Next.js (App Router)  ──┐
  - Páginas (app/*)     │  todas las rutas server-side
  - API routes (app/api/**/route.ts)
        │
        │  fetch(N8N_*_URL, {…})
        ▼
   n8n (webhooks)
        │
        ▼
   Postgres
```

- **Next.js nunca habla directamente con Postgres.** Cada `route.ts` bajo `app/api/` es un proxy: verifica sesión/rol, arma la query, llama al webhook de n8n correspondiente (URL en una variable de entorno `N8N_*_URL`), normaliza errores, y devuelve JSON al frontend.
- **n8n** expone un workflow compartido ("Atlas") con webhooks de lectura (`campanas`, `calcular-embudo`, `clientes`, `admin/*`) siempre filtrados por `cliente_id`, más un workflow dedicado por cliente para la ingesta de sus leads (formularios de GHL, landing pages, etc.).
- **Multi-tenant**: la lista de clientes vive en Postgres (tabla `clients`, `status active/archived`), no en el código — se administra desde `Admin → Clientes`.
- No se envía ningún header de secreto compartido de Next.js hacia n8n en las rutas revisadas — el trust boundary es la URL del webhook en sí (privada/no listada) más los checks de sesión/rol que ya pasaron en el route handler.

## 5. Autenticación y sesiones

Fuente: `lib/auth.ts`.

```ts
export type SessionPayload = {
  user_id: number;
  role: "admin" | "client" | "checkin";
  clientes: string[];
};
```

- **El JWT de sesión no lo firma esta app** — lo firma **n8n** (en los webhooks de login/registro). Next.js solo lo **verifica** con `jwtVerify` (librería `jose`), usando `JWT_SECRET` — debe ser idéntico a la credencial "JWT Key" configurada en n8n.
- Cookie: `atlas_session` (httpOnly, secure, sameSite: lax, path `/`, expira en 7 días).
- **Roles**:
  - `admin` — ve y administra todos los clientes.
  - `client` — solo los `clientes[]` de su sesión.
  - `checkin` — rol de staff externo para el día del evento; `middleware.ts` lo confina exclusivamente a `/checkin` y `/api/evento/*` + `/api/auth/*` (no puede ver el resto del dashboard ni `/admin`).

### ⚠️ Gotcha conocido: `clientesDeSesion()`

Las sesiones firmadas por n8n **antes del fix del 2026-09-11** podían traer `clientes` como un string plano separado por comas (bug del template del nodo JWT en n8n) en vez de un array real. Por eso existe:

```ts
export function clientesDeSesion(session: SessionPayload): string[] {
  const raw = session.clientes as unknown;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string" && raw) return raw.split(",");
  return [];
}
```

**Regla para el equipo**: nunca leer `session.clientes` directamente en una ruta nueva — siempre usar `clientesDeSesion(session)`. Ya se usa así en ~20 rutas (`campanas`, `clientes`, `webinars`, `onboarding/*`, `evento/checkin`, `auth/me`, etc.). Este bug causaba falsos positivos de acceso (matching por substring de un string en vez de comparación exacta de array) — es un tema de seguridad, no solo de estilo.

`JWT_SECRET` también se usa en `lib/invite.ts` para firmar/verificar los tokens de invitación de clientes (mismo secret, propósito distinto — ver sección 8).

## 6. Variables de entorno

Solo nombres — nunca se deben pegar valores reales en documentación ni en el repo. No existe `.env.example`; esta lista es la referencia autoritativa (verificada contra todos los `process.env.*` referenciados en el código).

**JWT / secretos**
`JWT_SECRET`

**Feature flags**
`EVENTO_CHECKIN_PUBLICO` — interruptor de emergencia: cuando es `"true"`, `/checkin` y `/api/evento/*` quedan públicos (para cuando el staff de check-in todavía no tiene cuentas creadas).

**Auth**
`N8N_LOGIN_URL`, `N8N_REGISTRO_URL`, `N8N_REGISTRO_INVITADO_URL`

**Admin / gestión de usuarios y clientes**
`N8N_ADMIN_USUARIOS_URL`, `N8N_ADMIN_CLIENTE_USUARIO_URL`, `N8N_ADMIN_ELIMINAR_USUARIO_URL`, `N8N_ADMIN_CAMBIAR_ROL_URL`, `N8N_CREAR_CLIENTE_URL`, `N8N_ESTADO_CLIENTE_URL`, `N8N_CLIENTES_URL`, `N8N_CAMPANAS_URL`

**Onboarding / integraciones (GHL)**
`N8N_ONBOARDING_CONECTAR_URL`, `N8N_ONBOARDING_ESTADO_URL`

**Webinar OS**
`N8N_WEBINARS_URL`, `N8N_WEBINAR_DETALLE_URL`, `N8N_WEBINAR_CARTERA_URL`, `N8N_WEBINAR_CARTERA_POR_CAMPANA_URL`, `N8N_CALCULAR_EMBUDO_URL` (compartida con el dashboard genérico)

**Evento presencial**
`N8N_EVENTO_BUSCAR_URL`, `N8N_EVENTO_CHECKIN_URL`, `N8N_EVENTO_CHECKIN_DESHACER_URL`, `N8N_EVENTO_CHECKIN_RESUMEN_URL`, `N8N_EVENTO_MARCAR_VIP_URL`, `N8N_EVENTO_QUITAR_VIP_URL`, `N8N_EVENTO_LISTAR_POR_TIER_URL`, `N8N_EVENTO_LEAD_DETALLE_URL`, `N8N_EVENTO_LEAD_ACTUALIZAR_URL`, `N8N_EVENTO_INVITADO_GUARDAR_URL`, `N8N_EVENTO_REGISTRAR_INVITADO_GENERAL_URL`, `N8N_EVENTO_REGISTRAR_INVITADO_PONENTE_URL`, `N8N_EVENTO_RESUMEN_PAGOS_URL`, `N8N_EVENTO_AD_SPEND_URL`, `N8N_EVENTO_AD_SPEND_CONSOLIDADO_URL`, `N8N_EVENTO_AD_PERFORMANCE_URL`

**Notas**
- No hay ninguna connection string de Postgres (`DATABASE_URL` o similar) en `.env.local` — confirmado, Next.js nunca toca la base directamente.
- No hay API keys de GHL/Meta en `.env.local` — el token de GHL lo tipea el cliente en `/panel/conexiones` y se reenvía a n8n por request, nunca se guarda como variable de entorno de esta app.

## 7. Estructura de carpetas

```
app/
  page.tsx                        SPA principal — selector de cliente/campaña + routing por strategy_type
  layout.tsx                      Layout raíz: fuentes, CSS global/tema, ThemeModeProvider
  login/, registro/                Páginas públicas de auth
  invitacion/[token]/              Signup vía invitación
  checkin/                         Consola de check-in del evento presencial
  panel/conexiones/                Panel de integraciones del cliente (hoy: solo GHL)
  webinar-os/control-center/[clienteId]/   Vista agregada semanal por cliente (Webinar OS)
  admin/cartera/, admin/clientes/, admin/usuarios/   Solo admin
  api/                             Proxies server-side hacia n8n (ver sección 10)

components/
  (raíz)                           UI compartida: selectors, KPI cards, theming, LoginGridCanvas, loader de marca
  vsl/, evento/, webinar-os/       Widgets específicos de cada módulo
  webinar-os/cartera/              Vista de portafolio (admin)
  webinar-os/control-center/       Control Center por cliente

lib/
  auth.ts, invite.ts                Sesión JWT y tokens de invitación
  clients.ts                        Theming por cliente (fallback: tema genérico)
  types.ts, aggregate.ts            Tipos y transforms del dashboard genérico ("lanzamiento")
  vsl/, evento/, webinar-os/        Tipos + agregaciones específicas de cada módulo
  webinar-os/control-center/        Insights/recomendaciones + rangos de fecha del Control Center

design/                            Assets de marca fuente (no se sirven a producción) + referencia HTML standalone del fondo animado de login
public/brand/                      Los 4 assets de marca que sí se sirven en producción
```

## 8. Inventario de páginas (`app/`)

| Ruta | Acceso | Qué hace |
|---|---|---|
| `/` | Cualquier rol excepto `checkin` (redirige a `/checkin`) | SPA principal: carga sesión + lista de clientes + campañas, y renderiza el módulo según `strategy_type` (Webinar OS / VSL / Evento presencial / genérico). Admin sin cliente seleccionado ve un selector de cliente. |
| `/login` | Público | Login por email/contraseña. |
| `/registro` | Público | Alta de cuenta sin acceso a ningún cliente todavía (lo asigna un admin después). |
| `/invitacion/[token]` | Público | Signup pre-vinculado a un cliente vía token de invitación. |
| `/checkin` | Admin/checkin/cliente `atlas`, o público si `EVENTO_CHECKIN_PUBLICO=true` | Consola de check-in del evento: buscar, marcar/deshacer entrada, editar datos, registrar walk-ins, marcar VIP. |
| `/panel/conexiones` | Cualquier rol autenticado | Estado de integraciones del cliente (GHL con credencial; ClaseEspecial muestra un webhook para pegar en su plataforma; Meta Ads/Whop son placeholders "Próximamente"). |
| `/webinar-os/control-center/[clienteId]` | Autenticado, scoped al cliente | Vista semanal agregada entre campañas de webinar de un cliente: ranking, embudo, filtros, recomendaciones. |
| `/admin/cartera` | **Admin** | Portafolio cruzado entre TODOS los clientes (Webinar OS). |
| `/admin/clientes` | **Admin** | Alta/archivado de clientes, generación de invitaciones. |
| `/admin/usuarios` | **Admin** | Gestión de usuarios: rol, acceso por cliente, borrado. |

## 9. Inventario de API routes (`app/api/`)

Patrón repetido en **todas** las rutas (ver sección 11 para el detalle): verificar cookie de sesión → verificar rol/acceso al `cliente_id` → verificar que la variable `N8N_*_URL` exista → proxear el fetch → normalizar errores.

**Auth** — `login`, `logout`, `me`, `registro`, `registro-invitado`
**Invitación** — `invitacion/verificar` (pública)
**Datos core** — `clientes`, `campanas`, `funnel` (embudo genérico, usado por varios módulos)
**Onboarding** — `onboarding/conectar-ghl`, `onboarding/estado`
**Webinar OS** — `webinar-os/webinars`, `webinar-os/webinar-detalle`, `webinar-os/cartera` (admin), `webinar-os/cartera-por-campana`
**Evento presencial** — `evento/buscar`, `checkin`, `checkin-deshacer`, `checkin-resumen`, `invitado-guardar`, `lead-actualizar`, `lead-detalle`, `listar-por-tier`, `marcar-vip`, `quitar-vip`, `registrar-invitado-general`, `registrar-invitado-ponente`, `resumen-pagos`, `gasto-pauta`, `gasto-pauta-consolidado`, `gasto-pauta-por-anuncio`
**Admin** (todas requieren `role === "admin"`) — `usuarios`, `cambiar-rol`, `cliente-usuario`, `eliminar-usuario`, `crear-cliente`, `estado-cliente`, `generar-invitacion`

> El detalle completo (método, variable de entorno, autorización exacta) de cada una de estas ~30 rutas está en el código mismo — cada `route.ts` es corto y sigue el mismo patrón, así que es más confiable leer el archivo que duplicar aquí una tabla gigante que se puede desactualizar.

## 10. Patrón de integración con n8n

Todas las rutas de `app/api/` siguen este mismo esqueleto:

```ts
// 1. Sesión
const session = await verifySession(cookies().get(COOKIE_NAME)?.value ?? "");
if (!session) return NextResponse.json({ error: "..." }, { status: 401 });

// 2. Autorización (rutas scoped a cliente)
if (session.role !== "admin" && !clientesDeSesion(session).includes(cliente_id)) {
  return NextResponse.json({ error: "..." }, { status: 403 });
}

// 3. Variable de entorno
const url = process.env.N8N_ALGO_URL;
if (!url) return NextResponse.json({ error: "N8N_ALGO_URL no está configurada" }, { status: 500 });

// 4. Proxy
const res = await fetch(url, { method, headers: {...}, body, cache: "no-store" });

// 5. Normalización de errores / 6. Respuesta
if (!res.ok) return NextResponse.json({ error: ... }, { status: res.status });
return NextResponse.json(data);
```

No se envía ningún secreto/header propio hacia n8n (la URL del webhook es el trust boundary), salvo `onboarding/conectar-ghl`, que reenvía el **token de GHL del cliente** (no un secreto de n8n) como `credential`.

**Convención de workflows en n8n** (no hay un doc de n8n en el repo, esto se infiere del README y comentarios en el código): un workflow "Atlas" compartido expone los webhooks de lectura genéricos (`campanas`, `calcular-embudo`, `clientes`, `admin/*`), y **cada cliente tiene su propio workflow dedicado** para ingesta de leads (formularios GHL, landing pages).

## 11. Modelo de datos (inferido — no hay schema SQL en el repo)

No existe ningún archivo `.sql` en el proyecto. Lo siguiente se reconstruyó leyendo los tipos de TypeScript y comentarios que describen la "forma exacta" de lo que devuelven los webhooks — no se inventó ninguna columna.

```
clients (id, name, status: active|archived)
   └─< campaigns (id, cliente_id, name, strategy_type, status, slug)
          └─< funnel_events (sort_order, stagename, utm_source, country, event_date, total_leads, total_ingresos)
          └─< webinars (id, cliente_id, campaign_id, country, label, webinar_date, sort_order)     [strategy_type = webinar_automatizado]
                 └─ webinar_metrics (11 submódulos) + meta_ads entries (spend, ctr, cpm, cpc, cpl, frequency…)
          └─< datos de evento (registros/checkins/confirmados/tiers + gasto por ángulo)             [strategy_type = evento_presencial]
          └─< KPIs de VSL (registros/depósitos/capital)                                             [strategy_type = vsl]
clients
   └─< conexiones por cliente (cliente_id, integration_type, status, updated_at, config, tiene_credencial)
users (user_id, role: admin|client|checkin, …)
   └─< user_clientes (join many-to-many: user_id, cliente_id)
```

`strategy_type` es el discriminador que decide qué módulo del dashboard se renderiza para cada campaña — ver tabla en el `README.md`.

**Principio de datos real**: varios tipos usan explícitamente `number | null` donde `null` significa "esa fuente de datos todavía no existe" — se muestra `—` en la UI, nunca se fabrica un número (ver comentario en `lib/vsl/types.ts`).

## 12. Sistema de invitación de clientes

Fuente: `lib/invite.ts` + `app/api/admin/generar-invitacion`, `app/api/invitacion/verificar`, `app/api/auth/registro-invitado`.

1. **Admin genera la invitación** (`POST /api/admin/generar-invitacion`, solo admin): firma un JWT local (mismo `JWT_SECRET`, sin llamar a n8n) con `{ purpose: "client_invite", cliente_id, cliente_nombre }`, expira en **7 días**. Devuelve `{ url: "<origin>/invitacion/<token>" }`.
2. **Cliente abre el link** (`GET /api/invitacion/verificar?token=`, público): verifica firma + `purpose === "client_invite"`; si es inválido/expiró, 400. Si es válido, devuelve `cliente_id`/`cliente_nombre` para mostrar en la pantalla.
3. **Cliente completa el signup** (`POST /api/auth/registro-invitado`): re-verifica el token server-side, llama a `N8N_REGISTRO_INVITADO_URL` con `{ email, password, name, cliente_id }` (esto crea el usuario YA vinculado al cliente), y luego intenta auto-login contra `N8N_LOGIN_URL`. Si el auto-login falla, la cuenta igual quedó creada (`{ ok: true, autoLogin: false }`) y el usuario debe loguearse manualmente.

**Gotcha para el equipo**: el token de invitación no tiene enforcement de "un solo uso" en este código — solo expira por tiempo (7 días). Si se necesita invalidar una invitación ya usada, esa lógica tendría que vivir en el workflow de n8n / la base de datos, no acá.

## 13. Conexión con GoHighLevel (onboarding)

Fuente: `app/api/onboarding/conectar-ghl`, `app/api/onboarding/estado`, `app/panel/conexiones/page.tsx`.

- El cliente pega su **Location ID** y **token de Private Integration de GHL** en `/panel/conexiones` (input tipo password).
- `POST /api/onboarding/conectar-ghl` normaliza el token a `Bearer <token>` y lo reenvía a `N8N_ONBOARDING_CONECTAR_URL` como `{ cliente_id, integration_type: "ghl", config: { locationId }, credential }`. n8n es responsable de persistirlo.
- `GET /api/onboarding/estado?cliente_id=` devuelve el estado de cada integración: `{ integration_type, status, updated_at, tiene_credencial }` — **nunca** devuelve el valor real de la credencial, solo un booleano.
- La UI considera "Conectado" solo si `integration_type === "ghl" && status === "active" && tiene_credencial === true`.
- **Meta Ads y Whop son placeholders** en la UI (`disponible: false`, "Próximamente") — no tienen rutas de backend todavía.

**ClaseEspecial (antes "WebinarKit") — integración inversa, sin credencial.** A diferencia de GHL, acá no le pedimos nada al cliente: le mostramos un webhook (`/panel/conexiones`, botón "Ver webhook") para que él lo pegue en la configuración de webhooks de su plataforma de ClaseEspecial/WebinarKit. Es una única URL compartida entre todos los clientes, diferenciada por `?cliente_id=` en la query — no pasa por `client_connections`/`tiene_credencial` como GHL, así que nunca muestra "Conectado", solo el botón para ver la URL.

El webhook lo recibe el workflow de n8n **"ClaseEspecial (WebinarKit) Eventos → GHL — multi-cliente"** (id `G3ewsX3kI0SNyIUS`, antes `John | WebinarKit Eventos → GHL`): recibe `{ email, first, last, phone, attended_webinar, webinar_view_percentage }` por POST, lee `cliente_id` de la query (default `"john"` si no viene, por compatibilidad con la config existente de John), busca la fila `client_connections` de ese cliente (`integration_type='ghl'`) para sacar el `ghl_auth`/`locationId`, y mueve la oportunidad en el pipeline `config.pipelines.implementacion` (registro → encuesta → webinar → menos_50/más_50 → …) según el % de reproducción.

**Importante para dar de alta un cliente nuevo en esta integración**: la URL del webhook por sí sola no alcanza — antes de dársela al cliente, alguien del equipo tiene que insertar (a mano, en Postgres) su fila en `client_connections` con `integration_type='ghl'` y un `config.pipelines.implementacion` que tenga `pipelineId` + `stages` (los 9 IDs de etapa) de SU pipeline en GHL. Sin esa fila, el webhook llega pero no encuentra config y no hace nada.

## 14. `middleware.ts` — protección de rutas

Corre en todas las rutas excepto `_next/static`, `_next/image`, `favicon.ico`.

**Públicas (sin sesión)**: `/login*`, `/registro*`, `/invitacion*`, `/api/auth/*`, `/api/invitacion/*`, assets estáticos (regex por extensión — esto se agregó específicamente porque antes `/brand/*.png` quedaba atrapado por el redirect a login), y `/checkin` + `/api/evento/*` cuando `EVENTO_CHECKIN_PUBLICO=true`.

**Lógica**:
1. Sin sesión válida + ruta no pública → redirect a `/login?next=<ruta>`.
2. Con sesión + intenta ir a `/login`/`/registro` → redirect a `/` (o `/checkin` si es rol `checkin`).
3. Rol `checkin` fuera de `/checkin`/`/api/evento`/`/api/auth` → redirect a `/checkin`.
4. Ruta `/admin/*` sin rol `admin` → redirect a `/`.

Cada API route **vuelve a verificar** sesión y permisos por su cuenta — el middleware es la primera capa, no la única (defensa en profundidad).

## 15. Identidad de marca / theming

- Paleta Vermetricas (morado): `#5B5BF7` (primary), `#7C7CFB`, `#8B86FF`, `#A5A0FF` (secondary/hot), sobre fondos oscuros `#0E1015` / `#181A22` / `#1F222C`. Tokens Tailwind: `background`, `surface`, `surface-high`, `outline`, `primary`, `secondary`, `on-surface*`, más `error`/`success`/`warning` con variantes `-container`/`outline-*`.
- `lib/clients.ts` resuelve un tema por cliente en runtime (fallback: tema genérico Vermetricas) — light/dark vía `ThemeModeProvider`/`ThemeSwitch`.
- `components/LoginGridCanvas.tsx` — fondo animado de las pantallas de auth (login/registro/invitación): grid de rectángulos verticales con una luz que viaja y ilumina direccionalmente, afinado a mano durante esta sesión de trabajo. Hay una versión standalone (HTML/CSS/JS puro, sin dependencias) de referencia en `design/login-bg-vanilla/index.html`.

## 16. Gotchas / cosas a tener presente

- **`clientesDeSesion()` siempre**, nunca `session.clientes` directo (sección 5) — es un tema de seguridad, no de estilo.
- **`EVENTO_CHECKIN_PUBLICO=true`** es un interruptor de emergencia que abre `/checkin` sin login — asegurarse de que esté en `false`/sin definir fuera de la ventana del evento.
- Los assets de marca "fuente" en `design/` **no se sirven** a producción — solo lo que está en `public/brand/` llega al bundle.
- No hay `.env.example` — esta documentación (sección 6) es la lista de referencia; mantenerla actualizada si se agrega una variable nueva.
- El token de invitación de cliente no tiene enforcement de un solo uso (sección 12).

## 17. Deploy

```bash
npm i -g vercel
vercel
```

Configurar todas las variables de la sección 6 en Vercel → Settings → Environment Variables, para Production, Preview y Development.
