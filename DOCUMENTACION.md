# Documentación técnica — Panel Vermetricas

> Este documento complementa al [`README.md`](./README.md) (quick-start) con el detalle completo del proyecto: arquitectura, autenticación, modelo de datos, inventario de rutas/APIs, integración con n8n, y los flujos de onboarding de clientes. Generado a partir de una lectura completa del código el 2026-09-14 — todo lo que dice acá está verificado contra archivos reales del repo, no es una descripción genérica. Actualizado el 2026-09-15 con el sidebar compartido/colapsable y los cambios de navegación del Control Center (secciones 7, 8 y 16). Actualizado el 2026-09-16 con el flujo de recuperación de contraseña self-service vía Resend (sección 18) y sus variables de entorno (sección 6). Actualizado el 2026-09-18 con el rediseño del selector de periodo del Control Center, el reemplazo de íconos del sidebar, el sidebar theme-aware + nuevo switch claro/oscuro, y el sistema de animación/tipografía aplicado a todo el dashboard (secciones 15 y 19). Actualizado el 2026-09-23 con el embudo de captación self-service para clientes (páginas `/panel/embudos` y `/panel/conexiones` con Meta Ads), sus nuevos endpoints de n8n, las tablas/etapas de Postgres que usan, el proxy que enmascara las URLs de n8n, la navegación "Configuración"/"Embudos"/"Leads" in-place (sin popup) en los tres sidebars, el menú "Otras campañas" del Control Center para clientes multi-estrategia existentes, y la pantalla `/panel/leads` de leads/compradores con paginación propia (`components/ui/pagination.tsx`) y export a CSV/Excel (sección 20). Actualizado el 2026-09-24 con el backend del constructor de páginas propio (tablas `landing_pages`/`landing_page_leads`, workflow `Núcleo — Páginas de Captación`, rutas `/api/paginas/*`) y la integración de WordPress (conectar con prueba de credenciales real, estado, desconectar y publicar páginas por REST, workflows `Integraciones — WordPress (Cliente)` e `Integraciones — Publicar en WordPress (Cliente)`, tarjeta "WordPress" en `/panel/conexiones`) — todavía sin la pantalla del wizard que arma el HTML (sección 21).

## 1. Qué es este proyecto

Panel multi-cliente (multi-tenant) en Next.js para la agencia **Vermetricas**. Muestra el embudo de conversión de cada cliente (registro → asistencia → compra) con un módulo de dashboard distinto según la estrategia de cada campaña. **No hay backend propio ni base de datos conectada directamente**: todos los datos vienen de Postgres a través de webhooks de **n8n**. Principio de diseño explícito en el código: nunca se fabrican cifras — todo dato sin fuente real se muestra como `—`.

## 2. Stack tecnológico

- **Next.js 14.2.5** (App Router) + **React 18.3.1**, TypeScript 5.5.4.
- **Tailwind CSS 3.4.7** — sistema de theming por cliente vía variables CSS (`--color-*`), ver sección 9.
- **jose 5.6.3** — firma/verificación de JWT (sesión y tokens de invitación).
- **recharts** — gráficos.
- **jspdf** + **jspdf-autotable** — export de reportes a PDF (Webinar OS).
- **Resend** — envío de correos transaccionales (recuperación de contraseña); se llama directo a su API REST vía `fetch` en `lib/email.ts`, sin SDK.
- **react-day-picker** — calendario de rango del selector de periodo del Control Center (ver sección 19).
- **lucide-react** — set de íconos usado en los sidebars y en el switch de tema (ver sección 19).
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

**Recuperación de contraseña (self-service)**
`RESEND_API_KEY`, `N8N_ADMIN_RESETEAR_PASSWORD_URL` — este último es el mismo webhook de n8n que usaría un futuro reset manual de admin desde `/admin/usuarios` (no construido todavía); ver sección 18.

**Embudo de captación self-service** (ver sección 20)
`N8N_CONFIGURAR_EMBUDO_URL`, `N8N_EMBUDO_WEBINAR_LEADS_URL`, `N8N_META_ADS_PULL_URL`, `N8N_GHL_PIPELINES_PULL_URL`, `N8N_WEBHOOK_BASE_URL` (base para el proxy `/api/hooks/[...path]` que enmascara n8n de cara al cliente)

**Constructor de páginas propio y conexión WordPress** (ver sección 21)
`N8N_PAGINAS_URL` (base — `/guardar`, `/listar`, `/detalle` cuelgan de acá), `N8N_WORDPRESS_CONECTAR_URL`, `N8N_WORDPRESS_ESTADO_URL`, `N8N_WORDPRESS_DESCONECTAR_URL`, `N8N_WORDPRESS_PUBLICAR_URL`

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
  olvide-password/                 Pide el correo y dispara el envío del enlace de recuperación
  restablecer-password/[token]/    Crear contraseña nueva a partir del enlace del correo
  invitacion/[token]/              Signup vía invitación
  checkin/                         Consola de check-in del evento presencial
  panel/conexiones/                Panel de integraciones del cliente (GHL, Meta Ads, ClaseEspecial)
  panel/embudos/                    Crear/activar el embudo de Webinar Automático y ver sus 4 URLs de captación
  panel/leads/                      Leads y compradores capturados por el embudo, con paginación y export CSV/Excel
  api/paginas/                      CRUD del constructor de páginas propio (guardar/listar/detalle) + publicar-wordpress — ver sección 21
  api/onboarding/conectar-wordpress, wordpress-estado, desconectar-wordpress   Conexión WordPress por cliente — ver sección 21
  webinar-os/control-center/[clienteId]/   Vista agregada semanal por cliente (Webinar OS)
  admin/cartera/, admin/clientes/, admin/usuarios/   Solo admin
  api/                             Proxies server-side hacia n8n (ver sección 10)

