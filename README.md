# Dashboard Agencia Atlas

Panel multi-cliente en Next.js que muestra el embudo de conversión de cada cliente
(registro → asistencia → compra), con módulos dedicados según la estrategia de cada
campaña. Los datos vienen de Postgres a través de un backend en n8n — nunca se
fabrican cifras: todo lo que no tiene fuente real se muestra como `—`.

## Correr localmente

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Necesitas un `.env.local` con las URLs de los webhooks
de n8n y el `JWT_SECRET` (mismo secret que la credencial "JWT Key" en n8n) — ver la
lista completa de variables esperadas en cada `app/api/**/route.ts`.

## Arquitectura

- **Backend**: workflow "Atlas" en n8n expone webhooks de lectura (`campanas`,
  `calcular-embudo`, `clientes`, admin/*) filtrados siempre por `cliente_id`. Cada
  cliente tiene además su propio workflow de n8n para la ingesta de sus leads
  (formularios de GHL, landing pages, etc.).
- **Auth**: sesión JWT en cookie (`atlas_session`), verificada en cada API route y
  en `middleware.ts`. Roles `admin` (ve todos los clientes) y `client` (solo los
  suyos).
- **Multi-tenant**: la lista de clientes vive en Postgres (tabla `clients`, con
  `status active/archived`), no en el código — se administra desde
  `Admin > Clientes`.

## Estrategias soportadas por campaña (`campaigns.strategy_type`)

| Estrategia | Módulo en el dashboard |
|---|---|
| `webinar_automatizado` | Webinar OS — resumen ejecutivo, 11 módulos de detalle, export a PDF |
| `vsl` | Dashboard VSL — KPIs reales, comparación por ángulo, embudo de intención |
| `evento_presencial` | Evento presencial — registro/check-in/venta, comparación por ángulo |
| `lanzamiento` | Dashboard genérico (funnel, países, fuentes) |

## Estructura

```
app/
  page.tsx                 → SPA principal, selector de cliente/campaña + routing por estrategia
  api/                      → proxies server-side hacia los webhooks de n8n (auth + permisos)
  admin/usuarios/           → gestión de usuarios y accesos por cliente
  admin/clientes/           → crear / desactivar clientes
  admin/cartera/            → portafolio cruzado entre todos los clientes (Webinar OS)
  panel/conexiones/         → estado de integraciones del cliente (GHL, ClaseEspecial)
  webinar-os/control-center/[clienteId]/ → vista semanal agregada de campañas de webinar por cliente
  checkin/                  → pantalla de check-in para el evento presencial
components/
  webinar-os/, vsl/, evento/ → componentes de cada módulo dedicado
lib/
  aggregate.ts               → transforms puros: filas del embudo → datos para cada gráfico
  webinar-os/, vsl/, evento/ → tipos y agregaciones específicas de cada módulo
  clients.ts                 → temas de marca por cliente (fallback: tema genérico de Atlas)
```

## Deploy en Vercel

```bash
npm i -g vercel
vercel
```

Configura las variables de entorno (`.env.local`) en Vercel → Settings → Environment
Variables para Production, Preview y Development.