components/
  (raíz)                           UI compartida: selectors, KPI cards, theming, LoginGridCanvas, loader de marca
  AppSidebar.tsx                   Sidebar fijo genérico (admin/cartera, admin/clientes, admin/usuarios, panel/conexiones, panel/embudos, panel/leads) — el dashboard clásico (app/page.tsx) y el Control Center tienen su propio <aside> con el mismo look porque necesitan el selector de cliente/campaña, que no aplica acá
  SidePanelProvider.tsx            Estado (sin UI propia) de qué panel "Configuración"/"Embudos"/"Leads" está reemplazando el contenido principal — ver sección 20
  panel/ConexionesBody.tsx, EmbudosBody.tsx, LeadsBody.tsx   Cuerpo de cada uno de esos tres paneles, compartido entre AppSidebar, el dashboard clásico y el Control Center
  ui/pagination.tsx                Paginación propia (sin librerías externas) usada por LeadsBody
  SidebarCollapseButton.tsx        Botón de colapsar/expandir, ícono junto al logo (desktop-only, hidden md:grid)
  useSidebarCollapse.ts            Hook: estado de colapso (siempre arranca expandido, no se persiste) + escribe --sidebar-w en :root para que el <aside>/<main> de cada página lo lean
  vsl/, evento/, webinar-os/       Widgets específicos de cada módulo
  webinar-os/cartera/              Vista de portafolio (admin)
  webinar-os/control-center/       Control Center por cliente

lib/
  auth.ts, invite.ts                Sesión JWT y tokens de invitación
  password-reset.ts                 Token JWT local de recuperación de contraseña (1h, purpose "password_reset")
  email.ts                          Envío de correo transaccional vía Resend (template del reset de contraseña)
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
| `/` | Cualquier rol excepto `checkin` (redirige a `/checkin`) | SPA principal: carga sesión + lista de clientes + campañas, y renderiza el módulo según `strategy_type` (Webinar OS / VSL / Evento presencial / genérico). Admin sin cliente seleccionado cae directo en el primer cliente de la lista (o el de `?cliente_id=`). Si el cliente tiene **alguna** campaña `webinar_automatizado` (activa o no — las ediciones pasadas suelen quedar `archived`), redirige automáticamente a su Control Center; `?vista=clasica` es la salida de emergencia para quedarse en este dashboard. |
| `/login` | Público | Login por email/contraseña. Sin toggle de modo claro/oscuro (se quitó para simplificar la pantalla a un solo look; `/registro` e `/invitacion/[token]` sí lo conservan). |
| `/olvide-password` | Público | Pide el correo y dispara el envío del enlace de recuperación — siempre responde igual, exista o no la cuenta (no revela si el correo está registrado). |
| `/restablecer-password/[token]` | Público (protegido por el token firmado, expira en 1h) | Formulario para crear la contraseña nueva; ver sección 18. |
| `/registro` | Público | Alta de cuenta sin acceso a ningún cliente todavía (lo asigna un admin después). |
| `/invitacion/[token]` | Público | Signup pre-vinculado a un cliente vía token de invitación. |
| `/checkin` | Admin/checkin/cliente `atlas`, o público si `EVENTO_CHECKIN_PUBLICO=true` | Consola de check-in del evento: buscar, marcar/deshacer entrada, editar datos, registrar walk-ins, marcar VIP. |
| `/panel/conexiones` | Cualquier rol autenticado | Estado de integraciones del cliente (GHL y Meta Ads con credencial propia; ClaseEspecial muestra un webhook para pegar en su plataforma; Whop sigue como placeholder "Próximamente"). Un admin que entra sin `?cliente_id=` (y sin cliente propio) ve, en vez de un error, la lista de clientes para elegir uno. |
| `/panel/embudos` | Cualquier rol autenticado | Crear/activar el embudo de Webinar Automático de un cliente y ver sus 4 URLs de captación (registro, encuesta, WhatsApp, registro a webinar), enmascaradas bajo el propio dominio. Ver sección 20. |
| `/panel/leads` | Cualquier rol autenticado | Leads y compradores capturados por el embudo del cliente: pestañas Leads/Compradores, filtro por campaña, paginación y export a CSV/Excel. Ver sección 20. |
| `/webinar-os/control-center/[clienteId]` | Autenticado, scoped al cliente | Vista semanal agregada entre campañas de webinar de un cliente: ranking, embudo, filtros, recomendaciones. El selector de "Campaña/Edición" es único para todas las estrategias del cliente — elegir una edición de Webinar Automático filtra ahí mismo; elegir VSL/Evento/Lanzamiento ("Otras estrategias" en el `<optgroup>`) navega a `/?vista=clasica&cliente_id=<id>&campaign_id=<id>` (el `cliente_id` es obligatorio, si no el dashboard clásico se queda con el cliente que ya tenía seleccionado y no encuentra la campaña ahí). El periodo por defecto es **"Todo el periodo"** (sin filtro de fecha, igual que Cartera) — antes era "Últimas 4 semanas" y mostraba el resumen en cero para cualquier cliente cuya actividad real cayera fuera de esa ventana (ediciones archivadas). El filtro de fecha es un popover con presets ("Todo", "Hoy", "7 días", "1 mes") + un calendario de rango personalizado (ver sección 19); el antiguo selector de "semana específica" ("Filtro avanzado") se quitó por redundante una vez que el calendario permite elegir cualquier rango. |
| `/admin/cartera` | **Admin** | Portafolio cruzado entre TODOS los clientes (Webinar OS). |
| `/admin/clientes` | **Admin** | Alta/archivado de clientes, generación de invitaciones. |
| `/admin/usuarios` | **Admin** | Gestión de usuarios: rol, acceso por cliente, borrado. |

**Sidebar**: `/admin/cartera`, `/admin/clientes`, `/admin/usuarios`, `/panel/conexiones`, `/panel/embudos` y `/panel/leads` comparten `components/AppSidebar.tsx` (fijo a la izquierda en desktop, apilado arriba del contenido en mobile); `/` y el Control Center tienen su propio `<aside>` con el mismo look porque necesitan el selector de cliente/campaña. Los tres traen un botón de colapsar (ícono junto al logo, mismo estilo que "Salir") que reduce el sidebar a solo íconos en desktop — en mobile el botón no se muestra (colapsar no libera espacio cuando el sidebar ya está apilado, no al costado).

## 9. Inventario de API routes (`app/api/`)

Patrón repetido en **todas** las rutas (ver sección 11 para el detalle): verificar cookie de sesión → verificar rol/acceso al `cliente_id` → verificar que la variable `N8N_*_URL` exista → proxear el fetch → normalizar errores.

**Auth** — `login`, `logout`, `me`, `registro`, `registro-invitado`, `olvide-password` (pública), `restablecer-password` (pública, protegida por token firmado)
**Invitación** — `invitacion/verificar` (pública)
**Datos core** — `clientes`, `campanas`, `funnel` (embudo genérico, usado por varios módulos)
**Onboarding** — `onboarding/conectar-ghl`, `onboarding/estado`, `onboarding/conectar-meta-ads`, `onboarding/conectar-wordpress`, `onboarding/wordpress-estado`, `onboarding/desconectar-wordpress`
**Embudo / páginas / leads** — `embudo/configurar`, `leads`, `paginas` (GET listar + POST guardar), `paginas/[id]` (GET detalle), `paginas/publicar-wordpress`, `hooks/[...path]` (proxy público que enmascara los webhooks de n8n)
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
   └─< client_connections (cliente_id, integration_type, status, config jsonb, credential_encrypted, updated_at) — CHECK integration_type IN ('ghl','meta_ads','whop','webinarkit','hotmart','wordpress')
   └─< landing_pages (id, cliente_id, slug, nombre, tipo_funil, plantilla, colores/copy/encuesta/gracias/imagenes jsonb, status)      [constructor de páginas propio, ver sección 21]
          └─< landing_page_leads (id, cliente_id, pagina_id, nombre, email, whatsapp, respuestas jsonb, utm_*, fbclid/gclid/ttclid, referrer, landing)
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
- **Meta Ads ya no es un placeholder** (ver sección 20) — el mismo webhook de n8n (`onboarding/conectar-integracion`) ya aceptaba `meta_ads` como `integration_type` válido antes de construir la UI; solo hizo falta agregarle el formulario en `/panel/conexiones` (ID de cuenta publicitaria + token de acceso, guardados en `config.ad_account_id` y `credential_encrypted`).
- **Whop sigue siendo un placeholder** en la UI (`disponible: false`, "Próximamente") — no tiene ruta de backend todavía.
- **WordPress** (agregado 2026-09-24) es una tarjeta aparte en `/panel/conexiones` con su propio flujo de conexión (URL + usuario + contraseña de aplicación, probada contra la REST API real antes de guardar) — no reutiliza `onboarding/conectar-integracion` como GHL/Meta Ads, tiene sus propios endpoints dedicados porque necesita esa validación previa. Ver sección 21 para el detalle completo (conectar/estado/desconectar/publicar).

**ClaseEspecial (antes "WebinarKit") — integración inversa, sin credencial.** A diferencia de GHL, acá no le pedimos nada al cliente: le mostramos un webhook (`/panel/conexiones`, botón "Ver webhook") para que él lo pegue en la configuración de webhooks de su plataforma de ClaseEspecial/WebinarKit. Es una única URL compartida entre todos los clientes, diferenciada por `?cliente_id=` en la query — no pasa por `client_connections`/`tiene_credencial` como GHL, así que nunca muestra "Conectado", solo el botón para ver la URL.

El webhook lo recibe el workflow de n8n **"ClaseEspecial (WebinarKit) Eventos → GHL — multi-cliente"** (id `G3ewsX3kI0SNyIUS`, antes `John | WebinarKit Eventos → GHL`): recibe `{ email, first, last, phone, attended_webinar, webinar_view_percentage }` por POST, lee `cliente_id` de la query (default `"john"` si no viene, por compatibilidad con la config existente de John), busca la fila `client_connections` de ese cliente (`integration_type='ghl'`) para sacar el `ghl_auth`/`locationId`, y mueve la oportunidad en el pipeline `config.pipelines.implementacion` (registro → encuesta → webinar → menos_50/más_50 → …) según el % de reproducción.

**Importante para dar de alta un cliente nuevo en esta integración**: la URL del webhook por sí sola no alcanza — antes de dársela al cliente, alguien del equipo tiene que insertar (a mano, en Postgres) su fila en `client_connections` con `integration_type='ghl'` y un `config.pipelines.implementacion` que tenga `pipelineId` + `stages` (los 9 IDs de etapa) de SU pipeline en GHL. Sin esa fila, el webhook llega pero no encuentra config y no hace nada.

## 14. `middleware.ts` — protección de rutas

Corre en todas las rutas excepto `_next/static`, `_next/image`, `favicon.ico`.

**Públicas (sin sesión)**: `/login*`, `/registro*`, `/invitacion*`, `/api/auth/*`, `/api/invitacion/*`, `/api/hooks/*` (proxy de webhooks hacia n8n, ver sección 20 — lo llaman herramientas externas del cliente sin cookie de sesión), assets estáticos (regex por extensión — esto se agregó específicamente porque antes `/brand/*.png` quedaba atrapado por el redirect a login), y `/checkin` + `/api/evento/*` cuando `EVENTO_CHECKIN_PUBLICO=true`.

**Lógica**:
1. Sin sesión válida + ruta no pública → redirect a `/login?next=<ruta>`.
2. Con sesión + intenta ir a `/login`/`/registro` → redirect a `/` (o `/checkin` si es rol `checkin`).
3. Rol `checkin` fuera de `/checkin`/`/api/evento`/`/api/auth` → redirect a `/checkin`.
4. Ruta `/admin/*` sin rol `admin` → redirect a `/`.

Cada API route **vuelve a verificar** sesión y permisos por su cuenta — el middleware es la primera capa, no la única (defensa en profundidad).

## 15. Identidad de marca / theming

- Paleta Vermetricas (morado): `#5B5BF7` (primary), `#7C7CFB`, `#8B86FF`, `#A5A0FF` (secondary/hot), sobre fondos oscuros `#0E1015` / `#181A22` / `#1F222C`. Tokens Tailwind: `background`, `surface`, `surface-high`, `outline`, `primary`, `secondary`, `on-surface*`, más `error`/`success`/`warning` con variantes `-container`/`outline-*`.
- `lib/clients.ts` resuelve un tema por cliente en runtime (fallback: tema genérico Vermetricas) — light/dark vía `ThemeModeProvider`/`ThemeSwitch`.
- `components/LoginGridCanvas.tsx` — fondo animado de las pantallas de auth (login/registro/invitación/recuperación de contraseña): grid de rectángulos verticales con una luz que viaja y ilumina direccionalmente, afinado a mano durante esta sesión de trabajo. Hay una versión standalone (HTML/CSS/JS puro, sin dependencias) de referencia en `design/login-bg-vanilla/index.html`.
- `public/brand/vermetricas-horizontal-light.png` — versión del logo para fondos claros (texto oscuro), usada en el correo de recuperación de contraseña; las variantes `-dark` están pensadas para fondos oscuros (texto casi invisible sobre blanco).
- **Sidebars ahora son theme-aware.** `AppSidebar.tsx`, `SidebarCollapseButton.tsx`, el `<aside>` inline de `app/page.tsx` y del Control Center, y `WccSidebarNav.tsx` tenían clases oscuras hardcodeadas (`bg-[#111218]`, `border-white/10`, `text-white`, `bg-white/NN`) que se veían rotas en modo claro — se reemplazaron por los tokens de theming (`bg-surface`, `bg-surface-high`, `border-outline`, `text-on-surface`, `text-on-surface-variant`, `text-on-surface-faint`, `hover:bg-outline`), así que ahora reaccionan al mismo `ThemeModeProvider` que el resto de la app. Excepción intencional: el fondo decorativo de `app/invitacion/[token]/page.tsx` se dejó con `text-white/70` fijo — es un fondo oscuro fijo por diseño, no un bug.
- **`ThemeModeToggle.tsx`** — el switch de claro/oscuro se rediseñó como un slider (círculo que se desplaza `translate-x-0`/`translate-x-8`) con íconos `Moon`/`Sun` de `lucide-react`, usando los tokens de marca (`bg-surface-high`, `border-outline`, `bg-primary`, `text-on-primary`) en vez de los grises genéricos de un boilerplate shadcn. Misma interfaz de props (`{ mode, onToggle }`) que antes.

## 16. Gotchas / cosas a tener presente

- **`clientesDeSesion()` siempre**, nunca `session.clientes` directo (sección 5) — es un tema de seguridad, no de estilo.
- **`EVENTO_CHECKIN_PUBLICO=true`** es un interruptor de emergencia que abre `/checkin` sin login — asegurarse de que esté en `false`/sin definir fuera de la ventana del evento.
- Los assets de marca "fuente" en `design/` **no se sirven** a producción — solo lo que está en `public/brand/` llega al bundle.
- No hay `.env.example` — esta documentación (sección 6) es la lista de referencia; mantenerla actualizada si se agrega una variable nueva.
- El token de invitación de cliente no tiene enforcement de un solo uso (sección 12).
- **Links a `/?vista=clasica&campaign_id=...` siempre necesitan `cliente_id`.** El dashboard clásico (`app/page.tsx`) resuelve el cliente activo por su propio estado (`selectedClientId`, default admin = primer cliente de la lista); sin `cliente_id` en la URL, el `campaign_id` se busca en el cliente equivocado, no matchea nada, y cae en el default de ESE cliente sin avisar — visto en el selector del Control Center, ver sección 8.
- **`CampaignSelector` (dashboard clásico) colapsa `webinar_automatizado`/`vsl`/`evento_presencial` en una sola entrada del `<select>`** (el resto de la selección de país/edición/ángulo vive dentro del módulo). El `value` de esa entrada tiene que ser la campaña realmente activa del grupo si hay una (no siempre `items[0].id`), o un link directo a la 2ª/3ª campaña de esa estrategia muestra el contenido correcto pero la etiqueta equivocada en el dropdown.
- **Cambiar de cliente en `app/page.tsx` puede mostrar un instante mezclado** (nombre del cliente nuevo + campaña del cliente anterior) si el fetch de campañas nuevas no se trackea contra qué cliente pertenece — el efecto que lo reemplaza corre después del render, así que el frame intermedio es real, no solo teórico. El fix (`campaignsClientId` comparado en cada render + un id de request para ignorar respuestas tardías de un cliente del que ya se salió) es el patrón a seguir si se agrega otro fetch "por cliente seleccionado" en este archivo.
- **EasyPanel (donde vive n8n) intercepta las respuestas `502` de los webhooks y les reemplaza el cuerpo por su propia página de error genérica** ("Service is not reachable", con logo de EasyPanel) — el JSON real que devuelve el nodo `Respond to Webhook` nunca llega al cliente. Confirmado con una prueba aislada: la misma respuesta con código `500` sí pasa el cuerpo real, `502` no. Por eso todos los workflows de "Integraciones — WordPress" responden errores con `400`, nunca `502`/`503`/`504`. Si se agrega un workflow nuevo y sus respuestas de error "desaparecen" en el cliente, revisar primero el código de estado antes de sospechar de n8n.
- **`client_connections` tiene un CHECK constraint en `integration_type`** que limita los valores aceptados a una lista fija en la base de datos (no solo en el código de n8n) — antes de agregar un `integration_type` nuevo hay que migrar este constraint (`ALTER TABLE ... DROP CONSTRAINT ... ADD CONSTRAINT ... CHECK (integration_type = ANY (ARRAY[...]))`) o el `INSERT`/`UPDATE` falla. Pasó exactamente esto con `'wordpress'`: el código (Next.js + n8n) ya lo daba por soportado, pero el constraint todavía no lo incluía, así que cualquier conexión se hubiera "guardado" sin error visible salvo que el `RETURNING` viniera vacío — silencioso y fácil de pasar por alto. Ya está corregido (`wordpress` agregado a la lista), pero es la señal a buscar si un futuro `client_connections` INSERT "no tira error pero tampoco persiste".
- **`GET /api/evento/resumen-pagos` (desglose Gratuita/Platinum/VIP) no recibe ni filtra por `cliente_id` — devuelve siempre el mismo evento** (el route handler solo chequea que la sesión tenga acceso a `"atlas"`, hardcodeado). Cualquier otro cliente con una campaña `evento_presencial` (la mayoría son placeholders sin evento real todavía) va a ver el desglose de pagos de Atlas como si fuera suyo. El resto del módulo Evento (`gasto-pauta*`, KPIs de registro/check-in) sí es por cliente vía `cliente_id`/`campaign_id` — este endpoint es la excepción.

## 17. Deploy

```bash
npm i -g vercel
vercel
```

Configurar todas las variables de la sección 6 en Vercel → Settings → Environment Variables, para Production, Preview y Development.

## 18. Recuperación de contraseña (self-service)

Fuente: `lib/password-reset.ts`, `lib/email.ts`, `app/api/auth/olvide-password`, `app/api/auth/restablecer-password`, `app/olvide-password/page.tsx`, `app/restablecer-password/[token]/page.tsx`.

1. **Usuario pide el enlace** (`POST /api/auth/olvide-password`, público): firma un JWT local (mismo `JWT_SECRET` que el resto de la app, `purpose: "password_reset"`, expira en **1 hora**) y manda un correo brandeado vía Resend con el link `<origin>/restablecer-password/<token>`. **Siempre responde `{ ok: true }`**, exista o no una cuenta con ese correo — no revela si el correo está registrado; si el envío falla, el error solo se loguea en el servidor.
2. **Usuario abre el link y escribe la contraseña nueva** (`POST /api/auth/restablecer-password`, público): verifica el JWT localmente (firma + `purpose` + expiración); si es inválido o expiró, 400. Si es válido, llama al **mismo** webhook de n8n `admin/resetear-password` (`N8N_ADMIN_RESETEAR_PASSWORD_URL`) con `{ email, nueva_password }` — el mismo que usaría, si se llega a construir, un botón de reset manual desde `/admin/usuarios` (ver sección 6). n8n hashea con bcrypt (`crypt(..., gen_salt('bf'))`) directo en Postgres y devuelve 404 si el correo no corresponde a ningún usuario.
3. **Correo**: armado en `lib/email.ts` con tabla HTML + estilos inline (compatibilidad de clientes de correo). El logo se sirve desde una URL pública de GitHub raw (`raw.githubusercontent.com/plataforma-atlas/Dashboard---atlas/main/public/brand/vermetricas-horizontal-light.png`), **no como `data:` URI** — Gmail (y otros clientes) bloquea imágenes embebidas en base64 en el HTML del correo. Pendiente: cambiar a la URL de `/brand/` del propio dominio de producción una vez esté más consolidado, en vez de depender de GitHub.

**Gotcha para el equipo**: el botón de administrador para resetear la contraseña de otro usuario desde `/admin/usuarios` **no está construido** — solo existe el flujo self-service desde `/login`. De construirse, reutilizaría el mismo webhook de n8n (`N8N_ADMIN_RESETEAR_PASSWORD_URL`), solo cambia quién está autorizado a llamarlo (sesión de admin vs. token de reset firmado).

## 19. Sistema de animación/tipografía y selector de periodo

Pase de diseño aplicado a **todo el dashboard** (auth, admin, cartera, Webinar OS, Control Center, VSL, Evento presencial, check-in), basado en los principios de "design engineering" de Emil Kowalski (animar solo `transform`/`opacity`, curvas de easing propias, feedback de presión, nunca animar desde `scale(0)`, menos animación en acciones de alta frecuencia) y en una revisión de escala tipográfica (textos de 9-11px subidos a 12-15px donde se leían demasiado pequeños).

**`app/globals.css`** — utilidades nuevas, reusadas en todo el proyecto:
```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);

.press { transition: transform 160ms var(--ease-out); }
.press:active { transform: scale(0.97); }

.animate-fade-in-up { animation: fade-in-up 420ms var(--ease-out) both; }
.animate-pop-in { animation: pop-in 160ms var(--ease-out) both; }
```
- `.press` es el feedback estándar de cualquier botón/tarjeta clickeable del proyecto.
- `.animate-fade-in-up` / `.animate-pop-in` son para entradas de contenido (tarjetas, paneles) — nunca para elementos de alta frecuencia.
- Cualquier `transition: all` que quedara en el código se reemplazó por propiedades explícitas (`transition-colors`, `transition-transform`, o `transition-[width|height]`) con duraciones cortas (150ms para color/transform, 500ms para layout).
- **`/checkin` recibió la tipografía nueva pero deliberadamente casi ninguna animación de entrada** — es una pantalla operativa de alta frecuencia el día del evento (staff marcando entradas una tras otra), así que el framework de "¿cuántas veces al día se ve esto?" del skill dice que no debe animar.

**Selector de periodo del Control Center** (`components/webinar-os/control-center/WccFilterBar.tsx` + `components/webinar-os/control-center/PeriodCalendar.tsx`): reemplaza el antiguo `<select>` de semana fija por un popover con presets ("Todo", "Hoy", "7 días", "1 mes", "Personalizado") y un calendario de rango (dos meses lado a lado, `react-day-picker`) para elegir cualquier fecha de inicio/fin. El botón/panel de "Filtro avanzado" (semana específica) se eliminó por completo junto con el código muerto asociado (`mondayOf()`, `semanasEspecificas()`, tipo `SemanaEspecifica` en `lib/webinar-os/control-center/dateRanges.ts`); `RangoRapido` ahora es `"all" | "today" | "7days" | "1month" | "custom"`.

**Gotcha de `react-day-picker` (v10)**: su prop `classNames` **reemplaza** (no combina) la clase por defecto de cada elemento (`{ ...getDefaultClassNames(), ...props.classNames }` internamente) — si un override custom no vuelve a incluir la clase base `rdp-*`, el estilo de selección/relleno de rango se rompe silenciosamente (los extremos del rango se veían "huecos" en vez de rellenos por este motivo). Cualquier `classNames` nuevo en `PeriodCalendar.tsx` tiene que re-incluir la clase `rdp-*` correspondiente.

**Íconos**: se reemplazaron los glifos unicode del sidebar (`WccSidebarNav.tsx`, `AppSidebar.tsx`, `app/page.tsx`, el `<aside>` del Control Center) por íconos de `lucide-react` (ahora dependencia del proyecto) — `Home`, `DollarSign`, `MessageCircle`, `TrendingUp`, `Filter`, `LayoutList`, `LayoutDashboard`, `ArrowLeftRight`, `Briefcase`, `Users`, `UserCog`, `ClipboardList` (ítem "Leads"), más `Moon`/`Sun` en el nuevo `ThemeModeToggle` (sección 15). El link "Dashboard clásico" del Control Center (ícono `LayoutGrid`) se eliminó más adelante (sección 20, reemplazado por "Otras campañas").

## 20. Embudo de captación self-service (cliente)

Primera pieza de la visión de "self-service": el cliente arma su propio embudo, conecta sus propias cuentas de Meta/GHL, y revisa sus leads/compradores, todo desde el dashboard, sin que nadie del equipo tenga que tocar n8n a mano por cada cliente nuevo. Fuente: `app/panel/embudos/page.tsx`, `app/panel/leads/page.tsx`, `app/api/embudo/configurar/route.ts`, `app/api/onboarding/conectar-meta-ads/route.ts`, `app/api/leads/route.ts`, y en n8n los workflows `Núcleo — Embudo Webinar (Captación)`, `Núcleo — Leads y Compradores`, `Núcleo — Configurar Embudo`, `Integraciones — Pull Meta Ads (Cliente)` e `Integraciones — Pull GoHighLevel (Cliente)` (carpetas "07 · Núcleo Compartido" y "11 · Integraciones Cliente" en n8n).

**Modelo del embudo (Webinar Automático)**: 4 etapas capturadas por el cliente — `Registro Inicial` (sort_order 1) → `Encuesta Completada` (2) → `Ingresó a Grupo de WhatsApp` (3) → `Registro a Webinar` (4, agregada en esta sesión) — seguidas de las etapas ya existentes que llenan otros flujos (`Descargó Workbook`, `Nivelatorio 1-3`, `Asistió Webinar`, `Compra Producto Principal`, sort_order 5-10). Todas viven en la tabla compartida `funnel_stages` (columnas `strategy_type`, `sort_order`, `stage_name`) — el catálogo de etapas es global por `strategy_type`, no por cliente, así que estas 4 etapas quedan disponibles para cualquier cliente que use Webinar Automático, no solo para el que las disparó primero.

**Flujo de "crear/activar un embudo"** (`/panel/embudos`, visible para cliente y admin):
1. Cuando se crea un cliente con la estrategia "Webinar Automático" (`/admin/clientes`), ya se le crea automáticamente una `campaign` en `status = 'draft'` con `slug = NULL` (lógica existente en `Núcleo — Gestión de Clientes`, no nueva).
2. El cliente (o el admin en su nombre) le pone un nombre a ese embudo en `/panel/embudos`; eso llama a `POST /api/embudo/configurar` → n8n `admin/configurar-embudo`, que slugifica el nombre, lo guarda como `campaigns.slug`, y pasa el `status` a `'active'`. El slug debe ser único por cliente (columna sin constraint de DB, la unicidad la valida la query con `NOT EXISTS`).
3. Con el embudo activo, la página muestra las 4 URLs de captación ya armadas (`.../webhook/embudo-webinar/{registro,encuesta,whatsapp,registro-webinar}?cliente_id=&campaign=<slug>`) con botón de copiar — son las que el cliente pega en su landing page / automatización de WhatsApp / plataforma de webinar. **El cliente nunca ve n8n ni tiene que configurar nada ahí.**
4. Los 4 endpoints son un **único workflow compartido multi-tenant** (como ya hacía `ClaseEspecial`), diferenciado por querystring — no se crea un workflow nuevo en n8n por cada cliente ni por cada embudo.

**Conexión de Meta Ads** (`/panel/conexiones`, sección "Configuración" del sidebar): mismo patrón que GoHighLevel — el cliente pega el ID de su cuenta publicitaria y un token de acceso (`ads_read`), se guardan en `client_connections` (`config.ad_account_id`, `credential_encrypted` cifrado con `pgp_sym_encrypt`). Nunca se vuelve a mostrar el token real, solo el booleano "conectado". El pull real (`Integraciones — Pull Meta Ads (Cliente)`, `GET /webhook/integraciones/meta-ads-resumen?cliente_id=`) descifra el token con `pgp_sym_decrypt` y llama a la Graph API de Meta directamente — nunca pasa por Next.js. Mismo patrón para GHL (`Integraciones — Pull GoHighLevel (Cliente)`, trae los pipelines del cliente usando su propio token guardado).

**Gotcha real encontrado y corregido en esta sesión**: `pgp_sym_decrypt(bytea, text)` en Postgres **ya devuelve `text`**, no `bytea` — envolverlo en `convert_from(..., 'UTF8')` (como parecía sugerir el nombre de la función) rompe la query con `function convert_from(text, unknown) does not exist`. Como esos nodos de Postgres tenían `alwaysOutputData: true` + `onError: continueErrorOutput`, el error quedaba enmascarado: el endpoint respondía `200 {"conectado": false}` en vez de fallar visiblemente, dando la falsa impresión de que el cliente no había conectado nada. Cualquier query nueva que use `pgp_sym_decrypt` sobre `client_connections.credential_encrypted` debe usarlo directo, sin `convert_from`.

**Gotcha de las respuestas de error en n8n**: los nodos `Respond to Webhook` de error interpolaban el mensaje real (`$json.error?.message`) directo dentro de un string JSON escrito a mano — si ese mensaje traía comillas (común en errores de APIs externas, ej. Meta devuelve un JSON crudo dentro del mensaje del error), el JSON de respuesta quedaba inválido y el nodo fallaba. Se corrigió armando el body de respuesta con `{{ JSON.stringify({ error: "...", detalle: $json.error?.message || $json.message }) }}` en vez de concatenar strings — mismo patrón que ya usaban `Onboarding - Responder Estado Error` y otros nodos "viejos" del proyecto original.

**"Otras campañas" reemplaza el escape hatch genérico**: en vez de un único link "Dashboard clásico", el Control Center ahora tiene un menú desplegable "Otras campañas" que solo aparece si el cliente tiene campañas de VSL, Evento presencial o Lanzamiento además de su Webinar Automático (`otrasCampanas.length > 0` — misma variable que ya alimentaba el `<optgroup>` "Otras estrategias" de `WccFilterBar`, ahora también usada acá). Clientes nuevos creados por el flujo de onboarding de esta sesión solo tienen una estrategia, así que nunca ven este menú — aparece solo para clientes existentes con múltiples estrategias (Andrea Torres, Floppy, John, Atlas). Cada campaña listada linkea a `/?vista=clasica&cliente_id=&campaign_id=`, igual que el selector de campañas.

**URLs enmascaradas — el cliente nunca ve "n8n"**: las URLs de captación que ve el cliente (las 4 del embudo + el webhook de ClaseEspecial) no apuntan directo a n8n — pasan por un proxy propio, `app/api/hooks/[...path]/route.ts` (ruta pública, agregada a `PUBLIC_PATHS` en `middleware.ts`), que reenvía la request a `N8N_WEBHOOK_BASE_URL` y devuelve la respuesta tal cual. Tiene una lista blanca explícita de paths permitidos (`embudo-webinar/registro`, `embudo-webinar/encuesta`, `embudo-webinar/whatsapp`, `embudo-webinar/registro-webinar`, `dsm-webinarkit`) — cualquier otro path devuelve 404, para no exponer accidentalmente otro webhook interno de n8n a través del dominio propio. Las páginas (`/panel/embudos`, `/panel/conexiones`) arman estas URLs con `window.location.origin`, no con un valor hardcodeado, así que apuntan solas al dominio correcto en cada entorno (local/producción). Nota: `embudo-webinar/leads` (sección "Leads y compradores" más abajo) **no** pasa por este proxy — es una consulta autenticada por sesión (`/api/leads`), no un webhook público que herramientas externas necesiten llamar sin cookie, así que no tenía sentido agregarlo a la lista blanca.

**Leads y compradores** (`/panel/leads`, tercer ítem del sidebar junto a "Configuración" y "Embudos"): pantalla que lista los leads capturados por el embudo, con pestañas "Leads" / "Compradores", filtro por campaña, y export a CSV/Excel. Fuente: `app/api/leads/route.ts`, `components/panel/LeadsBody.tsx`, `components/ui/pagination.tsx`.
- `GET /api/leads?cliente_id=&campaign=` — mismo patrón de sesión/rol que `/api/campanas` (admin ve cualquier cliente, cliente solo el suyo vía `clientesDeSesion()`) — proxea a `N8N_EMBUDO_WEBINAR_LEADS_URL` (workflow `Núcleo — Leads y Compradores`, `GET /webhook/embudo-webinar/leads`). El workflow no pagina server-side: devuelve todas las filas que matchean `cliente_id`/`campaign`, con el nombre/etapa/monto ya agregados vía `JOIN`/`GROUP BY` contra `leads`, `campaigns`, `funnel_events`, `funnel_stages`. La pestaña "Compradores" es un filtro client-side sobre ese mismo array (`es_comprador = true`), no una segunda llamada.
- **Paginación**: `components/ui/pagination.tsx` es un componente propio (Previous/Next/Primera/Última página, selector de filas por página, texto "X-Y de Z"), hecho a mano con los tokens de diseño del proyecto (`bg-surface`, `.press`, etc.) en vez de instalar `@ark-ui/react`/shadcn — el proyecto no usa esas librerías en ningún otro lado y traen su propio sistema de estilos que no calza con el theming existente. Pagina client-side sobre el array ya filtrado por pestaña/campaña.
- **Export CSV/Excel**: 100% client-side, sin librerías nuevas. CSV es un `Blob` de texto con BOM UTF-8; "Excel" es el truco clásico de servir una tabla HTML con `Content-Type: application/vnd.ms-excel` y extensión `.xls` (Excel la abre igual que un `.xlsx` real). Exporta las filas de la pestaña/campaña actual, no solo la página visible.
- Desde `/panel/embudos`, cada embudo activo tiene un botón "Ver leads y compradores" que abre este panel con la campaña ya preseleccionada — pasa el slug vía `openLeads(slug)` en `SidePanelProvider` (nuevo campo `leadsCampaign` en el contexto, además del `open` de siempre).

**"Configuración" / "Embudos" / "Leads" reemplazan el contenido principal in-place, no navegan ni abren un popup**: en los tres sidebars (dashboard clásico, Control Center, `AppSidebar`), estos tres items son `<button>` — al hacer click, el `<main>` de la pantalla actual muestra `ConexionesBody`/`EmbudosBody`/`LeadsBody` (`components/panel/`) en vez de su contenido normal, sin overlay, sin backdrop, sin botón de cerrar. El sidebar se queda exactamente igual y el item activo queda resaltado. Es un toggle: click de nuevo en el mismo botón vuelve al contenido normal de esa pantalla. El estado (`open: "configuracion" | "embudos" | "leads" | null`) vive en `components/SidePanelProvider.tsx` (contexto `useSidePanel()`, provisto en `app/layout.tsx`) — el provider no renderiza UI propia, cada pantalla decide cómo mostrar `open`. Al navegar de verdad a otra ruta (cambio de `pathname`), el provider resetea `open` a `null` automáticamente. Los links de navegación internos del Control Center (`WccSidebarNav`, anclas `#resumen` etc.) no cambian de `pathname`, así que cierran el panel explícitamente antes de saltar a la sección. Las páginas standalone `/panel/conexiones`, `/panel/embudos` y `/panel/leads` se mantienen para acceso directo por URL, y también respetan `open` (si `open` apunta a otro panel, lo muestran en vez de su propio contenido por defecto). De paso se quitó el link "Dashboard clásico" del sidebar del Control Center — ya no tenía una función clara una vez agregados estos accesos.

**Actualización 2026-09-24**: el constructor de páginas web / integración WordPress mencionado acá como visión a futuro ya tiene su backend construido — ver sección 21.

## 21. Constructor de páginas propio + integración WordPress (backend, sin wizard todavía)

Segunda pieza de la visión "self-service", separada del embudo de webinar de la sección 20: en vez de depender de una herramienta externa (tipo Zoryam) para armar landing pages de captación/encuesta/gracias, el objetivo es que el propio dashboard las genere y las publique directo en el WordPress del cliente. **Lo que existe hoy es el backend completo (modelo de datos + n8n + rutas Next.js) — todavía no hay ninguna pantalla de wizard que arme el HTML ni un botón "Publicar" visible en la UI.** Esta sección documenta ese backend tal cual quedó, para que quien construya el wizard sepa exactamente con qué contratos tiene que hablar.

### Modelo de datos

Fuente: migración corrida a mano vía un workflow temporal de n8n (no hay archivo `.sql` en el repo, igual que el resto del proyecto).

```sql
landing_pages (
  id, cliente_id, slug, nombre, tipo_funil ('webinario'|'sesion_estrategica'),
  plantilla, colores/copy/encuesta/gracias/imagenes (jsonb), status, created_at, updated_at,
  UNIQUE (cliente_id, slug)
)
landing_page_leads (
  id, cliente_id, pagina_id → landing_pages.id, nombre, email, whatsapp, respuestas (jsonb),
  utm_source/utm_medium/utm_campaign/utm_term/utm_content, fbclid, gclid, ttclid, referrer, landing,
  created_at, updated_at
)
```

`landing_pages` guarda el estado completo del wizard (para poder reabrir/editar/regenerar una página ya creada, como el "Páginas salvas" de la referencia). `landing_page_leads` es el equivalente propio a la hoja de Google Sheets que usan herramientas como Zoryam — mismo patrón de "buscar por email/whatsapp dentro de la misma página, actualizar si ya existe" que ya usa el embudo de webinar (sección 20), para no duplicar leads entre el paso de captura y el de encuesta.

### `Núcleo — Páginas de Captación` (n8n, carpeta "07 · Núcleo Compartido")

Cuatro webhooks:
- `POST /webhook/paginas/guardar` — upsert por `(cliente_id, slug)` (`ON CONFLICT DO UPDATE`, reemplaza el snapshot completo — el caller siempre tiene que mandar el estado entero, no un parche parcial). Devuelve `{ ok, id, slug }`.
- `GET /webhook/paginas/listar?cliente_id=` — lista liviana (sin el jsonb completo) para la pantalla de "páginas guardadas".
- `GET /webhook/paginas/detalle?cliente_id=&id=` — trae la config completa de una página; 404 si no existe o no es de ese cliente.
- `POST /webhook/paginas/evento?cliente_id=&pagina_id=` — el único endpoint **público** de los cuatro (pensado para ir embebido directo en el HTML/WordPress generado, sin pasar por `/api/hooks` porque no es un webhook que herramientas externas necesiten llamar). Acepta `{ tipo: "lead"|"pesquisa", nombre, email, whatsapp, utm, respuestas }` — mismo comportamiento que el Apps Script de referencia: busca el lead por email/whatsapp dentro de esa `pagina_id`, actualiza si existe (con los UTM en modo "primer touch": `COALESCE(utm_x, nuevo_valor)`, nunca se pisa el dato una vez capturado) o crea si no.

Rutas Next.js: `app/api/paginas/route.ts` (`GET` listar / `POST` guardar) y `app/api/paginas/[id]/route.ts` (`GET` detalle) — mismo patrón de sesión/rol que el resto (`clientesDeSesion()`, admin ve cualquier cliente).

### Conexión de WordPress (`/panel/conexiones`)

A diferencia de GHL/Meta Ads (sección 13), WordPress **no** reutiliza el webhook genérico `onboarding/conectar-integracion` — tiene su propio workflow porque necesita probar la credencial contra la API real antes de guardarla (el "Testar e salvar conexão" de la referencia). Fuente: `Integraciones — WordPress (Cliente)` (n8n, carpeta "11 · Integraciones Cliente"), `components/panel/ConexionesBody.tsx` (tarjeta "WordPress").

- `POST /integraciones/wordpress-conectar` — recibe `{ cliente_id, site_url, username, application_password }` (la "contraseña de aplicación" de WordPress, no la de login — se genera en Usuarios → Perfil → Contraseñas de aplicación). Normaliza la URL (agrega `https://` si falta, saca la barra final), arma el header `Authorization: Basic base64(usuario:password)` a mano (no usa el sistema de credenciales de n8n porque el usuario/password son dinámicos por cliente) y llama a `GET {site}/wp-json/wp/v2/users/me`. Solo si WordPress responde con un usuario válido (`id` presente) guarda en `client_connections` (`integration_type: 'wordpress'`, `config: { site_url, username }`, `credential_encrypted` = la contraseña de aplicación cifrada con `pgp_sym_encrypt`, misma clave que el resto del proyecto). Si falla la prueba, no guarda nada y responde `400` con un mensaje claro.
- `GET /integraciones/wordpress-estado?cliente_id=` — `{ conectado, site_url, username, updated_at }` — nunca devuelve la contraseña.
- `POST /integraciones/wordpress-desconectar` — borra la fila de `client_connections`.

Rutas Next.js: `app/api/onboarding/conectar-wordpress`, `wordpress-estado`, `desconectar-wordpress` — mismo patrón de sesión/rol.

**Gotcha real encontrado y corregido**: `client_connections` tiene un CHECK constraint de base de datos (`client_connections_integration_type_check`) que restringía `integration_type` a `('ghl','meta_ads','whop','webinarkit','hotmart')` — **`'wordpress'` no estaba en la lista**. El código (tanto n8n como esta documentación) ya daba por hecho que `wordpress` era un valor válido, pero cualquier `INSERT`/`ON CONFLICT DO UPDATE` con ese valor violaba el constraint. Se migró el constraint para agregar `'wordpress'`. Ver también el gotcha de EasyPanel/502 en la sección 16, encontrado mientras se diagnosticaba este mismo problema.

### Publicar páginas en WordPress

`Integraciones — Publicar en WordPress (Cliente)` (n8n, misma carpeta): `POST /integraciones/wordpress-publicar`, body `{ cliente_id, captura, encuesta, gracias }` donde cada una de esas tres claves es `{ slug, titulo, html } | null` (el HTML ya renderizado — este workflow no genera copy ni arma plantillas, solo publica lo que le llega). Para cada clave presente:
1. Busca en WordPress si ya existe una página con ese `slug` (`GET /wp-json/wp/v2/pages?slug=&status=any`).
2. Si existe, la actualiza (`POST /wp-json/wp/v2/pages/{id}`); si no, la crea (`POST /wp-json/wp/v2/pages`) — ambas con `status: 'publish'`.
3. Devuelve `{ tipo, ok, slug, url }` o `{ tipo, ok: false, error }` por cada una; las que vienen `null` responden `{ tipo, ok: true, omitido: true }` sin llamar a WordPress.

Los tres resultados se combinan con dos nodos `merge` (append) en cascada — no con un loop (`splitInBatches`) porque la cardinalidad es fija (siempre son a lo sumo 3 páginas conocidas de antemano, nunca un array dinámico), lo que evita el problema típico de n8n de perder el contexto por-item al salir de un loop. Ruta Next.js: `app/api/paginas/publicar-wordpress/route.ts`.

Probado de punta a punta con una conexión de prueba contra `wordpress.org` real (credenciales inválidas a propósito, para no depender de un sitio real): las 3 ramas devolvieron el error real de WordPress (`401 rest_cannot_create`) y la omitida se marcó correctamente — el mecanismo completo (búsqueda, creación/actualización, combinación de resultados) quedó verificado, solo falta un sitio con credenciales reales para confirmar el camino 100% feliz.

**Pendiente / fuera de alcance de esta sesión**: el wizard visual que arma el `copy_spec` por secciones, elige plantilla/colores, arma la encuesta pregunta por pregunta y genera el HTML final a partir de todo eso — hoy ese HTML tendría que armarse a mano para poder llamar a `/api/paginas/publicar-wordpress`. Tampoco hay todavía un botón "Publicar" en ninguna pantalla del panel.
