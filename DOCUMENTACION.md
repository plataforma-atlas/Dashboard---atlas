# Documentación técnica — Panel Vermetricas

> Este documento complementa al [`README.md`](./README.md) (quick-start) con el detalle completo del proyecto: arquitectura, autenticación, modelo de datos, inventario de rutas/APIs, integración con n8n, y los flujos de onboarding de clientes. Generado a partir de una lectura completa del código el 2026-09-14 — todo lo que dice acá está verificado contra archivos reales del repo, no es una descripción genérica. Actualizado el 2026-09-15 con el sidebar compartido/colapsable y los cambios de navegación del Control Center (secciones 7, 8 y 16). Actualizado el 2026-09-16 con el flujo de recuperación de contraseña self-service vía Resend (sección 18) y sus variables de entorno (sección 6). Actualizado el 2026-09-18 con el rediseño del selector de periodo del Control Center, el reemplazo de íconos del sidebar, el sidebar theme-aware + nuevo switch claro/oscuro, y el sistema de animación/tipografía aplicado a todo el dashboard (secciones 15 y 19). Actualizado el 2026-09-23 con el embudo de captación self-service para clientes (páginas `/panel/embudos` y `/panel/conexiones` con Meta Ads), sus nuevos endpoints de n8n, las tablas/etapas de Postgres que usan, el proxy que enmascara las URLs de n8n, la navegación "Configuración"/"Embudos"/"Leads" in-place (sin popup) en los tres sidebars, el menú "Otras campañas" del Control Center para clientes multi-estrategia existentes, y la pantalla `/panel/leads` de leads/compradores con paginación propia (`components/ui/pagination.tsx`) y export a CSV/Excel (sección 20). Actualizado el 2026-09-24 con el backend del constructor de páginas propio (tablas `landing_pages`/`landing_page_leads`, workflow `Núcleo — Páginas de Captación`, rutas `/api/paginas/*`) y la integración de WordPress (conectar con prueba de credenciales real, estado, desconectar y publicar páginas por REST, workflows `Integraciones — WordPress (Cliente)` e `Integraciones — Publicar en WordPress (Cliente)`, tarjeta "WordPress" en `/panel/conexiones`). Actualizado el mismo día con el wizard visual del constructor de páginas (`/panel/paginas`, panel "Páginas" en los tres sidebars, `components/panel/PaginasBody.tsx`), el generador de HTML propio (`lib/paginas/templates.ts`, `/api/paginas/generar-html`) y el flujo completo de guardar/editar/previsualizar/publicar en WordPress (sección 21). Actualizado el mismo día otra vez con el rediseño del wizard a 9 pasos explicativos (Funil/Flujo/Modelo con descripciones tipo referencia externa, en vez de un formulario plano), el flujo de 2 vs 3 páginas con slugs por página, y el formato de WhatsApp del popup — todo guardado dentro de la columna `copy` (JSON libre) sin tocar Postgres ni n8n (sección 21). Actualizado el mismo día una tercera vez con el rediseño completo de la plantilla "Estándar" de captura a partir del análisis de páginas de captura reales del cliente (hero con foto + mecanismo + checklist + experto + footer + CTA fijo global, todo detrás de un popup de formulario en vez de un form inline) y el grid de miniaturas del paso "Modelo" (sección 21). Actualizado el mismo día una cuarta vez con el rediseño completo de la página de encuesta como quiz de una pregunta por pantalla con barra de progreso, en dos plantillas intercambiables ("Estándar" y "Urgencia" con opciones por emoji), el selector con vista previa en modal generada en vivo desde el propio cliente, y el editor de opciones por pregunta (ya no un campo de texto separado por comas) (sección 21). Actualizado el 2026-09-25 con dos fixes de layout (el `body` sin `flex-direction: column` que descuadraba la card y el footer de la encuesta "Estándar", y el brand-label con `position: absolute` que quedaba montado encima de la card), el desacople de seleccionar-vs-previsualizar plantilla de encuesta (antes un solo click hacía las dos cosas), y una auditoría de "taste" contra la skill externa `Leonxlnx/taste-skill` (ban de em-dash, racionamiento de punto medio) aplicada al HTML generado, sin instalar el paquete (sección 21). Actualizado el mismo día otra vez tras encontrar y corregir dos problemas reales de producción (no de código): faltaban en Vercel las 5 variables de entorno de `N8N_PAGINAS_URL`/`N8N_WORDPRESS_*` agregadas el 2026-09-24 (nunca se replicaron desde `.env.local`), y `JWT_SECRET` estaba desincronizado entre `.env.local` y Vercel desde la rotación del 2026-09-22, lo que rompía el login en producción para cualquier usuario — ambos corregidos vía API de Vercel + redeploy, documentados como gotchas nuevos (secciones 16 y 17). Actualizado el mismo día una vez más con el rediseño de la página de gracias (ícono de check, card en los colores de la página, botón CTA condicional y nueva nota de confirmación chica debajo del botón) para que coincida con la referencia externa (sección 21). Actualizado el 2026-09-25 una vez más: **el constructor de páginas se pausó a pedido explícito del cliente** — se va a construir aparte en otro proyecto/plataforma — y se sacó de la navegación en los tres sidebars (`AppSidebar.tsx`, dashboard clásico, Control Center) y la tarjeta "WordPress" de `/panel/conexiones`, sin borrar nada del código/backend (sección 21). **Actualizado el 2026-09-25 una vez más con la sección 22, nueva**: toda la V3 (`/v3/*`), el rediseño del dashboard inspirado en VK Metrics — multi-cuenta de Meta Ads, "dashboards" por nomenclatura de campaña, Administrador de Anuncios con los 3 niveles de Meta (Campañas/Conjuntos/Anuncios) y pausar/activar en vivo, Análisis de Anuncios con tarjetas por ROAS y comparación, y los tres workflows de n8n nuevos que lo sostienen. Es la primera vez que este proyecto escribe (no solo lee) contra la API de Meta. Actualizado el mismo día una vez más con los dashboards de tipo Lanzamiento/Webinar, la conexión de Go High Level dentro de la V3, los "puntos de captación" (un endpoint público por landing, con token propio) y el workflow `Integraciones — Captación Lead (Cliente)` que guarda cada lead y opcionalmente lo crea/etiqueta en GHL, más la nueva sección "Base de datos" (sección 22). Actualizado el mismo día una vez más: el resto del embudo de Lanzamiento (Encuesta, Página de gracias, Ingreso a grupos vía SendFlow, Mensaje 1a1) con endpoints enmascarados vía el proxy `/api/hooks/[...path]` que ya existía (nunca se expone n8n), una página nueva `/v3/[clienteId]/endpoints` que centraliza todos los enlaces por punto de captación, y `client_leads.extra jsonb` para acumular los datos de cada paso del embudo (sección 22). Actualizado el 2026-09-26 con la conexión de Hotmart (todas las ventas reales de un cliente, vía webhook, combinando el patrón de credencial guardada con el de webhook enmascarado que ya existían por separado) y el reajuste de prioridades del embudo (sección 22). Actualizado el 2026-10-06 con el Administrador de Anuncios (columnas, conversiones personalizadas, visión consolidada con gráfico diario, filtro de fecha y ver anuncio), el Análisis de Anuncios (grupos guardados, criterio de leads calificados, ordenar, filtros) y la sección de UTM del dashboard (secciones 22 y 23). Actualizado el 2026-09-27 con el campo `sck` de Hotmart (atribución real de qué grupo/mensaje generó cada venta, confirmado contra la documentación oficial de Hotmart), el filtro por dashboard y el export a CSV en "Base de datos", y un gotcha nuevo del SDK de n8n sobre nodos IF encadenados directamente que descartan un nodo en silencio (sección 22).

## Estado actual — resumen vigente (2026-10-06)

Esta sección es la foto de hoy. Las secciones de abajo son el historial de cómo se llegó acá: cuando algo de ahí contradice este resumen, **manda este resumen**.

### Qué versión está activa
- **La V3 es la única versión visible.** Todo cliente y todo admin entra a `/v3`. El login lleva ahí por defecto.
- **La versión clásica** (`/`, `/panel/*`, `/admin/*` viejo) queda como **respaldo**: el código y las rutas no se borran, pero no hay links desde la V3.
- **Constructor de páginas, Webinar Control Center** y demás secciones antiguas: sin cambios desde sus propias secciones de este documento.

### Cómo se crea una cuenta
- **Un usuario y su cliente se crean juntos**, con el mismo nombre (si es "Andrés", el cliente es "Andrés"). El cliente recibe un **ID aleatorio único** que lo identifica en todo el sistema; el nombre no se usa como identificador.
- Desde **Usuarios** en la V3 (solo admin), botón **"+ Nuevo usuario"** → popup. Se piden nombre, correo, rol (cliente / admin / check-in) y tipo de acceso. Se genera una **contraseña temporal** y se envía por correo.
- El admin puede ver el **ID de cada cliente** en la columna "Clientes asignados".
- **La estrategia (Lanzamiento / Webinar) la elige el cliente** al crear su dashboard. No se pide al dar de alta.
- Los **clientes** se crean desde Usuarios. No hay alta de cliente por separado en la V3 (el selector de clientes ya no lo ofrece).

### Acceso y suscripción
- **Estado de la cuenta**: `activa`, `pago_pendiente` o `bloqueada`. Bloquear **no borra datos**; reactivar devuelve todo.
- **Tipo de acceso**: `vitalicio`, `prueba_7` (7 días) o `demo_15` (15 días, mostrado como "Prueba 15 días"). La fecha de vencimiento se calcula al asignarlo.
- **Login**: si la cuenta está bloqueada o vencida, no entra. Si tiene pago pendiente, entra y ve un aviso de que debe pagar para seguir.
- **Sesión**: la cookie dura **1 día**. El estado se revisa en cada carga de página (no en cada llamada a la API). Hueco conocido: alguien con cookie vigente que llame la API directo sigue hasta que venza.
- **Correos vinculados**: una misma cuenta puede entrar con **más de un correo** (por si compró con otro). El admin los agrega, los quita, o cambia el principal. El correo anterior, al cambiar el principal, deja de entrar.

### Equipo
- Un cliente puede **invitar a su equipo por correo** desde la V3 (ítem **Equipo**). El invitado recibe un link, crea su cuenta y queda vinculado al mismo cliente, con **el mismo acceso completo** que quien invitó.
- **Pendiente**: límite de miembros y permisos granulares por sección (quedó anotado para después, a pedido del usuario).

### Ventas (Whop)
- Las ventas se cobran por **Whop** (planes mensuales, trimestrales y semestrales, con prueba posible). Hotmart no tuvo ventas; su tarjeta queda visible en Conexiones.
- **Endpoint del webhook**: `https://www.vermetricas.com/api/whop/webhook`. Verifica la firma (Standard Webhooks) con `WHOP_WEBHOOK_SECRET` y guarda cada evento en la tabla `whop_eventos` (sin duplicados por `webhook-id`).
- Una clave de API de **solo lectura** (`WHOP_API_KEY`, permisos "Read members" y "Read member emails") permite leer el correo y el nombre del comprador.
- **Estado actual: el webhook está apagado en Whop** hasta que haya precios y planes definidos. Los eventos de prueba recibidos se guardaron sin crear cuentas.
- **Pendiente**: el ID real de cada plan (mensual, trimestral, semestral) para asignar la duración de acceso, y la lógica de alta automática por compra (crear usuario y cliente, enviar contraseña temporal) y de pago pendiente / bloqueo. Los eventos relevantes son `membership.activated`, `membership.deactivated` (cancelación o vencimiento), `invoice.past_due` (pago atrasado) e `invoice.paid` (pago al día).

### Principio de integración
- **Vermetricas recibe datos de otras plataformas, pero no les envía datos.** Ya no se empuja nada a GoHighLevel al capturar un lead; la conexión de GHL se guarda para un uso futuro (que otra plataforma consulte datos de Vermetricas).
- Los webhooks que pegan los clientes en sus landings o herramientas se llaman **Webhooks** en la V3 (sección renombrada desde "Endpoints"). La excepción es el **pixel de visitas**, que es un snippet de imagen y no un webhook; por eso se rotula como pixel.

### Pendientes conocidos
- Límite de miembros de equipo (permisos por niveles y dashboards ya aplicados en el servidor; falta la pantalla que lo muestra a cada miembro).
- Precios, planes y IDs de planes en Whop; encendido del webhook; lógica de alta automática y de bloqueo por cancelación o atraso.
- **Check-in** (rol de personal externo de eventos): la pantalla existe, pero la gestión de ese personal queda para más adelante.
- **Backoffice** para el equipo de Vermetricas: planeado, pendiente. Se contempla desde ahora en el modelo de roles.
- **Versión móvil de la pantalla de Usuarios**: en pantallas angostas la tabla se corta.
- Cliente o usuario eliminado de forma definitiva: hoy solo hay **desactivar** (no borra). Un borrado real requiere una consulta directa, que se hace solo con confirmación.

### Administrador, análisis de anuncios y dashboard (2026-10-06)
- **Administrador de Anuncios** (`/v3/[clienteId]/anuncios`): tres pestañas (Campañas, Conjuntos, Anuncios). En la fila de pestañas: botón **Gráfico** (se habilita al seleccionar filas) y **Columnas**. Filtro de fecha igual al del dashboard (Hoy, 7/30/90 días, Todo el período, Rango personalizado). Las tablas se configuran con **Columnas** (métricas de tráfico y de conversión, en el orden que elija la persona). Se pueden crear **conversiones personalizadas** que combinan dos eventos de los leads (Y, Luego, No). Al seleccionar filas se abre la **visión consolidada**: totales ponderados y un gráfico diario de los anuncios seleccionados (barras o línea, hasta dos métricas). Cada anuncio tiene un botón **Ver anuncio** que muestra la vista previa de Meta dentro de Vermetricas, sin que quien la ve necesite cuenta de Meta.
- **Análisis de Anuncios** (`/v3/[clienteId]/analisis`): grupos predefinidos (Todos, Mejores ganchos, Mejor ROAS, Mejores leads) y **grupos guardados por cliente**. El grupo **Mejores leads** cuenta como calificados los leads cuya respuesta de una pregunta de la encuesta cumple un criterio (las N de mayor monto, desde un monto mínimo, o marcadas a mano). Popup **Filtros y métricas**, **Ordenar** por cualquier métrica, y botón **Ver anuncio**.
- **Dashboard de Lanzamiento**: debajo de país y ciudad hay una sección de **UTM** (fuente, medio, campaña, contenido y término) con los leads por valor; los leads sin ese dato cuentan como "(sin dato)".
- **Límite importante**: el cruce de leads con anuncios se hace por `utm_content`, que tiene que traer el **id del anuncio** (`{{ad.id}}` en la URL del anuncio de Meta). Mientras eso no esté configurado en un cliente, las columnas y métricas de leads por anuncio salen en "—" o en 0.
- **Filtro de fecha**: aplica al Administrador de Anuncios (tablas, totales y gráfico diario). El dashboard principal (Home) sigue en los últimos 30 días.

### Pendientes de la etapa de anuncios (2026-10-06)
- **Atribución por anuncio en los clientes**: configurar `utm_content={{ad.id}}` en cada anuncio de Meta y confirmar que las landings lo pasen. Sin eso, las métricas de leads por anuncio no tienen datos reales.
- **Home en 30 días**: el dashboard principal todavía no usa el filtro de fecha del Administrador.
- **Criterio "calificado" y "vio la clase"** no están entre los eventos de las conversiones personalizadas todavía.
- **Editar el nombre de una conversión o de un grupo** no existe: se crean, se actualizan o se eliminan.
- **Vista previa**: el popup usa un alto fijo de 820 px; un anuncio más alto que eso se corta.
- **Gráfico diario**: hasta 200 anuncios por consulta y 36 meses hacia atrás (límite de Meta). Los rangos largos tardan varios segundos.
- **Pausar en lote**: la barra fija de "Pausar / Activar seleccionados" aparece también cuando la selección es solo para la visión consolidada. Pendiente decidir si se muestra solo para pausar o activar.

### Dónde está cada cosa (rápido)
- Pantallas V3: `app/v3/*` y `components/v3/*`. Usuarios: `app/v3/usuarios` + `components/v3/UsuariosAdminPanel.tsx` (compartido con la versión vieja).
- Acceso y login: `app/api/auth/*`, `components/v3/EstadoCuentaGate.tsx`, workflow n8n `Núcleo — Auth y Registro`.
- Administración de usuarios: `app/api/admin/*` (usuario-nuevo, cuenta-estado, correos, cliente-usuario, cambiar-rol, estado-cliente), workflow `Núcleo — Admin de Usuarios`.
- Whop: `app/api/whop/webhook/route.ts`, workflow `Integraciones — Whop Eventos`.
- Historial detallado de cada decisión: las secciones "Corrección", "Addendum" y "Etapa" de más abajo.

---

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
  panel/paginas/                    Wizard del constructor de páginas propio (lista + crear/editar/publicar) — ver sección 21
  api/paginas/                      CRUD del constructor de páginas propio (guardar/listar/detalle) + generar-html + publicar-wordpress — ver sección 21
  api/onboarding/conectar-wordpress, wordpress-estado, desconectar-wordpress   Conexión WordPress por cliente — ver sección 21
  webinar-os/control-center/[clienteId]/   Vista agregada semanal por cliente (Webinar OS)
  admin/cartera/, admin/clientes/, admin/usuarios/   Solo admin
  api/                             Proxies server-side hacia n8n (ver sección 10)

components/
  (raíz)                           UI compartida: selectors, KPI cards, theming, LoginGridCanvas, loader de marca
  AppSidebar.tsx                   Sidebar fijo genérico (admin/cartera, admin/clientes, admin/usuarios, panel/conexiones, panel/embudos, panel/leads, panel/paginas) — el dashboard clásico (app/page.tsx) y el Control Center tienen su propio <aside> con el mismo look porque necesitan el selector de cliente/campaña, que no aplica acá
  SidePanelProvider.tsx            Estado (sin UI propia) de qué panel "Configuración"/"Embudos"/"Leads"/"Páginas" está reemplazando el contenido principal — ver sección 20
  panel/ConexionesBody.tsx, EmbudosBody.tsx, LeadsBody.tsx, PaginasBody.tsx   Cuerpo de cada uno de esos cuatro paneles, compartido entre AppSidebar, el dashboard clásico y el Control Center — PaginasBody incluye el wizard completo del constructor de páginas (ver sección 21)
  ui/pagination.tsx                Paginación propia (sin librerías externas) usada por LeadsBody
  SidebarCollapseButton.tsx        Botón de colapsar/expandir, ícono junto al logo (desktop-only, hidden md:grid)
  useSidebarCollapse.ts            Hook: estado de colapso (siempre arranca expandido, no se persiste) + escribe --sidebar-w en :root para que el <aside>/<main> de cada página lo lean
  vsl/, evento/, webinar-os/       Widgets específicos de cada módulo
  webinar-os/cartera/              Vista de portafolio (admin)
  webinar-os/control-center/       Control Center por cliente

lib/
  paginas/templates.ts              Generador de HTML del constructor de páginas (captura/encuesta/gracias) — módulo puro, sin dependencias de Next/servidor — ver sección 21
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
| `/panel/paginas` | Cualquier rol autenticado | Wizard del constructor de páginas propio: lista de páginas guardadas + crear/editar una página de captación con encuesta y página de gracias, vista previa en vivo y publicación directa a WordPress. Ver sección 21. |
| `/webinar-os/control-center/[clienteId]` | Autenticado, scoped al cliente | Vista semanal agregada entre campañas de webinar de un cliente: ranking, embudo, filtros, recomendaciones. El selector de "Campaña/Edición" es único para todas las estrategias del cliente — elegir una edición de Webinar Automático filtra ahí mismo; elegir VSL/Evento/Lanzamiento ("Otras estrategias" en el `<optgroup>`) navega a `/?vista=clasica&cliente_id=<id>&campaign_id=<id>` (el `cliente_id` es obligatorio, si no el dashboard clásico se queda con el cliente que ya tenía seleccionado y no encuentra la campaña ahí). El periodo por defecto es **"Todo el periodo"** (sin filtro de fecha, igual que Cartera) — antes era "Últimas 4 semanas" y mostraba el resumen en cero para cualquier cliente cuya actividad real cayera fuera de esa ventana (ediciones archivadas). El filtro de fecha es un popover con presets ("Todo", "Hoy", "7 días", "1 mes") + un calendario de rango personalizado (ver sección 19); el antiguo selector de "semana específica" ("Filtro avanzado") se quitó por redundante una vez que el calendario permite elegir cualquier rango. |
| `/admin/cartera` | **Admin** | Portafolio cruzado entre TODOS los clientes (Webinar OS). |
| `/admin/clientes` | **Admin** | Alta/archivado de clientes, generación de invitaciones. |
| `/admin/usuarios` | **Admin** | Gestión de usuarios: rol, acceso por cliente, borrado. |

**Sidebar**: `/admin/cartera`, `/admin/clientes`, `/admin/usuarios`, `/panel/conexiones`, `/panel/embudos`, `/panel/leads` y `/panel/paginas` comparten `components/AppSidebar.tsx` (fijo a la izquierda en desktop, apilado arriba del contenido en mobile); `/` y el Control Center tienen su propio `<aside>` con el mismo look porque necesitan el selector de cliente/campaña. Los tres traen un botón de colapsar (ícono junto al logo, mismo estilo que "Salir") que reduce el sidebar a solo íconos en desktop — en mobile el botón no se muestra (colapsar no libera espacio cuando el sidebar ya está apilado, no al costado).

## 9. Inventario de API routes (`app/api/`)

Patrón repetido en **todas** las rutas (ver sección 11 para el detalle): verificar cookie de sesión → verificar rol/acceso al `cliente_id` → verificar que la variable `N8N_*_URL` exista → proxear el fetch → normalizar errores.

**Auth** — `login`, `logout`, `me`, `registro`, `registro-invitado`, `olvide-password` (pública), `restablecer-password` (pública, protegida por token firmado)
**Invitación** — `invitacion/verificar` (pública)
**Datos core** — `clientes`, `campanas`, `funnel` (embudo genérico, usado por varios módulos)
**Onboarding** — `onboarding/conectar-ghl`, `onboarding/estado`, `onboarding/conectar-meta-ads`, `onboarding/conectar-wordpress`, `onboarding/wordpress-estado`, `onboarding/desconectar-wordpress`
**Embudo / páginas / leads** — `embudo/configurar`, `leads`, `paginas` (GET listar + POST guardar), `paginas/[id]` (GET detalle), `paginas/generar-html` (renderiza el HTML de las 3 páginas a partir del spec del wizard), `paginas/publicar-wordpress`, `hooks/[...path]` (proxy público que enmascara los webhooks de n8n)
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
- **Un nodo `Respond to Webhook` con `respondWith: allIncomingItems` responde `{}` (objeto vacío), no `[]`, cuando el paso anterior no produjo ningún item** (ej. un `SELECT` de Postgres que no matchea ninguna fila). Pasó en `Páginas - Responder Listar OK` (`Núcleo — Páginas de Captación`): con cero páginas guardadas, `GET /api/paginas` devolvía `{"paginas": {}}` en vez de `{"paginas": []}`, y el `.map()` del lado del cliente (`PaginasBody.tsx`) rompía la pantalla entera antes de mostrar el estado vacío. Se corrigió forzando `Array.isArray(data) ? data : []` en la ruta Next.js (`app/api/paginas/route.ts`) — cualquier ruta nueva que consuma un webhook con `allIncomingItems` y pueda devolver cero filas necesita el mismo guard, no asumir que "siempre es un array" solo porque el nodo dice "all incoming items".
- **`GET /api/evento/resumen-pagos` (desglose Gratuita/Platinum/VIP) no recibe ni filtra por `cliente_id` — devuelve siempre el mismo evento** (el route handler solo chequea que la sesión tenga acceso a `"atlas"`, hardcodeado). Cualquier otro cliente con una campaña `evento_presencial` (la mayoría son placeholders sin evento real todavía) va a ver el desglose de pagos de Atlas como si fuera suyo. El resto del módulo Evento (`gasto-pauta*`, KPIs de registro/check-in) sí es por cliente vía `cliente_id`/`campaign_id` — este endpoint es la excepción.
- **Agregar una variable de entorno nueva a `.env.local` NO la agrega a Vercel** — son dos configuraciones completamente separadas, y no hay ningún chequeo automático que avise si divergen. Pasó con las 5 variables de `N8N_PAGINAS_URL`/`N8N_WORDPRESS_*` (sección 21): se agregaron a `.env.local` el 2026-09-24, funcionaron perfecto en local durante toda esa sesión, y quedaron sin configurar en producción hasta que un usuario real vio `"N8N_PAGINAS_URL no está configurada"` en `vermetricas.com` un día después. Cada vez que se agrega una variable nueva a `.env.local`, hay que agregarla también en Vercel → Settings → Environment Variables (o vía API, `POST /v10/projects/{id}/env`) **y redeployar** — sumar la variable sola no alcanza, el build ya corrido no la relee hasta el próximo deploy.
- **`JWT_SECRET` diferente entre `.env.local` y Vercel rompe el login en producción con un error genérico** (`"El token recibido no es válido. Revisa que JWT_SECRET coincida con n8n."`), no un error de credenciales — fácil de confundir con "until usuario/contraseña mal" si no se lee el mensaje completo. Pasó el 2026-09-22: `JWT_SECRET` se rotó en `.env.local` a propósito para que coincidiera con la credencial real "JWT Key" de n8n (necesario para poder probar login real en local), pero esa misma rotación nunca se replicó en Vercel — production quedó firmando/verificando con el secreto viejo mientras n8n ya emitía JWTs con el nuevo, así que **ningún login en producción funcionó durante ese lapso** hasta que se detectó el 2026-09-25 y se sincronizó el valor de Vercel con el de `.env.local` (más redeploy). Cualquier rotación de `JWT_SECRET` tiene que hacerse en los dos lugares a la vez, nunca solo en local.

## 17. Deploy

```bash
npm i -g vercel
vercel
```

Configurar todas las variables de la sección 6 en Vercel → Settings → Environment Variables, para Production, Preview y Development. **Cada variable nueva que se agregue a `.env.local` hay que replicarla acá también, a mano** — no hay sincronización automática, y quedarse corto no tira ningún error visible hasta que alguien la usa en producción (ver gotcha en sección 16).

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

## 21. Constructor de páginas propio + integración WordPress (⏸️ pausado — oculto de la UI)

**Actualización 2026-09-25 — pausado a pedido explícito del cliente** (habló con John, el dueño del proyecto): este feature se va a construir **aparte, en otro proyecto y otra plataforma**, no acá. El código de todo lo que se construyó (backend, wizard, generador de HTML, integración WordPress) se dejó **intacto en el repo** — nada se borró — pero se sacó de la navegación para que ningún cliente lo vea mientras tanto:
- El item "Páginas" se sacó de `NAV_ITEMS` en `components/AppSidebar.tsx`, y los botones equivalentes hechos a mano en `app/page.tsx` (dashboard clásico) y `app/webinar-os/control-center/[clienteId]/page.tsx` (Control Center) — las tres pantallas que antes mostraban el link.
- La tarjeta "WordPress" se sacó del render de `components/panel/ConexionesBody.tsx` (estaba ligada 1 a 1 a esta feature — publicar páginas era su único propósito). El estado/handlers de WordPress (`wpEstado`, `conectarWordpress()`, `desconectarWordpress()`, etc.) se dejaron en el componente sin usar, no se borraron.
- La ruta `/panel/paginas` y las rutas `/api/paginas/*` **siguen funcionando** si alguien las visita por URL directa (no hay ningún bloqueo de middleware) — lo que se sacó es únicamente el link visible; no es un apagado completo del backend. El workflow de n8n, las tablas de Postgres y las variables de entorno de Vercel (sección 6) tampoco se tocaron.
- Nada de esto se revirtió porque el pedido fue "guardarlo para después" (van a retomarlo como proyecto separado), no borrarlo. Si en algún momento se decide sacarlo del todo (o migrar el código a otro repo), este es el punto de partida.

Lo que sigue documentado abajo (modelo de datos, workflows de n8n, wizard, plantillas "Estándar" de captura/encuesta/gracias, gotchas encontrados) describe el estado en el que quedó **al momento de pausarlo** — sigue siendo la referencia técnica si se retoma, en este repo o en el nuevo proyecto.

---

Segunda pieza de la visión "self-service", separada del embudo de webinar de la sección 20: en vez de depender de una herramienta externa (tipo Zoryam) para armar landing pages de captación/encuesta/gracias, el propio dashboard las genera y las publica directo en el WordPress del cliente. **El backend (modelo de datos + n8n + rutas Next.js) y el wizard visual (`/panel/paginas`) ya están completos y probados de punta a punta en local.** Esta sección documenta ambos.

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
- `POST /webhook/paginas/guardar` — upsert por `(cliente_id, slug)` (`ON CONFLICT DO UPDATE`, reemplaza el snapshot completo — el caller siempre tiene que mandar el estado entero, no un parche parcial). Body: `{ cliente_id, nombre, slug, tipo_funil, plantilla, colores, copy, encuesta, gracias, imagenes }` — el nodo `Preparar Guardar` solo valida que `cliente_id`/`nombre`/`slug` no vengan vacíos y que `encuesta` sea un **array** (no un objeto); `colores`/`copy`/`gracias`/`imagenes` viajan como JSON libre, sin schema del lado de n8n (la forma que les da el wizard es la que manda, ver más abajo). Devuelve `{ ok, id, slug }`.
- `GET /webhook/paginas/listar?cliente_id=` — lista liviana (sin el jsonb completo) para la pantalla de "páginas guardadas". Responde con `respondWith: allIncomingItems` — **si no hay ninguna página, devuelve `{}` en vez de `[]`** (ver gotcha en sección 16); `app/api/paginas/route.ts` ya lo normaliza a un array antes de devolverlo al cliente.
- `GET /webhook/paginas/detalle?cliente_id=&id=` — trae la config completa de una página; 404 si no existe o no es de ese cliente.
- `POST /webhook/paginas/evento?cliente_id=&pagina_id=` (query string, no body) — el único endpoint **público** de los cuatro (va embebido directo en el HTML publicado en WordPress, llamado por `fetch()` desde el navegador del visitante — por eso no pasa por `/api/hooks`, no es algo que el dashboard llame). Body: `{ tipo: "lead"|"pesquisa", nombre, email, whatsapp, utm: { utm_source, utm_medium, utm_campaign, utm_term, utm_content, fbclid, gclid, ttclid, referrer, landing }, respuestas }` (`respuestas` solo se usa si `tipo === "pesquisa"`). Solo exige `cliente_id` + `pagina_id` + (`email` o `whatsapp`) — `nombre` es opcional. Busca el lead por email/whatsapp dentro de esa `pagina_id`, actualiza si existe (UTM en modo "primer touch": `COALESCE(utm_x, nuevo_valor)`, nunca se pisa el dato una vez capturado; `respuestas` se mergea con `||` sobre el jsonb existente) o crea si no.

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

### El generador de HTML propio (`lib/paginas/templates.ts`)

Módulo puro (sin imports de Next/servidor, sin `process.env`) que arma las 3 páginas como strings de HTML autocontenido (CSS inline, sin dependencias externas — tienen que poder vivir solas dentro de WordPress). Recibe el spec del wizard más los datos de contexto (`eventoUrl`, `clienteId`, `paginaId`) y devuelve el HTML final:

- **`generarHtmlCaptura`** — formulario nombre/email (+ WhatsApp opcional según `copy.captura.pedirWhatsapp`), bullets de beneficios, imagen opcional. El JS embebido lee los UTM/`fbclid`/`gclid`/`ttclid`/`referrer` de la URL actual (`leerUtm()`), hace `POST` a `${eventoUrl}?cliente_id=&pagina_id=` con `tipo: "lead"`, y si sale bien redirige a la página de encuesta pasando `email`/`whatsapp` por query string — así la encuesta puede identificar al mismo lead sin pedir los datos de nuevo.
- **`generarHtmlEncuesta`** — arma las preguntas dinámicamente (`opciones` → radio buttons, `abierta` → texto libre) a partir del array `encuesta` guardado. Lee `email`/`whatsapp` de la URL (los que le pasó la página de captura), hace `POST` con `tipo: "pesquisa"` y las respuestas, y redirige a la página de gracias.
- **`generarHtmlGracias`** — estática, sin JS ni fetch: título, subtítulo, imagen opcional y un botón de call-to-action (`gracias.linkBoton`, normalmente el link al grupo de WhatsApp o a la sala del webinar).

`slugsDePagina(slugBase)` deriva los 3 slugs reales que van a WordPress a partir del slug guardado en `landing_pages`: `slugBase` (captura), `slugBase-encuesta`, `slugBase-gracias`. Las páginas de captura/encuesta se encadenan usando la URL **real** del sitio del cliente (`${site_url}/${slug}/`, asumiendo permalinks bonitos de WordPress) cuando ya está conectado; si todavía no hay WordPress conectado, usa rutas relativas (sirve para la vista previa, no para producción).

Ruta que lo expone: `POST /api/paginas/generar-html` (`app/api/paginas/generar-html/route.ts`) — recibe `{ cliente_id, pagina_id, site_url, spec }` y devuelve `{ captura, encuesta, gracias }`, cada uno `{ slug, titulo, html }`, listo para pasarle directo a `/api/paginas/publicar-wordpress`. Vive server-side a propósito: mantiene `N8N_PAGINAS_URL` (la base del webhook público `paginas/evento`) fuera del bundle del cliente, igual que el resto de las URLs de n8n del proyecto.

### El wizard (`/panel/paginas`, `components/panel/PaginasBody.tsx`)

Panel nuevo en los tres sidebars ("Páginas", junto a Configuración/Embudos/Leads — mismo patrón in-place de la sección 20, ahora con 4 paneles en vez de 3: `SidePanelProvider` ganó la clave `"paginas"` y `openPaginas()`). Dos vistas dentro del mismo componente:

- **Lista** (`GET /api/paginas`) — páginas guardadas del cliente, botón "+ Nueva página", y un aviso si WordPress no está conectado todavía (con acceso directo a Configuración).
- **Wizard** de 9 pasos, navegables libremente por pestañas numeradas (no es un flujo lineal forzado, salvo el paso "Encuesta" que solo aparece si el flujo elegido lo incluye — ver más abajo). Rediseñado en esta misma sesión para explicar cada elección como lo hace la referencia externa (Zoryam) en vez de ser un simple formulario:
  1. **Datos básicos** — nombre del embudo + slug base (identificador interno, clave de `landing_pages`).
  2. **Funil** — tarjetas explicando "Webinario" vs "Sesión estratégica" con el paso a paso de qué recorre el lead en cada uno (no son solo dos botones, cada tarjeta tiene la descripción + una lista numerada de pasos).
  3. **Flujo** — cuántas páginas genera el embudo: `captura_encuesta_gracias` (3 páginas, con encuesta intermedia) o `captura_gracias` (2 páginas, directo a gracias). Al entrar acá por primera vez se auto-sugieren los 3 slugs reales de WordPress a partir del slug base (`slugsDePagina()`); de ahí en más el cliente los edita a mano sin que se vuelvan a pisar solos. Elegir el flujo de 2 páginas oculta el paso "Encuesta" del wizard y de la vista previa, y la página de captura redirige directo a gracias.
  4. **Modelo** — grid de 3 columnas con una miniatura ilustrativa por plantilla (gradiente + barras simulando texto/CTA, estilo tarjeta de Zoryam) + nombre + descripción. Hoy solo "Estándar" está disponible; "Urgencia" y "Webinario + VSL" quedan como "Próximamente" (mismo patrón visual que "Whop" en Conexiones — no clickeables). En el mismo paso: el checkbox "pedir WhatsApp" y el selector de formato del campo WhatsApp del popup (`internacional` — código de país + número, default; o `brasil` — DDD + número), que cambia el placeholder del input en el HTML generado.
  5. **Colores** — 3 colores (`primario`/`fondo`/`texto`, con `<input type="color">` + hex a mano) — sin cambios.
  6. **Copy — Captura** — formulario largo con 4 sub-secciones (Hero, Mecanismo, Checklist, Experto) que llenan la plantilla "Estándar" completa — ver el detalle de esa plantilla más abajo.
  7. **Encuesta** (condicional) — preguntas dinámicas, cada una `abierta` u `opciones` con las opciones separadas por coma — sin cambios.
  8. **Gracias** — título, subtítulo, botón + link, imagen opcional — sin cambios.
  9. **Revisión** — vista previa + guardar/publicar.
- El paso de **revisión** genera la vista previa llamando a `/api/paginas/generar-html` (con `pagina_id: "preview"` si todavía no se guardó) y la muestra en un `<iframe sandbox>` con pestañas Captura/(Encuesta)/Gracias — HTML real, no una maqueta; la pestaña Encuesta ni siquiera se ofrece si el flujo es de 2 páginas. Desde ahí: "Guardar borrador" (solo persiste, `POST /api/paginas`) o "Guardar y publicar en WordPress" (guarda, genera el HTML con la `site_url` real de la conexión activa, y llama a `/api/paginas/publicar-wordpress`, mostrando el link publicado o el error de cada una de las páginas — la de encuesta viene `omitido: true` si el flujo no la incluye). Si el cliente no conectó WordPress, ese botón se reemplaza por un atajo a Configuración.
- **Dónde viven los campos nuevos**: `flujo`, `slugsPaginas` (`{captura, encuesta, gracias}`) y `whatsappFormato` (dentro de `copy.captura`) se agregaron **sin tocar el esquema de Postgres ni el workflow de n8n** — viven anidados dentro de la columna `copy`, que ya viaja como JSON libre sin validar del lado de n8n (confirmado leyendo el nodo `Preparar Guardar`: solo chequea que `encuesta` sea un array, el resto de las claves de `copy`/`colores`/`gracias`/`imagenes` no tienen schema). Es el patrón a seguir para cualquier campo nuevo del wizard que no necesite ser consultado con SQL directamente — evita una migración de Postgres + republish del workflow por cada campo nuevo.
- v1 **no genera copy con IA** — todo el texto lo escribe el cliente/agencia a mano en el wizard, tal como se definió al arrancar esta pieza. Tampoco hay todavía más de una plantilla visual real (`plantilla: "clasica-01"`, mostrada como "Estándar") ni edición de imágenes (son URLs pegadas a mano, sin upload propio).

### La plantilla "Estándar" — estructura real (`generarHtmlCaptura` en `lib/paginas/templates.ts`)

Relevada visitando páginas de captura reales ya publicadas por el cliente (johnbenalanza.com/captura-*, /dsm/) a pedido explícito del usuario — no es una estructura inventada. Las 4 páginas revisadas comparten exactamente el mismo layout con copy distinto, confirmando que es una plantilla reutilizable. La página de captura es un **long-scroll tipo landing de venta**, no un formulario corto:

1. **Hero** — foto de fondo (`imagenes.capturaUrl`) con overlay oscuro degradado, badge opcional (fecha/hora), título (podés resaltar una palabra/frase envolviéndola en `**así**`, se renderiza con el color primario vía la función `destacar()`), subtítulo, botón CTA, y una fila de "frases de confianza" (`trustBullets`) separadas por punto.
2. **Mecanismo** (`copy.captura.mecanismo`) — eyebrow + título + párrafos, explicando qué va a ver el lead. Termina con el mismo botón CTA.
3. **Checklist** (`copy.captura.checklist`) — eyebrow + título + lista de items (cada uno como una fila con check ✓, no una lista con viñetas) + una nota final en negrita (ej. "Cupos limitados") + CTA.
4. **Experto** (`copy.captura.experto`) — foto circular con borde/glow en el color primario, eyebrow + título + párrafos de bio, una frase destacada en negrita, chips de números/logros (`stats`), y CTA.
5. **Footer** — nombre del embudo + año.
6. **CTA fijo global** (`.cta-fijo`) — barra `position: fixed` pegada abajo del viewport, siempre visible sin importar el scroll — el `body` tiene `padding-bottom` para que no tape el footer.

**Ninguna de las páginas de referencia tiene el formulario inline** — los botones "Garantizar mi lugar" (nuestro `textoBoton`, repetido en cada sección + el CTA fijo) abren todos el **mismo popup modal** (`.popup-overlay`/`.popup-card`) con los campos nombre/email/WhatsApp. Esto cambió el diseño respecto a la primera versión del generador (que tenía un `<form>` visible dentro de una sola card) — ahora es exactamente ese patrón: overlay oscuro, tarjeta centrada, botón de cerrar (×), cierre al hacer click afuera. El resto de la lógica (fetch a `paginas/evento`, UTM, redirect a la siguiente página) no cambió, solo se movió adentro del popup.

Detalles de implementación a tener presentes:
- `destacar()` es un mini-parser de `**negrita**` → `<span class="destacado">` — no es Markdown completo, solo ese único patrón, aplicado sobre texto ya escapado con `esc()` (por eso es seguro incluso si el cliente pega HTML/comillas en el título).
- `colorContraste()` calcula luminancia relativa del color `primario` elegido en el paso "Colores" para decidir si el texto de los botones va en negro o blanco — evita que un color de acento claro (ej. un mint como en la referencia) quede con texto blanco ilegible.
- Cada sección (Mecanismo/Checklist/Experto) **no se renderiza en absoluto** si está vacía (sin título ni párrafos/items cargados) — así una página nueva sin completar el paso "Copy" todavía genera un HTML válido y corto, en vez de secciones vacías con solo el eyebrow.
- `gracias` **no se tocó en esta pasada** — sigue con el diseño simple de card centrada de la primera versión (más abajo, "El generador de HTML propio"). `encuesta` sí se rediseñó por completo — ver la siguiente sub-sección.

Probado en local con la cuenta de prueba de la sección 20/24: completé Hero + Mecanismo + Checklist + Experto con copy real tomado de una de las páginas de referencia, confirmé que cada sección aparece/desaparece según tenga contenido, que el botón CTA de cada sección abre el mismo popup (probado clickeando dentro del iframe de vista previa), que el popup muestra el placeholder de WhatsApp correcto, y que el CTA fijo queda pegado abajo. Guardado y recargado sin pérdida de datos.

### Las plantillas de encuesta — "Estándar" y "Urgencia" (`generarHtmlEncuesta` en `lib/paginas/templates.ts`)

También relevadas de la referencia externa (no de páginas del cliente esta vez, sino de la propia herramienta de referencia — el usuario mostró capturas de su wizard). A diferencia de la primera versión (todas las preguntas en un solo formulario largo), la encuesta real es un **quiz de una pregunta por pantalla, con barra de progreso**, con dos pieles intercambiables vía `copy.encuestaIntro.plantilla: "padrao" | "urgencia"`:

- **Estándar** (`"padrao"`) — card centrada en los colores de la página (usa `colores.primario/fondo/texto` igual que el resto), con "¡Hola!" fijo arriba, el título de la encuesta como headline de la card (estático, no cambia por pregunta), barra de progreso, "Pregunta X de N", la pregunta actual con sus opciones marcadas con letra (A/B/C…), y botón "Continuar".
- **Urgencia** — quiz claro (fondo blanco/gris fijo, no usa `colores.fondo`, solo `colores.primario` como acento) con una barra de progreso fina y fija en la parte superior del viewport, el título de la encuesta como línea destacada en mayúsculas arriba de cada pregunta (en vez de headline de card), contador "¡Hola! · Pregunta X de N", y opciones con un círculo de selección vacío — o un emoji en su lugar, si esa opción tiene uno cargado (`PreguntaEncuesta.emojis`, array paralelo a `opciones` por índice).

Mecánica común a ambas (una sola implementación de JS en `generarHtmlEncuesta`, solo cambia el CSS según la plantilla): cada pregunta es un `<div class="pregunta-pantalla">` oculto por default (`display:none`), con `.activa` en la que corresponde mostrar. El botón "Continuar" de cada pantalla arranca `disabled` y se habilita recién cuando hay una opción marcada (o, para preguntas `tipo: "abierta"`, cuando el input de texto no está vacío). Al hacer click, si no es la última pregunta avanza el índice y muestra la siguiente pantalla (actualizando la barra de progreso); si es la última, hace el `POST` a `paginas/evento` con todas las respuestas acumuladas (`respuestas` es un objeto `{ [texto_de_la_pregunta]: respuesta }`, igual que antes) y redirige a gracias. El título de la encuesta y el `textoBoton` son fijos para toda la encuesta, no por pregunta — ver el comentario en el tipo `CopyEncuestaIntro`.

**Cada card de plantilla del wizard (paso "Encuesta") tiene un botón "Preview" independiente** que abre una vista previa en modal, replicando el patrón que el usuario mostró de la herramienta de referencia ("Pesquisa Padrão — preview" / "Pesquisa Urgência — preview", con el texto "Preview ampliado, só pra visualizar"). **Seleccionar la plantilla y previsualizarla son dos acciones separadas a propósito** (ajustado después de que el usuario probara la primera versión, donde un solo click hacía las dos cosas): click en la card = solo selecciona (`updateEncuestaIntro({ plantilla })`), click en el botón "Preview" (con `stopPropagation` para no disparar la selección) = solo abre el modal, sin tocar la plantilla activa — así se puede mirar "Estándar" sin perder que ya habías elegido "Urgencia". La preview no es una maqueta estática: llama a `generarHtmlEncuesta()` **directamente en el cliente** (el módulo `lib/paginas/templates.ts` es puro, sin `process.env` ni imports de servidor, así que se puede importar tanto en una API route como directo en un componente `"use client"`) con el spec actual del wizard — si todavía no hay preguntas cargadas, usa `preguntaDemo()` como relleno para que la vista previa nunca salga vacía.

Editor de preguntas actualizado: las opciones de una pregunta de opción múltiple ya no son un input con comas (`"Opción A, Opción B"`) — ahora es una lista editable de verdad (agregar/quitar opción una por una), y si la plantilla activa es "Urgencia" cada opción suma un campo de emoji al lado (opcional, se deja vacío para que esa opción muestre solo el círculo).

Probado en local: alterné entre "Estándar" y "Urgencia" desde el wizard, confirmé que el modal de preview muestra el título/pregunta real que estaba cargada (no una maqueta genérica), que el botón "Continuar"/"Enviar respuestas" arranca deshabilitado y se habilita al marcar una opción, y que la misma página se ve igual en el modal y en la pestaña "Revisión" del wizard (la fuente de verdad es la misma función). Datos viejos guardados con el formato anterior (opciones como string separado por coma, sin `plantilla` ni `emojis`) se migran solos al abrir "Editar" — `editarPagina()` normaliza cada pregunta a la forma nueva.

Probado en local de punta a punta con la cuenta de prueba de la sección 20/24: crear página → recorrer los 9 pasos → alternar entre flujo de 2 y 3 páginas (confirmando que el paso "Encuesta" y su slug aparecen/desaparecen correctamente) → elegir formato de WhatsApp y confirmar el placeholder en la vista previa → guardar → volver a la lista → editar y confirmar que `flujo`/`slugsPaginas`/`whatsappFormato` vuelven tal cual se guardaron (inspeccionado directo en la respuesta de `/api/paginas/[id]`). Falta probar el botón de publicar contra un WordPress real (en local la cuenta de prueba no tiene WordPress conectado); el mecanismo de publicación en sí ya se probó por separado (ver arriba, prueba contra `wordpress.org`).

**Pendiente**: "Urgencia" y "Webinario + VSL" (plantillas de **captura**) siguen siendo placeholders "Próximamente" sin implementación real; no hay upload de imágenes propio (solo URLs pegadas a mano); no hay un paso "Cliente" explícito en el wizard (no hace falta — el dashboard ya resuelve el cliente activo por sesión/URL antes de entrar al wizard, a diferencia de la referencia externa que es multi-tenant desde cero en cada pantalla).

### La página de gracias (`generarHtmlGracias` en `lib/paginas/templates.ts`)

Rediseñada el 2026-09-25 a partir de una captura de la referencia externa (paso "3 · Obrigado" de su wizard) — mismo lenguaje visual que la encuesta "Estándar" (brand-label arriba + card centrada en los colores de la página + footer, vía la nueva función `graciasStyles()`), pero sin mecánica de quiz: solo un ícono de check en un círculo con el color `primario` (`.icono-check`, un SVG de checkmark inline, sin depender de ninguna librería de íconos), título, subtítulo, un botón CTA (solo se renderiza si `gracias.linkBoton` tiene algo cargado — sin link, no hay botón), y una **nota de confirmación** chica y apagada debajo del botón (`gracias.notaConfirmacion`, campo nuevo en el tipo `Gracias`, ej. "Ya estás en la lista: el grupo garantiza los avisos y el enlace"). Si se carga `imagenes.graciasUrl` esa imagen reemplaza al ícono de check (se mantuvo esa opción por compatibilidad con la versión anterior de esta página), pero el default sin imagen ya se ve bien solo.

Probado en local: la card, el ícono, el botón y la nota de confirmación coinciden visualmente con la referencia; datos guardados antes de este cambio (páginas que no tenían `notaConfirmacion` todavía) cargan bien en "Editar" gracias al merge con default (`{ ...base.gracias, ...(p.gracias || {}) }` en `editarPagina()`, ya existente, no necesitó cambios).

### Bugs de layout encontrados y corregidos en la plantilla "Estándar" de encuesta

Dos bugs reales, encontrados por el usuario probando la vista previa (no detectados por `tsc`, son puramente de CSS):

1. **`body` sin `flex-direction: column`** en `capturaStyles`/`encuestaStyles` (rama "padrao"): el `body` de la plantilla "Estándar" era `display: flex` sin especificar dirección (default `row`), así que el `.quiz-card` y el `<footer>` — dos hijos flex directos del `body` — quedaban lado a lado en vez de uno debajo del otro, dejando un bloque de espacio en blanco a la derecha de la card. Se agregó `flex-direction: column` explícito.
2. **El brand-label (nombre del embudo arriba de la card) usaba `position: absolute; top: 20px`**, pensado como si fuera a quedar "pegado arriba del todo" independiente de dónde cayera la card. Como la card se centra verticalmente (`align-items: center` en el `body`), en un viewport bajo (como el iframe del modal de preview) la card termina cerca del top, y el label posicionado en absoluto le quedaba montado encima. Se sacó el `position: absolute` — ahora el label es un elemento de flujo normal más, separado de la card por el `gap` del `body`, así que la distancia entre ambos es siempre la misma sin importar la altura del viewport.

Aparte, un bug de layout en el propio wizard (no en el HTML generado): en el editor de opciones de "Urgencia" (`components/panel/PaginasBody.tsx`), el campo de emoji reusaba `inputClass` (que trae `w-full`) sumado a `w-14` — dos utilidades de ancho de Tailwind compitiendo, y `w-full` terminaba ganando, así que el campo de emoji ocupaba toda la fila y tapaba el campo de texto de la opción. Se le dio al emoji su propia clase con ancho fijo (`w-12`, sin `w-full`) y el campo de texto pasó a `flex-1 min-w-0` para repartirse el espacio como corresponde.

### Auditoría de "taste" contra `Leonxlnx/taste-skill`

El usuario pidió aplicar las reglas de esta skill externa (`npx skills add Leonxlnx/taste-skill`, 89k+ estrellas en GitHub, un set de reglas "anti-slop" para que agentes de IA no generen frontend genérico) a las plantillas de páginas. **No se instaló el paquete** — ejecutar un instalador de un paquete de terceros no verificado está fuera de lo que este asistente hace por su cuenta; en cambio se descargó y leyó el `SKILL.md` directo desde GitHub como texto de referencia (la alternativa que el propio README de esa skill ofrece: "copy any SKILL.md into your project"). La mayor parte de esa skill apunta a stacks React/Next.js/Tailwind v4/Motion(GSAP)/shadcn — no aplica a `lib/paginas/templates.ts`, que es HTML/CSS/JS plano sin frameworks (tiene que poder vivir solo, embebido en cualquier WordPress). Las partes sí aplicables (sección "AI Tells" y el checklist de Pre-Flight) se usaron para auditar el HTML generado:

- **Ban de em-dash (`—`) en cualquier copy visible**: se encontró uno real en el subtítulo por defecto del hero ("...tu propio sistema — sin volver a empezar...") — corregido a coma. (Los únicos otros usos de `—` en el proyecto están en comentarios de código y en las etiquetas del propio wizard interno, no en el HTML que ve el lead final — esos no se tocaron, son el estilo de escritura ya establecido en todo el dashboard.)
- **Racionamiento del punto medio (`·`), máximo 1 por línea**: la fila de "frases de confianza" del hero llegaba a apilar hasta 4 puntos medios en una sola línea (uno como separador entre cada bullet, más uno dentro de cada bullet default). Se sacó el separador entre bullets (el espaciado por `gap`/`flex-wrap` ya los distingue) y se reescribieron los bullets default sin punto medio interno.
- Se revisó y quedó bien sin cambios: sin puntos decorativos de color, radios de esquina consistentes, contraste de texto de botón ya resuelto por `colorContraste()` (calculado antes de conocer esta skill, coincide con su regla de contraste WCAG).
- **Tensión señalada pero no resuelta unilateralmente**: la skill prohíbe una "trust micro-strip" debajo del CTA del hero — exactamente el patrón que se copió a propósito de las páginas reales de referencia del cliente (sección "La plantilla Estándar" arriba). Se dejó tal cual porque replicar esa referencia fue un pedido explícito anterior del usuario; se le preguntó si prefería sacarla para seguir la skill al pie de la letra, sin resolverlo por cuenta propia.

## 22. V3 — rediseño del dashboard (inspirado en VK Metrics)

Área completamente nueva y en paralelo a todo lo documentado en las secciones 1-21: vive bajo `/v3/*`, con su propio layout/sidebar/topbar, sin tocar ni una línea del dashboard clásico (`app/page.tsx`), el Control Center, ni ningún workflow de n8n usado por ellos. El objetivo es reconstruir el panel con una experiencia inspirada en la herramienta competidora **VK Metrics** que el cliente usa como referencia visual/funcional. Todo el trabajo de esta sección se hizo con datos **reales** de un cliente de prueba conectado a Meta Ads (`cliente-prueba-draft`, cuenta publicitaria real con campañas activas) — ninguna cifra mostrada en esta sección es inventada.

### Rutas y shell

| Ruta | Qué muestra |
|---|---|
| `/v3` | Lista de clientes (solo tiene sentido para admin; un cliente con una sola cuenta cae directo a la suya). |
| `/v3/[clienteId]` | Home/Dashboard — hoy reutiliza el mismo dato del embudo de evento presencial que el dashboard clásico para las estrategias que ya soporta; para `webinar_automatizado` todavía muestra un "Próximamente" (`V3ComingSoon`) porque ese módulo no se portó a V3 en esta sesión. |
| `/v3/[clienteId]/anuncios` | **Administrador de Anuncios** — tabla de Campañas / Conjuntos de anuncios / Anuncios, con pausar/activar en vivo. |
| `/v3/[clienteId]/analisis` | **Análisis de Anuncios** — tarjetas por creativo, ordenadas por ROAS, con comparación lado a lado. |
| `/v3/[clienteId]/conexiones` | Conectar Meta Ads (multi-cuenta) y Go High Level. |
| `/v3/[clienteId]/base-datos` | Leads capturados y ventas (esta última todavía siempre vacía — ver más abajo). |

Shell: `app/v3/layout.tsx` monta `V3Sidebar` (fijo a la izquierda) + `V3Topbar` (barra superior sticky) alrededor de `{children}` — cada página hija resuelve su propia sesión/datos, el layout es solo chrome.

**`components/v3/V3Sidebar.tsx`**: arriba, brand + switcher de cliente (`V3ClientSwitcher.tsx` — dropdown con buscador, lista con scroll interno y un link "+ Crear cliente nuevo" a `/admin/clientes`; **solo interactivo para `role === "admin"` con más de un cliente** — para un cliente normal muestra su propio nombre sin flecha, y el backend (`/api/clientes`) refuerza lo mismo del lado del servidor: un cliente normal nunca recibe la lista completa aunque la pida). Debajo, nav principal (Dashboard, Administrador de Anuncios, Análisis de Anuncios, Base de datos) y, separado por una línea divisoria, un segundo bloque de "configuración" (hoy solo Conexiones — cualquier integración nueva tipo Claude/etc. va ahí abajo, no arriba con las features). Todos los textos están en español (el prototipo VK Metrics de referencia está en portugués — cualquier palabra tipo "Conexões"/"Anúncios"/"Campanha" que se haya colado en un primer borrador se corrigió).

**`components/v3/V3Topbar.tsx`**: selector de "dashboard" (ver más abajo) + botón "Crear nuevo", visible en **cualquier pantalla de la V3** (vive en el layout, no en una página particular) — aunque hoy solo Administrador de Anuncios y Análisis de Anuncios reaccionan al dashboard elegido; el Home todavía no tiene un campo de nomenclatura de campaña que filtrar (ver "Dashboards" más abajo).

### Conexión de Meta Ads — multi-cuenta (`/v3/[clienteId]/conexiones`)

V1 explícitamente **sin OAuth** (decisión tomada con el usuario: OAuth queda como idea a futuro) — el cliente pega manualmente el ID de cada cuenta publicitaria + un nombre para identificarla, y un token de acceso. Reutiliza `client_connections` (misma tabla que GHL/WordPress, sección 13), pero **la forma de `config` para `meta_ads` cambió de un valor único a una lista**:

```
// antes (todavía soportado)          // ahora
{ ad_account_id: "123" }              { ad_accounts: [{ id: "123", label: "CP2 - El Loco" }, ...] }
```

`app/api/onboarding/conectar-meta-ads/route.ts` ahora manda `config: { ad_accounts: [...] }`. La compatibilidad hacia atrás vive en el SQL del pull (ver abajo), no en el código de Next.js — no hizo falta migrar filas viejas. La UI de conexión (`app/v3/[clienteId]/conexiones/page.tsx`) permite agregar/quitar filas de cuenta; **reconectar reemplaza la lista completa** (no hay edición ni vista de lo ya guardado — `GET /api/onboarding/estado` no expone `config`, solo el booleano `tiene_credencial`).

**Permiso del token**: hoy pide `ads_read` **y** `ads_management` (este segundo agregado quando se construyó pausar/activar — ver más abajo). Un token viejo con solo `ads_read` sigue funcionando para todo lo de lectura; al intentar pausar/activar, Meta devuelve un error de permiso real que la UI muestra tal cual.

### "Dashboards" — proyectos filtrados por nomenclatura de campaña

Tabla nueva y separada, **`v3_dashboards`** (`id, cliente_id, nombre, nomenclatura_filtro, created_at`), creada por el workflow `Núcleo — V3 Dashboards` (n8n, id `6lZrzNxN2PRXfjXK`) — no toca `campaigns` ni ninguna tabla usada por el resto del proyecto. Idea tomada directamente de un problema real que el usuario ya había resuelto en un proyecto propio anterior (`dashboard-m33`): traer *todas* las campañas de Meta es lento, así que un "dashboard" es simplemente un filtro por texto contenido en el nombre de campaña (ej. `SEGUIDORES`), aplicado **server-side** en la llamada a Meta (`filtering=[{field:"...name", operator:"CONTAIN", value:...}]`), no un fetch-todo-y-filtro-en-el-cliente.

- `GET /api/v3/dashboards?cliente_id=` / `POST /api/v3/dashboards` (`app/api/v3/dashboards/route.ts`) — mismo patrón de sesión/rol que el resto.
- El dashboard elegido se persiste en la URL (`?dashboard=<id>`), no solo en estado de React — mismo criterio que el resto de la V3 (URL como fuente de verdad para todo lo que sea "estado de vista").
- **Alcance conceptual vs. real, documentado explícitamente para no fingir una integración que no existe**: la idea es que a futuro un dashboard filtre *toda* la V3 (Home incluido), pero hoy el Home no tiene ningún campo de nomenclatura de Meta que filtrar (su dato viene del embudo interno de Vermetricas, no de nombres de campaña). Por eso el selector vive en el layout (global, listo para expandirse) pero solo Administrador de Anuncios y Análisis de Anuncios efectivamente cambian de datos al elegir uno.
- El nombre del campo de filtro **cambia según qué edge de la Graph API se está consultando** (gotcha real encontrado en esta sesión, ver más abajo): `campaign.name` cuando se filtra sobre `/insights` o sobre el edge `/adsets` (filtrando por el nombre de la campaña padre), pero `name` (a secas) cuando se filtra directo sobre el edge `/campaigns` (ahí el objeto raíz ya es la campaña).

### `Integraciones — Pull Meta Ads (Cliente)` (n8n, id `g3kj8LgGQP9CeCgL`)

`GET /webhook/integraciones/meta-ads-resumen?cliente_id=&nomenclatura=` — el único endpoint de lectura que alimenta Administrador de Anuncios y Análisis de Anuncios. Busca el token + lista de cuentas con:

```sql
SELECT
  COALESCE(config->'ad_accounts', jsonb_build_array(jsonb_build_object('id', config->>'ad_account_id', 'label', config->>'ad_account_id'))) AS ad_accounts,
  pgp_sym_decrypt(credential_encrypted, '...') AS token
FROM client_connections
WHERE cliente_id = $1 AND integration_type = 'meta_ads' AND status = 'active';
```

(el `COALESCE` es la compatibilidad hacia atrás con conexiones viejas de una sola cuenta, mencionada arriba). Después recorre cada cuenta con `splitInBatches({batchSize:1})` y, por cuenta, encadena **siete** llamadas a la Graph API antes de acumular:

1. `GET /insights?level=campaign` — spend/impresiones/clics/CTR/CPM/leads por campaña.
2. `GET /insights?level=adset` — mismas métricas por conjunto de anuncios.
3. `GET /insights?level=ad` — mismas métricas por anuncio, más `purchase_roas` (para ROAS) y `actions` (para ventas — `action_type` en `purchase`/`omni_purchase`, mismo patrón que ya se usa para sumar leads con `lead`/`offsite_conversion.fb_pixel_custom`/`onsite_conversion.messaging_conversation_started_7d`).
4. `GET /ads?fields=id,status,effective_status,creative{id}` — estado de cada anuncio + el id de su creativo (para el paso 5).
5. `GET /adcreatives?fields=id,thumbnail_url,image_url&thumbnail_width=600&thumbnail_height=600` — miniatura del creativo en alta resolución.
6. `GET /campaigns?fields=id,status,effective_status` — estado de cada campaña.
7. `GET /adsets?fields=id,status,effective_status` — estado de cada conjunto de anuncios.

El nodo final (`Etiquetar y Acumular`) mergea todo por id y arma tres arrays (`campanas`, `conjuntos`, `anuncios`), que `Formatear Respuesta Final` concatena entre todas las cuentas del cliente. La respuesta final: `{ conectado: true, campanas: MetaCampaignRow[], conjuntos: MetaAdsetRow[], anuncios: MetaAdRow[] }` (tipos en `lib/meta-ads/types.ts`), o `{ conectado: false }` si no hay conexión activa.

**Gotcha real encontrado y resuelto en esta sesión — la miniatura del creativo sale en 64×64px si se pide anidada**: pedir `creative{thumbnail_url}` como sub-campo dentro de `/ads` **ignora** cualquier `thumbnail_width`/`thumbnail_height` que se le pase (probado con tres variantes distintas: parámetros al nivel raíz, sintaxis `.width().height()` sobre el campo, y agregando `object_story_spec`/`asset_feed_spec` — ninguna cambió el tamaño). La miniatura de 600×600 solo se consigue pidiéndola **directo** sobre el edge `/adcreatives` (paso 5 arriba), no anidada dentro de `/ads`. Cualquier extensión futura que necesite un asset de creativo en más resolución debe usar este mismo patrón de dos pasos (id del creativo vía `/ads`, luego el asset real vía `/adcreatives`), no el atajo anidado.

**Rendimiento**: cada cuenta conectada dispara 7 llamadas a Meta en serie — es el motivo original por el que existen los "dashboards" (nomenclatura) de la sección anterior, para acotar el volumen de campañas/anuncios devueltos por cada llamada en vez de traer siempre todo.

### `Integraciones — Cambiar Estado Meta Ads (Cliente)` (n8n, id `1Ujr0L9k7zWpGzUt`) — pausar/activar

Primer workflow de **escritura** de todo el proyecto (todo lo demás en n8n hasta ahora era lectura o inserts propios en tablas del dashboard, nunca una mutación contra la cuenta real de un cliente en una plataforma externa). `POST /webhook/integraciones/meta-ads-estado`, body `{ cliente_id, id, status }` (`status`: `"ACTIVE"` o `"PAUSED"`). Busca el token igual que el pull, y hace `POST https://graph.facebook.com/v20.0/{id}?status={status}&access_token=...`. **No distingue tipo de objeto** — el mismo `id` puede ser una campaña, un conjunto o un anuncio, porque ese endpoint de Meta funciona idéntico para los tres niveles. Responde `{ ok: true }` o el error real de Meta (`{ ok: false, error: "..." }`), incluyendo el error de permiso si el token no tiene `ads_management`.

Ruta Next.js: `app/api/anuncios/meta/estado/route.ts` (POST), mismo patrón de sesión/`clientesDeSesion` que el resto — es la capa que realmente impide que un cliente pause el anuncio de otro cliente (el `cliente_id` del body se valida contra la sesión antes de reenviar a n8n; el token que se usa para la mutación es siempre el que está guardado para ESE `cliente_id` específico).

**Pendiente de verificación en vivo**: el workflow se probó de punta a punta en n8n (validación + ejecución manual) pero la prueba real de pausar/reactivar un anuncio del cliente de prueba fue bloqueada por el clasificador de seguridad del entorno de este asistente ("transacción del mundo real" — afecta gasto real en la cuenta). Queda pendiente que alguien del equipo confirme manualmente desde el navegador que el switch funciona end-to-end contra Meta (es esperable que falle con error de permiso si el token de prueba actual solo tiene `ads_read`, lo cual en sí mismo confirmaría que el manejo de errores funciona).

### Administrador de Anuncios (`/v3/[clienteId]/anuncios`)

Tres pestañas — Campañas / Conjuntos de anuncios / Anuncios — cada una con `components/v3/MetaAdsTable.tsx` (tabla estilo CRM, no la tabla simple original):

- Checkbox de selección por fila + "seleccionar todo".
- Switch grande (checkbox → switch → nombre, ese orden) que representa Activo/Pausado — solo aparece cuando el estado es `ACTIVE`/`PAUSED`; para otros estados de Meta (`DISAPPROVED`, `PENDING_REVIEW`, `WITH_ISSUES`, etc.) se muestra el label crudo sin switch, porque esos no se "activan" con un simple toggle.
- **Confirmación inline antes de aplicar** ("¿Pausar esto? Sí/No"), nunca un toggle directo — decisión explícita del usuario dado que el cambio afecta gasto real en el momento.
- Barra flotante inferior cuando hay 1+ filas seleccionadas: "Pausar seleccionados" / "Activar seleccionados", con su propia confirmación antes de aplicar el lote.
- Todo construido con las clases/tokens ya existentes del proyecto (`bg-surface`, `border-outline`, `.press`, `--ease-out`) — se evaluaron y **no se instalaron** shadcn/Framer Motion/`react-aria-components` que el usuario trajo como referencia visual en varios prompts; se adaptó el look pedido con lo que ya usa el resto del dashboard, documentado en el chat cada vez que se declinó una librería nueva.

### Análisis de Anuncios (`/v3/[clienteId]/analisis`)

Tarjetas por anuncio (`components/v3/AdCreativeCard.tsx`), no una tabla — pedido explícito del usuario, inspirado en un dashboard de creativos que mostró como referencia. Cada tarjeta: miniatura cuadrada (`aspect-square`, para que el creativo real de Meta no se vea recortado/pixelado), nombre + cuenta/campaña/adset, y Gasto/Impresiones/ROAS/CPA/Ventas. Ordenadas por ROAS descendente.

- **ROAS/CPA/Ventas muestran "—" cuando la cuenta no tiene tracking de compra configurado en Meta** (pixel/CAPI) — no se inventa un número; el cliente de prueba real usado en esta sesión es exactamente ese caso (campañas de tráfico/seguidores, sin conversiones de compra), así que sirvió para confirmar que la feature degrada bien.
- **Comparación**: seleccionar 2+ tarjetas las muestra grandes y centradas en una fila aparte arriba del grid (las mismas tarjetas reales, con su miniatura — no una tabla de métricas separada, ajustado después de que la primera versión saliera demasiado chica y pegada a la izquierda).

### Dashboards de Lanzamiento — tipo, captación → GHL y "Base de datos"

Pedido nuevo del usuario, tomado de cómo maneja hoy la captación de leads en otros proyectos propios (mostró un workflow real de n8n de un proyecto llamado "Klinkert" como referencia — búsqueda de contacto por email/teléfono antes de crear, fusión de etiquetas sin duplicar, guardado en el dashboard en paralelo e independiente de GHL). Se adaptó ese patrón a un modelo **multi-tenant con un solo workflow genérico**, no un workflow por cliente.

- **`v3_dashboards` gana una columna `tipo`** (`'lanzamiento' | 'webinar'`, default `'lanzamiento'` — así las filas viejas no se rompen), agregada por un nodo manual nuevo dentro de `Núcleo — V3 Dashboards` (id `6lZrzNxN2PRXfjXK`). El selector de tipo en el form "Crear nuevo" del `V3Topbar` son dos botones (no un `<select>`, son solo 2 opciones). **Webinar queda seleccionable pero sin funcionalidad propia todavía** — se comporta igual que hoy (solo filtro de nomenclatura); los puntos de captación de abajo son exclusivos de Lanzamiento.
- **Go High Level en la V3**: nueva tarjeta en `/v3/[clienteId]/conexiones`, calcada de la de Meta Ads (mismo indicador con el pulso verde). Pide `Location ID` + token de Integración Privada (PIT). **No hizo falta backend nuevo** — el dashboard clásico ya tenía esta integración (`integration_type='ghl'` en `client_connections`, endpoint `POST /api/onboarding/conectar-ghl`, sección 13) y se reutilizó tal cual.
- **Puntos de captación** (tabla nueva `v3_captacion_puntos`: `id, dashboard_id, cliente_id, nombre, etiqueta_ghl, token, created_at`): un dashboard de Lanzamiento puede tener varios — cada uno es una landing distinta con su propia etiqueta de GHL y su propio endpoint público. Se gestionan desde un panel "Puntos de captación" en el `V3Topbar` (visible solo cuando el dashboard elegido es de tipo Lanzamiento): listar, agregar, copiar el enlace. El `token` (40 caracteres hex, generado con `encode(gen_random_bytes(24), 'hex')` directo en Postgres) es lo único que autentica ese endpoint — no hay sesión de por medio, porque quien lo llama es la landing pública del cliente. Backend: workflow `Núcleo — V3 Puntos de Captación` (id `9rANDT9ftOkmPO6u`) — `GET`/`POST /webhook/v3-captacion-puntos`, valida que el `dashboard_id` realmente pertenezca al `cliente_id` antes de listar o crear (`INSERT ... WHERE EXISTS (...)`, responde 404 si no coincide). Rutas Next.js: `app/api/v3/captacion-puntos/route.ts`, mismo patrón de sesión que el resto.
- **`Integraciones — Captación Lead (Cliente)`** (n8n, id `p8DlcZTE8AxfU5Ri`) — el único webhook de la V3 que es **público de verdad** (sin pasar por nuestra API, sin cookie de sesión): `POST /webhook/integraciones/captacion-lead?token=...`. Busca el punto de captación por token (404 si no existe) → normaliza nombre (Title Case defensivo si vino todo en un solo caso) y teléfono → **guarda el lead siempre** en la tabla nueva `client_leads` (`id, cliente_id, dashboard_id, punto_captacion_id, nombre, correo, telefono, utm_source/medium/campaign/content/term, pagina_origen, ghl_contact_id, status ('lead'|'comprado'), created_at`) → responde `{ok:true}` → **en paralelo**, si el cliente tiene GHL conectado: `POST /contacts/upsert` (crea o actualiza por email/teléfono, **sin mandar `tags`** en el body) y después, siempre, `POST /contacts/{id}/tags/` con la etiqueta del punto — **sin custom fields** (decisión explícita del usuario: los IDs de custom field de GHL son por `locationId`, no se pueden generalizar entre clientes). Si la parte de GHL falla, no se loguea en ningún lado (pedido explícito) y no afecta el `{ok:true}` ya respondido, porque el guardado en `client_leads` es el primer paso, no depende de GHL.
  - **Gotcha real de esta sesión (n8n/Postgres)**: el nodo Postgres, en un `INSERT` que no inserta ninguna fila (ej. por un `WHERE EXISTS` que da falso), no devuelve 0 items — devuelve un único item sintético `{success:true}`, igual que ya hacía para `CREATE TABLE`/`ALTER TABLE`. El primer intento de detectar "¿se creó el punto de captación?" contando `items.length` fallaba silenciosamente (siempre "creado"). Se corrigió chequeando la presencia real del campo `id` devuelto por el `RETURNING`, no la cantidad de items — el mismo cuidado aplica a cualquier nodo Postgres futuro que dependa de si una escritura afectó filas o no.
  - **Gotcha real de esta sesión (GHL, encontrado probando en vivo con la primera cuenta de GHL conectada de verdad)**: el diseño original hacía `POST /contacts/search` primero para decidir entre "agregar etiqueta a un contacto existente" o "crear uno nuevo con `tags: [...]`" — copiado del workflow de referencia del usuario ("Klinkert"). Dos problemas reales: (1) `/contacts/search` de GHL no es inmediato — un contacto recién creado no aparece en la búsqueda unos segundos después, así que casi siempre caía en la rama "crear"; y (2) `POST /contacts/upsert` con un array `tags` **reemplaza** las etiquetas del contacto en vez de sumarlas — un segundo lead de la misma persona por otro punto de captación borraba la etiqueta del primero. Se simplificó: el upsert ya NO manda `tags` (así nunca toca las etiquetas existentes, sea contacto nuevo o viejo) y la etiqueta del punto se agrega siempre después con `POST /contacts/{id}/tags/` (endpoint aditivo — confirmado con la cuenta real: el mismo contacto terminó con las dos etiquetas de sus dos puntos de captación, sin duplicados). Se sacó por completo el paso de búsqueda/elegir-contacto, ya no hace falta.
  - **Gotcha real de esta sesión (Authorization duplicado)**: `app/api/onboarding/conectar-ghl/route.ts` guarda el token con el prefijo `Bearer ` ya incluido (`credential = "Bearer " + token`, sección 13). El primer intento de esta integración volvía a anteponer `"Bearer " + $json.token` al armar el header, mandando `Authorization: Bearer Bearer pit-...` — GHL lo rechazaba con 401 "Invalid JWT". Se corrigió usando el token decriptado tal cual viene (ya incluye `Bearer `). **Esto probablemente también afecta a `Integraciones — Pull GoHighLevel (Cliente)` (id `aRtFZIe6q5ZrWolg`)**, que arma su header con el mismo patrón `"Bearer " + $json.token` contra la misma tabla — no se tocó ese workflow en esta sesión (es de otra parte del proyecto), pero cualquier cliente que haya conectado GHL vía `/panel/conexiones` (self-service) probablemente tenga el mismo problema ahí. Queda pendiente de revisar si alguien lo nota.
  - **Verificado en vivo con datos reales de `cliente-prueba-draft`** (conectó su GHL real durante esta sesión): un lead de prueba por un punto de captación creó el contacto real en GHL con la etiqueta correcta; un segundo lead (misma persona) por otro punto de captación reutilizó el mismo contacto (no duplicó) y le sumó la segunda etiqueta sin perder la primera. Los dos caminos (con y sin GHL conectado) quedan confirmados de punta a punta.

**Corrección (2026-10-02) — se saca por completo el envío a GHL al capturar un lead.** El usuario reconsideró esta decisión: no quiere que Vermetricas le empuje datos a ninguna plataforma externa — solo recibe (webhooks de entrada). Motivo explícito: si GHL rechaza la llamada, cambia su API, o lo que sea, eso nunca debe poder verse como "un error de la plataforma". Se eliminaron del workflow `Integraciones — Captación Lead (Cliente)` (id `p8DlcZTE8AxfU5Ri`) los 4 nodos de la rama GHL (`Captacion - Buscar Credencial GHL`, `Captacion - Tiene GHL?`, `GHL - Crear o Actualizar Contacto`, `GHL - Agregar Etiqueta`) — el guardado en `client_leads` ya respondía `{ok:true}` de forma independiente a esta rama (estaban en paralelo, no en serie), así que sacarla no requirió rearmar ninguna otra conexión. La **etiqueta de GHL** por punto de captación (`etiqueta_ghl`) deja de pedirse — era exclusivamente para esa rama que ya no existe: se sacó el campo del formulario de "Agregar punto" (`app/v3/[clienteId]/endpoints/page.tsx`), de su validación (`app/api/v3/captacion-puntos/route.ts`, antes obligatoria) y del auto-generado al crear páginas de testeo en lote (`components/v3/V3Topbar.tsx`). La columna `etiqueta_ghl` en `v3_captacion_puntos` **se deja intacta** (sigue `NOT NULL`, ahora se inserta con string vacío) — no se migró la tabla, para no arriesgar nada; los puntos ya creados conservan la etiqueta que tenían, simplemente ya no se usa ni se muestra. **La conexión de GHL en `/v3/[clienteId]/conexiones` (Location ID + token de Integración Privada) se mantiene intacta** — el usuario aclaró que la va a usar para algo distinto más adelante (GHL consultando datos de Vermetricas, no al revés); se actualizó el copy de esa tarjeta y del formulario para que ya no prometa "crear y etiquetar contactos automáticamente", dejando claro que hoy es solo una credencial guardada sin ningún uso activo. **Verificado en vivo**: un POST real a `integraciones/captacion-lead` sigue guardando el lead y respondiendo `{ok:true}` sin ningún intento de llamar a GHL; crear un punto de captación nuevo sin mandar `etiqueta_ghl` ya no da error.
- **`Base de datos`** (`/v3/[clienteId]/base-datos`, ítem del sidebar, ícono `Users`): dos pestañas, "Leads captados" (`status='lead'`) y "Ventas" (`status='comprado'`), tabla simple sin selección/mutación, con paginación (`components/ui/pagination.tsx`, mismo componente que `/panel/leads`). Ruta `app/api/v3/leads/route.ts` → `GET /webhook/v3-leads` (workflow `9rANDT9ftOkmPO6u`). **La pestaña "Ventas" está siempre vacía en esta entrega** — no existe todavía ninguna integración de compras/pagos que mueva un lead a `status='comprado'`; el estado queda en el esquema para cuando se conecte esa parte (Hotmart/Whop u otra), no se finge la funcionalidad.

### Endpoints enmascarados del embudo — Encuesta, Página de gracias, Ingreso a grupos, Mensaje 1a1 (2026-09-26)

El resto del embudo de este primer tipo de Lanzamiento: Captación → **Encuesta** → **Página de gracias** → Mensaje 1a1 → **Ingreso a grupos**. Confirmado con el usuario: cada punto de captación tiene su **propio set completo de 4 endpoints** (no uno compartido por dashboard); Encuesta/Gracias son páginas de construcción propia del cliente (no el constructor de páginas pausado); Ingreso a grupos lo manda **SendFlow** por webhook; el mensaje 1a1 lo dispara un workflow de GHL activado por la etiqueta (`etiqueta_ghl`) que ya le ponemos al contacto — no hace falta nada nuevo para *enviarlo*, solo un endpoint para que ese mismo workflow de GHL avise "esto se recibió".

- **Requisito explícito del usuario, no negociable: "no quiero que quede nada de n8n en el endpoint, debe quedar disfrazado"**. El primer build de Captación (más arriba en esta sección) violaba esto — exponía `N8N_CAPTACION_LEAD_URL` directo al cliente vía una variable `NEXT_PUBLIC_*`. Se corrigió reutilizando **`app/api/hooks/[...path]/route.ts`**, el proxy público con lista blanca que el proyecto ya tenía para `/panel/embudos` (sección 20) — se le agregaron los 5 paths nuevos a `ALLOWED_PATHS` (`integraciones/captacion-lead`, `integraciones/embudo-encuesta`, `-gracias`, `-grupos`, `-mensaje-recibido`). Las dos variables `N8N_CAPTACION_LEAD_URL`/`NEXT_PUBLIC_CAPTACION_LEAD_URL` se eliminaron (de `.env.local` y de Vercel) — ya no hace falta ninguna variable de entorno para esto, el enlace se arma en el cliente como `window.location.origin + "/api/hooks/<path>?token=..."`.
- **Tabla nueva `v3_punto_endpoints`** (`id, punto_captacion_id, tipo ('encuesta'|'gracias'|'grupos'|'mensaje_recibido'), token, created_at`) — se generan **solas**, las 4 de una vez, al crear un punto de captación (`INSERT ... SELECT unnest(ARRAY[...])`, workflow `Núcleo — V3 Puntos de Captación`, id `9rANDT9ftOkmPO6u`). `Captacion - Listar Puntos` las devuelve agregadas (`jsonb_agg`) junto con cada punto.
- **`client_leads` gana `extra jsonb`** (default `'{}'`) — ahí caen los datos de cada evento del embudo: `{respuestas, encuesta_at}`, `{gracias_visto_at}`, `{grupo, grupo_ingresado_at}`, `{mensaje_1a1_recibido_at}`, mergeados con `||` (nunca se pisan entre sí). Verificado en vivo: un mismo lead terminó con las 4 claves acumuladas correctamente.
- **Nuevo workflow n8n `Integraciones — Eventos de Embudo (Cliente)`** (id `0nueiQdNQCp2qlw9`) — 4 webhooks (`integraciones/embudo-{encuesta,gracias,grupos,mensaje-recibido}?token=...`), mismo patrón cada uno: busca el endpoint por `token`+`tipo` (404 si no existe) → busca el lead de ese `punto_captacion_id` que matchee por correo o teléfono (404 "lead no encontrado" si no hay match — nunca crea una fila nueva, Captación es siempre el primer paso) → mergea el evento en `extra` → `{ok:true}`. El de Grupos acepta variantes de nombre de campo (`phone`/`telefono`, `email`/`correo`, `grupo`/`group`) porque **todavía no hay un payload de ejemplo real de SendFlow** — pendiente de ajustar el mapeo fino cuando se vea uno.
- **UI**: el panel "Puntos de captación" que vivía en el `V3Topbar` se sacó de ahí — ahora es una página propia **`/v3/[clienteId]/endpoints`**, con su propio link de sidebar (ícono `Link2`) justo debajo de "Conexiones". Cada punto muestra sus enlaces (Captación/Encuesta/Página de gracias/Ingreso a grupos) con botón de copiar; **"Mensaje 1a1 recibido" solo se muestra si la sesión es `role === "admin"`** (lo configura el equipo de Atlas dentro del workflow de GHL de cada cliente, no el cliente).
- **Idea a futuro, anotada pero no construida**: que el cliente final pueda agregar sus propios campos/datos al embudo sin que un dev migre la tabla — por eso `extra` es `jsonb` genérico desde ya, en vez de columnas fijas por campo.

### Reajuste del embudo + Hotmart (ventas reales) (2026-09-26)

Tras usar el embudo completo, el usuario reajustó prioridades y cerró el hueco de "de dónde salen las ventas de verdad":

- **Página de gracias baja de prioridad** (sigue funcionando, no es foco). Los 4 que importan: Captación, Encuesta, Ingreso a grupos, Mensaje 1a1.
- **"Ingreso a la clase" se simplificó a un solo dato**: se había planteado con dos vías (mensaje 1a1 + un link de "grupos" para contar clicks). Al aclarar que el mensaje se manda por **grupo de WhatsApp** (no 1a1 personalizado), un link de grupo es el mismo para todos los miembros — **no se puede atribuir un click a una persona específica sin un link único por persona** (eso requeriría mandarlo 1a1, no por grupo). Decisión: por ahora solo se trackea el mensaje 1a1 (mismo mecanismo que "Mensaje 1a1 recibido", sin código nuevo). El acortador/trackeador de links queda anotado como herramienta a futuro.
- **Conexión con Hotmart** (`app/v3/[clienteId]/conexiones/page.tsx`, tarjeta "Hotmart"): de acá llegan **todas las ventas** de un cliente, por webhook, una sola conexión (no por dashboard ni por punto). Combina los dos patrones que ya existían en el proyecto — guardar una credencial (como GHL/Meta Ads) **y** mostrar un webhook para pegar en una plataforma externa (como la tarjeta "ClaseEspecial"/`webinarkit` del dashboard clásico) — algo que no existía todavía exactamente así.
  - **`hotmart` ya era un valor válido** en el CHECK de `client_connections` desde antes (sección 13) — cero migración para la conexión. Se confirmó en vivo que el webhook genérico `onboarding/conectar-integracion` acepta `integration_type: "hotmart"` sin tocarlo, igual que pasó con `meta_ads`. Ruta nueva: `app/api/onboarding/conectar-hotmart/route.ts`, guarda el **Hottok** como credencial (sin prefijo, a diferencia del `Bearer` de GHL).
  - Webhook enmascarado: `${origin}/api/hooks/integraciones/hotmart-venta?cliente_id=...` — se identifica por `cliente_id` en la URL (como ClaseEspecial), la autenticación real la da la verificación del **Hottok en el payload** contra el guardado, no la URL. Se revela con un botón "Ver webhook" en la misma tarjeta, igual que ClaseEspecial.
  - **Nuevo workflow n8n `Integraciones — Hotmart Venta (Cliente)`** (id `0y6MsifHRxW3MLyR`): verifica el Hottok (401 si no coincide) → solo cuenta como venta si el evento es de compra completada/aprobada (reembolsos/cancelaciones se ignoran en esta entrega, no mueven `status`) → busca un lead de ese **cliente completo** (no de un punto en particular) por correo/teléfono → si matchea, `UPDATE ... status='comprado'` + `extra` con `producto, monto, moneda, transaccion_hotmart, fuera_de_embudo: false`; si no matchea, **crea un lead nuevo** directo con `status='comprado'` y `fuera_de_embudo: true` (sin `dashboard_id`/`punto_captacion_id`) — una venta nunca se pierde solo porque no sabemos su origen.
  - **Verificado en vivo con datos reales de `cliente-prueba-draft`**: Hottok incorrecto → 401; venta que matchea a un lead que ya tenía todo el embudo (encuesta/gracias/grupos/mensaje) → quedó `comprado` sin perder ese historial; venta de un comprador nunca visto → se creó marcado `fuera_de_embudo`; un evento de reembolso → no tocó nada.
  - **`app/v3/[clienteId]/base-datos/page.tsx`**, pestaña "Ventas": ahora muestra columnas Producto/Monto (leídas de `extra`) y una etiqueta "Sin embudo" cuando `fuera_de_embudo === true` — es la primera vez que esta pestaña deja de estar siempre vacía.
  - **Pendiente**: el payload exacto de Hotmart (nombre/ubicación real del campo del Hottok, estructura exacta de producto/comprador) se construyó con los nombres documentados públicamente por Hotmart, sin un envío de prueba real todavía — se ajusta fino en cuanto llegue una venta real.

### Atribución de origen (lead vs. venta) + filtro por dashboard en Base de datos (2026-09-27)

El usuario pidió tres cosas sobre "Base de datos": filtrar por dashboard, exportar a CSV/Excel, y — lo más importante — saber **de dónde salió cada venta** (qué grupo de WhatsApp o mensaje 1a1 la generó), no solo de dónde salió el lead original.

- **Hallazgo clave, confirmado contra la documentación oficial de Hotmart** (`developers.hotmart.com/docs/en/2.0.0/webhook/purchase-webhook/`): el webhook de compra trae un objeto `data.purchase.origin` con `sck` (código UTM de la página de pago/checkout — exactamente el mecanismo que el usuario describía: se le agrega `?sck=grupo-1` al link de Hotmart que se pega en cada grupo/mensaje 1a1), `src` (UTM de la página de ventas) y `xcod` (UTM libre). Esto cierra el "pendiente" de la sección anterior sobre el payload de Hotmart — ya no es una suposición, es el campo real documentado.
- **`Integraciones — Hotmart Venta (Cliente)`** (workflow, id `0y6MsifHRxW3MLyR`): el nodo `Hotmart - Preparar Venta` ahora también extrae `origin.sck/src/xcod` y los guarda en `extra` como `venta_sck`, `venta_src`, `venta_xcod` (junto a lo que ya guardaba: producto, monto, moneda, transacción). Verificado en vivo con un Hottok y venta de prueba (limpiados después, sin dejar residuo en `client_connections`/`client_leads`).
  - **Gotcha del SDK de n8n (nuevo)**: encadenar el `onTrue` de un nodo IF directo a **otro** nodo IF (sin un nodo intermedio) a cierta profundidad de anidación hace que `validate_workflow`/`update_workflow` **descarte un nodo real en silencio** (sin error, solo un `nodeCount` menor al esperado) — pasó exactamente entre `Hottok Valido?` y `Es Venta?`. Se aisló con bisección binaria variando profundidad/nombres hasta reproducirlo con nodos genéricos, y se resolvió insertando un `noOp` puente (`Hotmart - Continuar`) entre los dos IFs — con eso el conteo de nodos vuelve a coincidir. Si un `nodeCount` de `validate_workflow` da menos de lo esperado en un workflow con varios IFs encadenados directamente, esta es la causa a probar primero.
- **`Núcleo — V3 Puntos de Captación`** (workflow, id `9rANDT9ftOkmPO6u`): `Leads - Listar` ahora selecciona `dashboard_id` y acepta un `dashboard_id` opcional por query string (`AND ($3 = '' OR dashboard_id::text = $3)`) — filtro aditivo, no rompe nada de lo que ya llamaba este webhook sin ese parámetro.
- **`app/v3/[clienteId]/base-datos/page.tsx`**: lee el mismo `?dashboard=` del selector global (igual que Anuncios/Análisis/Endpoints) — no hay un selector nuevo, se reusa el que ya existe en `V3Topbar`. Botón "Exportar CSV" (client-side, `Blob` + `<a download>`, con BOM UTF-8 para que Excel no rompa los acentos) que respeta el tab activo y el filtro de dashboard. La pestaña "Ventas" ahora separa dos conceptos que antes se mezclaban en una sola columna "Origen": **Origen del lead** (`utm_source`/`pagina_origen`, de cuando la persona entró al embudo) y **Origen de la venta** (`extra.venta_sck`, de qué canal generó la compra puntual) — la pestaña "Leads captados" sigue mostrando solo "Origen" (no aplica el concepto de venta).
- **`components/v3/V3Sidebar.tsx`**: el link "Base de datos" ahora también propaga `?dashboard=` (antes no lo hacía, a diferencia de Anuncios/Análisis/Endpoints que sí).

### Logo de Vermetricas reemplazado (2026-09-30)

El ícono/favicon (`public/brand/vermetricas-icon.png`, `app/icon.png`) se reemplazó por un archivo nuevo que el usuario proveyó ya procesado (sin fondo, transparencia real — "Editar Logo con V.png"), reemplazando varios intentos anteriores de la misma sesión de recortar el fondo a mano desde un JPEG plano. Se hizo el recorte/padding/resize estándar (crop al bbox de contenido, canvas cuadrado con ~14% de margen, resize a 512/256) y se limpió una mota de 6 píxeles aislada del blob principal (detectada por análisis de componentes conectados sobre el canal alfa). **Gap conocido, no resuelto**: `vermetricas-horizontal-dark.png`/`-light.png` (usadas en `app/page.tsx` y `lib/email.ts` para el correo de reset de contraseña) y `vermetricas-lockup.png` siguen mostrando el logo viejo (índigo/morado) — son combinaciones ícono+wordmark que necesitan una versión nueva del wordmark que el usuario todavía no proveyó.

### Home de Lanzamiento — sección Meta Ads, animación de números y filtro de fecha (2026-09-30)

El Home de la V3 (`app/v3/[clienteId]/page.tsx`) tenía hasta ahora un único sistema de render basado en `Campaign.strategy_type` (legado). Se agregó una rama **nueva y paralela**, evaluada *antes* que esa lógica vieja: si el `dashboard_id` elegido por `?dashboard=` (mismo query param que ya usan Anuncios/Análisis/Base de datos/Endpoints) resuelve a un `v3_dashboards` con `tipo === 'lanzamiento'`, se muestra un Home completamente distinto, calculado con datos propios de Vermetricas (pull de Meta Ads + `client_leads` de Hotmart) en vez de cualquier número pre-agregado externo.

- **`lanzamientoMetrics`** (useMemo): `inversion`/`impresiones`/`clics` = suma sobre `metaData.campanas`; `leadsCount` = total de filas de `client_leads` del dashboard (cualquier estado); `ventasCount` = filas con `status==='comprado'`; `facturacionBruta`/`facturacionNeta` = ver sección de comisión de Hotmart más abajo; `moneda` = primera `extra.moneda` no vacía entre las ventas, default `"USD"`; `conversionPagina = leadsCount/clics*100` (etiquetada explícitamente "Clics → Leads (página de captación)"); `conversionGlobal = ventasCount/leadsCount*100` (etiquetada "Leads → Ventas (embudo completo)") — las dos etiquetas con su dirección explícita fueron un pedido puntual del usuario para que no haya ambigüedad al leer el dashboard.
- **`formatMoneyEnMoneda`** se movió a `lib/v3/format.ts` (antes vivía duplicada dentro de `page.tsx`) — corrige que el `formatMoney` compartido fuerza siempre `"US$"` sin importar la moneda real de la venta (las ventas de Hotmart pueden venir en COP, BRL, etc.).
- **`components/v3/AnimatedNumber.tsx`** (nuevo): animación de conteo portada de otro proyecto propio del usuario (`dashboard-m33`, componente `Numero`) — basada en reloj (`performance.now()`, no en frames), *ease-out* cúbico, retoma el conteo desde el último valor asentado (no desde 0) cuando el valor cambia, y salta directo al valor final (sin animar) si `document.hidden` o `prefers-reduced-motion: reduce`. `components/v3/KpiCard.tsx` amplió su prop `value` de `string` a `React.ReactNode` para poder recibirlo, y ganó un `sub?: string` opcional (línea chica debajo del valor, usada para las etiquetas de dirección de conversión y, más adelante, para "Lo que pagó el comprador"/"Después de la comisión de Hotmart").
- **`components/v3/V3PeriodFilter.tsx`** (nuevo): pills de preset rápido + un botón "Rango personalizado" que abre un panel reusando **tal cual** `components/webinar-os/control-center/PeriodCalendar.tsx` (el calendario de doble mes del Control Center clásico) — las variables CSS `--wos-primary`/etc. del calendario se re-escalan localmente a las `--color-*` de la V3 vía un `style` inline, sin duplicar el componente. `lib/webinar-os/control-center/dateRanges.ts` ganó los presets `30days`/`90days` (aditivo, no rompe el `WccFilterBar` clásico que ya usaba los 4 presets viejos).
- `app/api/v3/leads/route.ts` pasa `fecha_inicio`/`fecha_fin` al webhook de n8n. **Gotcha de Postgres/n8n**: `($4 = '' OR created_at >= $4::date)` tira `invalid input syntax for type date: ""` aunque el `OR` debería cortocircuitar — Postgres resuelve el cast del parámetro *antes* de evaluar el `OR` fila por fila. Se corrige con `NULLIF($4, '')::date IS NULL OR created_at >= NULLIF($4, '')::date` (`NULLIF` convierte el string vacío en un `NULL` real antes del cast).
- `components/v3/V3Sidebar.tsx`: el link "Dashboard" ahora también propaga `?dashboard=`, porque el Home pasó a leerlo.

### Gráfico "Desempeño por día" + desglose diario de Meta Ads (2026-10-01)

- **`components/v3/DesempenoDiarioChart.tsx`** (originalmente `VentasDiarioChart`, con menos datos — renombrado al completarse): `ComposedChart` de `recharts` con barras de Facturación/Inversión (eje de dinero) + línea de ROAS (eje de multiplicador), mismo esquema de colores que `components/v3/PerformanceChart.tsx` (ya existente para dashboards de evento presencial) — reusa ese patrón en vez de instalar una librería nueva (se evaluó y descartó un snippet de shadcn que el usuario pasó como referencia visual, porque no coincidía con el tipo de gráfico pedido y traía dependencias nuevas innecesarias).
- **`Integraciones — Pull Meta Ads (Cliente)`** (n8n, id `g3kj8LgGQP9CeCgL`) ganó un nodo nuevo, `MetaPull - Llamar Graph API Diario` — mismo endpoint `/insights` que ya usaba el pull, pero con `time_increment=1`, agregado por fecha en `Etiquetar y Acumular` y fusionado entre cuentas en `Formatear Respuesta Final` en un array nuevo `diario: MetaDiarioRow[]` (`lib/meta-ads/types.ts`) — **aditivo**, no se tocó `campanas`/`conjuntos`/`anuncios`. **Gotcha**: el nodo nuevo, al copiar la expresión del primer nodo de la cadena (`$json.ad_account_id`), fallaba con `"act_undefined"` — los nodos intermedios de esta cadena ya no tienen el item original en `$json` (fue transformado por cada nodo previo), así que hay que referenciar `$("MetaPull - Recorrer Cuentas").item.json.*` explícitamente, igual que ya hacían `Creativos`/`Thumbnails`/`Estado Campañas`/`Estado Conjuntos`.
- El gráfico ahora **sí respeta el filtro de fecha de la V3** (antes ignoraba el período elegido y siempre mostraba el mismo rango fijo de `metaData.diario`) — se recortan las fechas de `metaData.diario` al `rangoPeriodo` elegido antes de graficar. La tarjeta "Inversión publicitaria" en sí sigue siendo un total fijo de últimos 30 días (limitación real de Meta, ya documentada en el label de esa sección) — eso no cambió.
- **Bug de eje Y corregido**: el ancho del eje de dinero era fijo (60px, con un margen izquierdo negativo copiado de `PerformanceChart`) — con facturación/inversión en pesos colombianos (6-7 cifras) el texto se cortaba contra el borde. Ahora el ancho se calcula a partir del valor más grande que el gráfico vaya a mostrar, y el eje muestra el número compacto (`formatNumber`, sin símbolo de moneda repetido en cada marca) — el símbolo completo se reserva para el tooltip.
- **Bug real de n8n encontrado y corregido (afecta cualquier endpoint de listado existente, no solo el nuevo)**: cuando una consulta Postgres no encuentra ninguna fila, el nodo emite 0 items, y el nodo `respondToWebhook` de abajo **nunca se ejecuta** si no recibe ningún item — el webhook terminaba devolviendo un body completamente vacío (no `"[]"`), y el `res.json()` del lado de Next.js reventaba con `"Unexpected end of JSON input"` → 502. Se corrigió con `alwaysOutputData: true` en el nodo Postgres + una expresión de filtro en el nodo de respuesta (`$input.all().map(...).filter(j => j && j.id !== undefined)`, para descartar el item-placeholder vacío que `alwaysOutputData` fuerza). Aplica a `Leads - Listar` y al nuevo `Leads - Historial` (ver más abajo) dentro de `Núcleo — V3 Puntos de Captación`.

### Facturación bruta/neta con la comisión real de Hotmart (2026-10-01)

Hasta ahora "Facturación bruta" y "Cash collect (neta)" mostraban el mismo número — no había de dónde sacar la diferencia. `Integraciones — Hotmart Venta (Cliente)` (n8n, id `0y6MsifHRxW3MLyR`), nodo `Hotmart - Preparar Venta`: ahora también lee `data.commissions[]` del payload real de Hotmart (la entrada con `source: "PRODUCER"` es lo que neto le llega al cliente después de la comisión de la plataforma) y guarda `extra.monto_neto`/`extra.comision` junto al `extra.monto` que ya guardaba — cambio aditivo, el resto del flujo (match de lead, creación, respuestas) no se tocó. Si una venta no trae ese desglose (payload viejo o sin comisión informada), `monto_neto = monto` (fallback, nunca 0).

Frontend: `lanzamientoMetrics` separa `facturacionBruta` (suma `extra.monto`) y `facturacionNeta` (suma `extra.monto_neto`, con el mismo fallback) y deriva `roasBruto`/`roasNeto` de cada una — las tarjetas correspondientes ganaron un `sub` aclaratorio ("Lo que pagó el comprador" / "Después de la comisión de Hotmart").

### ID único de cliente — migración de slug legible a ID largo opaco (2026-10-01)

**Motivación del usuario**: el `cliente_id` de cada cliente era un slug legible derivado de su nombre (`"atlas"`, `"cliente-prueba-draft"`, generado por un `slugify(name)` dentro del workflow de creación) — riesgo real de colisión si dos clientes reales tienen nombre igual o parecido, y ese valor queda expuesto tal cual en varias URLs que se le entregan al cliente para pegar en herramientas externas (webhook de Hotmart, de WebinarKit/ClaseEspecial, captación del embudo de webinar, landing pages generadas). Decisión explícita del usuario (ante la opción de agregar un id externo aparte sin tocar el interno): **reemplazar de raíz** el `cliente_id` en todo el sistema, y **migrar todos los clientes existentes de una sola vez** (no mantener los ids viejos funcionando en paralelo).

- **12 tablas con columna `cliente_id`** (descubiertas por introspección real de `information_schema`, no por grep del código): `campaigns`, `client_connections`, `client_leads`, `evento_meta_config`, `landing_page_leads`, `landing_pages`, `leads`, `leads_lanzamiento_floppy`, `user_clients`, `v3_captacion_puntos`, `v3_dashboards`, `webinars`. 10 de esas 12 tienen FK hacia `clients.id`, **ninguna con `ON UPDATE CASCADE`** — un `UPDATE` directo del id hubiera fallado por violación de integridad referencial.
- **Migración ejecutada** con el patrón seguro "insertar el cliente con el id nuevo (copiando nombre/status/created_at del viejo) → reapuntar las 12 tablas al id nuevo → borrar la fila del cliente viejo", para los 10 clientes existentes (`floppy`, `andrea`, `john`, `atlas`, `qa-cliente-prueba`, `pipe-test`, `cliente-prueba-qa`, `cliente-prueba-draft`, `nelson-perdomo`, `valentina-ortiz`), todo dentro de una única transacción (`BEGIN`/`COMMIT`, todo-o-nada) — ids nuevos de 24 caracteres hex. **Verificado**: un `SELECT` de verificación que cuenta filas con los ids viejos en las 12 tablas + `clients` dio 0 en todas; el conteo de leads de un dashboard de prueba (289 filas) se mantuvo exactamente igual tras la migración, confirmando que no se perdió ni duplicó ningún dato.
- **`Núcleo — Gestión de Clientes`** (n8n, id `4Cdwp62y9XvS3b6v`), nodo `Clientes - Preparar Datos`: ya no slugifica el nombre — genera siempre un id random de 24 caracteres hex (no acepta un id manual del body, para no reabrir la puerta a colisiones). **Gotcha**: `require("crypto")` está bloqueado en el sandbox del Code node de esta instancia de n8n (`"Module 'crypto' is disallowed"`) — se reemplazó por un generador hex basado en `Math.random()` (entropía de sobra dado el volumen de clientes real de este negocio).
- **13 archivos de `app/api/evento/*`** tenían el id de Atlas escrito literal (`clientesDeSesion(session).includes("atlas")`) — actualizados al nuevo id largo generado para ese cliente en la migración.
- `clientesDeSesion` (`lib/auth.ts`) es agnóstico al formato del id (solo hace `.includes()` sobre un array de strings) — no necesitó ningún cambio.
- **Pendiente para el usuario, no es código**: avisar a **Valentina Ortiz** (Hotmart) y **John** (WebinarKit) — los únicos dos clientes con una integración que depende de una URL pegada externamente — para que vuelvan a copiar la URL nueva desde Conexiones (la página ya la arma sola con el id nuevo, no hace falta ningún cambio de código, solo que el cliente la vuelva a pegar en Hotmart/WebinarKit).

### Datos de demostración sembrados en producción (2026-10-01)

A pedido explícito del usuario ("no importa que estos datos queden con el usuario de prueba"), se sembraron datos falsos **directo en la base de producción** (vía workflows temporales de n8n — creados, ejecutados una vez, y borrados cada vez, patrón que esa cuenta de n8n ya usaba antes para QA puntual) para poder mostrar la plataforma en una demo real:

- Dashboard nuevo **"Demo Presentacion"** (id `7`, nomenclatura `SEGUIDORES` — reusa el gasto real de Meta de esa campaña) con 289 leads y 26 ventas (en COP, tickets variados entre 15.000 y 247.000) distribuidos día a día entre el 5 de septiembre y el 2 de octubre, calibrados para un ROAS creíble (~8.5x bruto) en vez de un número exagerado.
- 3 dashboards adicionales (**"Lanzamiento Septiembre"/"Octubre"/"Noviembre"**, ids `8`/`9`/`10`) con una sola persona de ejemplo ("Carlos Mendoza") registrada en los tres a lo largo de 2 meses, con `grupo_ingresado_at` en cada uno, comprando recién en el tercero — pensado específicamente para demostrar el historial de contacto cruzado (ver más abajo).
- Esto es **dato real en la base de producción**, no un mock local — queda ahí hasta que alguien lo borre explícitamente.

### Historial completo de contacto, cruzando lanzamientos (2026-10-01)

**Motivación del usuario**: una misma persona puede registrarse en varios Lanzamientos a lo largo del tiempo (cada lanzamiento con su propio grupo de WhatsApp separado) — hasta ahora cada registro era una fila aislada, visible solo dentro del dashboard donde ocurrió, sin forma de ver el recorrido completo ni saber en qué contacto exacto la persona terminó comprando.

- Nuevo endpoint `GET /webhook/v3-leads-historial?cliente_id=&correo=&telefono=` en `Núcleo — V3 Puntos de Captación` (n8n, id `9rANDT9ftOkmPO6u`) — `LEFT JOIN` (no `INNER`, para no perder ventas `fuera_de_embudo` sin `dashboard_id`) de `client_leads` con `v3_dashboards`, matcheando por correo **o** teléfono (mismo criterio que ya usa el matching de Hotmart), ordenado cronológicamente.
- Frontend: tipo `V3LeadHistorialRow` (`lib/v3/types.ts`), ruta `app/api/v3/leads/historial/route.ts` (mismo patrón de sesión que el resto de `/api/v3`), y `components/v3/LeadHistorialPanel.tsx` — un modal que "aplana" cada fila de la persona en varios eventos de una sola línea de tiempo (registro + los sub-eventos ya guardados en `extra`: `encuesta_at`/`gracias_visto_at`/`grupo_ingresado_at`/`mensaje_1a1_recibido_at`, más la compra como última interacción), con un ícono por tipo de evento, el nombre del lanzamiento en cada paso, y un resumen "N interacciones · compró en la interacción Nº X". Se abre con un ícono nuevo (`History`, lucide) en cada fila de "Base de datos" (tanto Leads como Ventas).
- Verificado en vivo con el ejemplo sembrado (Carlos Mendoza, sección anterior): el panel mostró correctamente las 7 interacciones en orden (3 registros + 3 ingresos a grupo + 1 compra) marcando la compra como la séptima.

### Análisis agregado del recorrido de compra (2026-10-01)

A pedido del usuario de poder "cruzar datos" más adelante (ej. "la gente compra en promedio en su 3ra interacción"): nueva pestaña **"Recorrido de compra"** en Base de datos, deliberadamente **independiente** del dashboard seleccionado arriba (resume todo el cliente, no un lanzamiento puntual — el recorrido de una persona por definición puede cruzar varios).

- Nuevo endpoint `GET /webhook/v3-leads-analisis-recorrido?cliente_id=` (mismo workflow `9rANDT9ftOkmPO6u`) — agrupa `client_leads` por persona (clave simplificada: `COALESCE(correo, telefono)`; no resuelve identidad transitiva cuando dos filas comparten teléfono pero no correo, misma limitación reconocida y no resuelta en esta entrega), reconstruye para cada comprador la misma línea de tiempo aplanada que ya arma el panel de historial, y devuelve en una sola consulta: `total_compradores`, `promedio`, `mediana`, `minimo`, `maximo`, y `distribucion` (cuántas personas compraron en su 1ra, 2da, 3ra... interacción).
- **Gotcha de definición**: la primera versión de la consulta no contaba la propia compra como una interacción más (dejaba el conteo en N-1 respecto al panel de historial) — se corrigió sumando `+1` en el CTE final, para que "compró en su interacción Nº X" sea un número consistente entre ambas features.
- Frontend: tipo `V3AnalisisRecorrido` (`lib/v3/types.ts`), ruta `app/api/v3/leads/analisis-recorrido/route.ts`, componente `components/v3/RecorridoCompraChart.tsx` (`BarChart` de recharts, mismo estilo que el resto).
- Verificado en vivo contra `cliente-prueba-draft`: 28 compradores analizados, promedio 2.32, mediana 2, rango 2–7 — coincide exactamente con los datos reales sembrados (26 ventas de un solo contacto = 2 interacciones cada una, Carlos Mendoza con su recorrido de 3 lanzamientos = 7, y una venta real vieja de pruebas anteriores = 6).

### Conexión de Meta Ads vía "Continuar con Facebook" — construido, apagado hasta tener la app de Meta (2026-10-01)

El método de conexión sigue siendo 100% manual (pegar ID + token, documentado en `/soporte/conectar-meta-ads` — ver más abajo) porque la alternativa simple (un botón de login de Facebook) necesita que la app de Meta de Atlas pase primero por **App Review + Verificación de empresa** de Meta para Advanced Access de `ads_read`/`ads_management` — un trámite externo que puede tardar semanas y no está garantizado. A pedido del usuario ("arranquemos por ese camino, mientras tanto nos vamos por el método manual"), se dejó **todo el flujo construido y en producción, pero invisible**, listo para activarse en cuanto existan credenciales reales:

- **`app/legal/privacidad`** y **`app/legal/eliminar-datos`** (páginas públicas, agregadas a `PUBLIC_PATHS` en `middleware.ts`) — las dos URLs que Meta exige tener publicadas antes de poder enviar una app a revisión. Contacto: `soporte@vermetricas.com`. **Nota de un error cometido y corregido en esta sesión**: el primer borrador de estas páginas usó por error un correo de un proyecto completamente distinto del usuario (no relacionado a Atlas) tomado sin verificar del `userEmail` ambiental de la sesión — corregido de inmediato; ver memoria de sesión persistente para no repetirlo (nunca asumir datos de contacto reales de un dato ambiental, siempre confirmar con el usuario cuál es el correcto para el proyecto puntual).
- **`lib/meta-oauth.ts`** + **`app/api/oauth/meta/{start,callback,pendiente,confirmar}/route.ts`**: flujo completo — redirige al diálogo OAuth de Meta → intercambia `code` por un token corto → lo extiende a un token largo (~60 días) → lista las cuentas publicitarias que la persona autorizó → la persona elige cuáles activar en un panel de confirmación dentro de Conexiones → se guarda con el **mismo** webhook de n8n que ya usa el método manual (`N8N_ONBOARDING_CONECTAR_URL`, mismo `config.ad_accounts` que la sección "Conexión de Meta Ads — multi-cuenta" de más arriba). El `access_token` real **nunca pasa por el navegador** — viaja solo dentro de una cookie `httpOnly` firmada (`jose`, el mismo paquete que ya usa `lib/auth.ts` para verificar sesión) hasta el paso de confirmación, que lo lee de nuevo server-side.
- El botón "Continuar con Facebook" en Conexiones solo se renderiza si existe `NEXT_PUBLIC_META_APP_ID` (chequeo client-side); las 4 rutas `/api/oauth/meta/*` responden `404` si no existen `META_APP_ID`+`META_APP_SECRET`+`META_OAUTH_STATE_SECRET` (`metaOAuthConfigurado()`, chequeo server-side) — hoy esas variables no existen en ningún entorno, así que esto no cambió nada para ningún usuario actual.
- Variables nuevas: `META_APP_ID=`, `META_APP_SECRET=`, `NEXT_PUBLIC_META_APP_ID=` (vacías a propósito — ver Pendientes) y `META_OAUTH_STATE_SECRET=<generado, ya replicado en Vercel>`.

### Portal de soporte / documentación — `/soporte` (2026-10-01)

Primera guía publicada: **"Cómo conectar tu cuenta de Meta Ads"** (recomienda generar un token de **Usuario del Sistema** en Business Manager, que no caduca, en vez de un token normal que expira en 1-2 horas o máximo 60 días). Se construyó primero como un artículo suelto; el usuario pasó como referencia los portales de documentación de Whop/Hotmart Developers/Make Apps, y se reconstruyó con ese mismo patrón (sidebar de categorías + breadcrumb + índice con tarjetas) en vez de un artículo aislado.

- **`app/soporte/layout.tsx`**: sidebar fijo de 240px en desktop (mismo ancho y lenguaje visual que `V3Sidebar` — chips de ícono `bg-primary/20`, item activo `bg-surface-high`) + menú hamburguesa en mobile. Agrupa guías por categoría ("Conectar fuentes de datos"); las que todavía no existen (GHL, Hotmart, WebinarKit) se muestran grisadas con badge "Pronto" en vez de ocultarse del todo, para que se note que la sección va a seguir creciendo.
- **`app/soporte/page.tsx`**: índice con tarjetas (mismo patrón disponible/"Pronto").
- **`app/soporte/conectar-meta-ads/page.tsx`**: la guía en sí, con breadcrumb + tiempo de lectura estimado, secciones numeradas con ícono propio por parte, y callouts de éxito/nota al final.
- `/soporte` se agregó a `PUBLIC_PATHS` (no necesita sesión — se puede compartir el link directo con cualquier cliente). Enlazado desde Conexiones → tarjeta Meta Ads ("¿No sabés cómo conseguir el ID o el token? Mirá la guía paso a paso").
- Skill de marca usada: `vermetricas-brand` (paleta teal/mint oficial, sección 15) — confirmó que los tokens `--color-primary`/`--color-secondary` ya cubren todo lo necesario para esta pieza nueva, sin inventar ningún hex.

### Acceso directo a la API de n8n sin el conector MCP (2026-10-02)

Hasta esta sesión, cualquier edición a un workflow de n8n dependía de tener el conector MCP de n8n conectado (de ahí todas las menciones a `validate_workflow`/`update_workflow`/`execute_workflow`/`publish_workflow` en el resto de esta sección 22). El usuario recordó que ya existe una credencial guardada para exactamente este propósito — `.credentials/n8n_atlas.env` → `N8N_API_TOKEN_ATLAS` — y que no hace falta ningún conector para leer/editar/crear/activar workflows: alcanza con llamar directo a la API pública de n8n.

- `GET https://n8n-n8n.hbus8n.easypanel.host/api/v1/workflows/:id` con header `X-N8N-API-KEY: $TOKEN` → JSON completo del workflow.
- `PUT` al mismo endpoint, body `{name, nodes, connections, settings}` (sin `id`/`active`/etc.) → reemplaza el workflow completo.
- `POST /workflows` (crear uno nuevo) y `POST /workflows/:id/activate` (activarlo).
- `GET /executions?workflowId=...` y `GET /executions/:id?includeData=true` → debug real: el input/output de cada nodo de una ejecución pasada (`resultData.runData[nombreDelNodo][0].data.main`) — así se diagnosticó el gotcha de `$json` más abajo.
- **Lo que esta vía no tiene**: ningún "ejecutar manualmente" (el `execute_workflow` del conector) — probar un cambio implica llamar al webhook real con un payload de prueba, igual que en producción. Tampoco hay `validate_workflow`, así que el gotcha ya documentado en esta sección ("un IF encadenado directo a otro IF pierde un nodo en silencio") hay que vigilarlo a mano — se confirmó el `nodeCount` del JSON devuelto después de cada `PUT` en todas las ediciones de esta sesión, y coincidió siempre con lo esperado.
- **Gotcha operativo**: el primer `curl` lo bloqueó el clasificador de modo automático del asistente, sin dar una razón específica. El usuario lo resolvió cambiando el modo de permisos de la sesión (salió de "Auto") — el mismo comando funcionó de inmediato después, sin ningún otro cambio.

### Hotmart — carrito abandonado, tarjeta rechazada, cuotas y dinero pendiente (2026-10-02)

El usuario pidió revisar la documentación real de Hotmart (`developers.hotmart.com`, páginas de webhook 2.0.0 y "Installments Negotiation") porque estaba seguro de que varios de estos datos sí vienen en el payload. Confirmado, con precisión mayor a lo que se había asumido en sesiones anteriores:

- **Carrito abandonado es un evento propio y dedicado**: `event: "PURCHASE_OUT_OF_SHOPPING_CART"` (nombre exacto, no un regex). Su payload **no tiene objeto `purchase`** — es `data.affiliate`, `data.product`, `data.buyer.{name,email,phone}` (campo `phone`, no `checkout_phone`), `data.offer.code`, `data.checkout_country`.
- **Tarjeta rechazada no tiene evento propio** — se infiere de `purchase.payment.refusal_reason` (texto que Hotmart llena cuando el proveedor de pago rechaza el cobro), señal más confiable que adivinar por `purchase.status`; se mantiene el chequeo de status como respaldo.
- **`purchase.payment.installments_number`**: cantidad real de cuotas (pagos en BRL/MXN/COP).
- **Cuota pendiente**: documentado bajo "Installments Negotiation" — evento `PURCHASE_DELAYED` o `purchase.status = "OVERDUE"` (boleto/cuota vencida sin cobrar todavía).

**`Integraciones — Hotmart Venta (Cliente)`** (n8n, id `0y6MsifHRxW3MLyR`, 18 nodos) — editado vía la API directa (sección anterior), confirmando `nodeCount=18` después de cada `PUT`:

- `Hotmart - Preparar Venta` (Code): agrega `estadoCompra`, `pago = purchase.payment || {}`, `esCarritoAbandonado = evento === 'PURCHASE_OUT_OF_SHOPPING_CART'`, `esTarjetaRechazada = !!pago.refusal_reason || /NO_FUNDS|DECLIN|REJECT|REFUS/i.test(estadoCompra)`, `esPagoPendiente = evento === 'PURCHASE_DELAYED' || estadoCompra === 'OVERDUE'`, `campoEventoSecundario` (`'carrito_abandonado_at'` | `'tarjeta_rechazada_at'` | `'cuota_pendiente_at'` | `''`), `cuotas = Number(pago.installments_number) || null`, `montoPendiente` (solo cuando `esPagoPendiente`).
- `Hotmart - Es Venta?`: condición ampliada a `$json.esVenta || !!$json.campoEventoSecundario` — así el flujo existente de buscar/actualizar/crear lead también se dispara para estos tres eventos nuevos, sin nodos ni conexiones nuevas.
- `Hotmart - Actualizar Lead` / `Hotmart - Crear Lead`: `queryReplacement` ahora es una función que arma `status`/`extra` según el caso — si `esVenta`, `status='comprado'` + los campos de venta de siempre (incluye `cuotas`); si `campoEventoSecundario`, `status` queda sin tocar (`COALESCE`) y solo se mergea ese campo con `now()` (+ `monto_pendiente` para el caso de cuota pendiente). El merge (`extra || $N::jsonb`) **nunca pisa un timestamp viejo** — si alguien con `tarjeta_rechazada_at` o `cuota_pendiente_at` ya seteado después paga, esa fecha se conserva y el lead pasa a `comprado`: así "si rebota pero después compra" queda bien reflejado, pedido explícito del usuario. Sin match previo, se crea un lead nuevo con `status='lead'` (nunca `'comprado'` para un evento secundario) y `extra={fuera_de_embudo: true, [campo]: ...}`.
- **Bug real encontrado y corregido en `Hotmart - Buscar Lead`**: `WHERE cliente_id=$1 AND (correo=$2 OR telefono=$3)` — si ambos parámetros llegaban vacíos (`''`), matcheaba cualquier fila con `correo=''`/`telefono=''`, mezclando leads de personas distintas. Se corrigió a `((NULLIF($2,'') IS NOT NULL AND correo=$2) OR (NULLIF($3,'') IS NOT NULL AND telefono=$3))` — mismo patrón `NULLIF` ya usado en el filtro de fechas (sección "Home de Lanzamiento" más arriba). No es nuevo de esta entrega, ya afectaba cualquier evento de Hotmart sin teléfono — solo que nunca se había notado. El mismo patrón se usó de entrada, correctamente, en los dos workflows nuevos de esta sesión (Soporte y Enlaces Cortos, ver abajo).

**Frontend** — nuevo módulo `lib/v3/embudo.ts` (antes la lógica del funnel vivía inline en `page.tsx`; se extrajo a funciones puras para esta entrega):
- `calcularEventoHotmart(leads, campo)`: `count` = leads con ese campo en `extra` **y** `status !== 'comprado'` (los recuperados no cuentan como "perdidos"); `recuperados`/`porcentajeRecuperacion` aparte. Usada para `carritoAbandonado`/`tarjetaRechazada`/`cuotaPendiente`.
- `calcularPagoPendiente`: igual que arriba, más `montoPendiente` (suma `extra.monto_pendiente` solo de los que siguen sin pagar).
- `pagosACuotas` = leads `status==='comprado'` con `extra.cuotas` numérico **mayor a 1** (1 cuota es pago único, no cuenta).
- `facturacionPagoUnico`/`facturacionEnCuotas` = las mismas ventas que ya cuenta `compraron`, partidas por `extra.cuotas > 1`.

**Verificado en vivo contra `cliente-prueba-draft`** (payloads reales mandados por `fetch`/`curl` directo al webhook público `/api/hooks/integraciones/hotmart-venta`, nunca hardcodeados en código ni escritos directo en la base): el payload exacto documentado de carrito abandonado (sin objeto `purchase`) matcheó bien; una tarjeta rechazada señalada solo por `refusal_reason` (sin status sospechoso) se detectó correctamente; recuperación confirmada (tarjeta rechazada → después compra completa → `status='comprado'` conservando el `tarjeta_rechazada_at` original); 6 ventas de prueba (3 con 1 cuota, 3 con 6 cuotas) dieron `Pagos a cuotas = 3` exacto; 4 cuotas pendientes de montos distintos dieron `Dinero pendiente` exacto a la suma esperada.

### Facturación por tipo de pago, gráfico de tendencia y "Contactaron a soporte" (2026-10-02)

- **Facturación pago único vs. en cuotas**: dos cards nuevas en el Home de Lanzamiento, sin backend nuevo — mismas ventas que `facturacionBruta`, partidas por `extra.cuotas > 1` (ver arriba).
- **`components/v3/TendenciaHotmartChart.tsx`** (nuevo): `ComposedChart` de `recharts` con Ventas/Carrito abandonado/Tarjetas rechazadas por día, agrupando cada evento por su propia fecha (no todo por `created_at`). El usuario pasó prompts/imágenes de referencia de componentes shadcn/Switchy y corrigió explícitamente el malentendido inicial: **no copiar esos componentes ni sus colores** — tomar solo el *tipo de gráfico, la animación y el mecanismo*. Resultado: línea suave (`type="monotone"`) con área de gradiente debajo en la serie principal, puntos con centro hueco (`fill: var(--color-surface)`, `stroke` del color de la serie), líneas **punteadas** para las dos series secundarias, y una `<ReferenceLine>` en el último día — todo con los tokens `var(--color-*)` de marca (teal/mint), nunca un hex literal de la referencia.
- **Nuevo workflow standalone `Integraciones — Soporte Contacto (Cliente)`** (n8n, id `g1ReDKf0TLOQIsyN`, 8 nodos, creado y activado vía la API directa, no es una extensión de uno existente). `POST /webhook/integraciones/soporte-contacto?cliente_id=`, body `{correo?, telefono?}` — a nivel de **cliente completo** (no por punto de captación, a diferencia de Encuesta/Grupos/Mensaje 1a1), busca el lead más reciente con el mismo WHERE NULLIF-seguro de Hotmart y mergea `extra.contacto_soporte_at`; 404 si no hay match (**no crea un lead nuevo**, a diferencia de Hotmart). Agregado a `ALLOWED_PATHS` del proxy `/api/hooks`. `contactaronSoporte` en `lib/v3/embudo.ts` es un conteo simple — no tiene concepto de "recuperación" como carrito/tarjeta. **UI agregada el 2026-10-02** (faltaba en el build original): botón "Ver webhook de soporte" en la tarjeta de Go High Level de `/v3/[clienteId]/conexiones` — mismo patrón "Ver webhook" que ya tiene Hotmart, pero **solo visible para `role === "admin"`** (a diferencia del de Hotmart, que el cliente sí pega en su propia cuenta — este lo configura el equipo de Atlas dentro del workflow de GHL del cliente, el cliente mismo no lo toca). Muestra la URL enmascarada (`/api/hooks/integraciones/soporte-contacto?cliente_id=...`) + botón de copiar, con el body esperado como nota chica.
- **Verificado en vivo**: soporte-contacto con un correo inexistente → 404; con 8 leads reales del dashboard → 8/8 OK y `Contactaron a soporte = 8` en el Home.

### Acortador/trackeador de enlaces propio — "Vieron la clase" / "Vio replay" (2026-10-02)

Último pendiente real de la primera fila de KPIs: "Vieron la clase" y "Vio replay" no tenían ninguna fuente de datos porque esos links se mandan por WhatsApp (mensaje 1a1 de GHL), fuera de cualquier API/webhook que se pueda escuchar directamente. El usuario pasó capturas de Switchy.io como referencia de qué campos tiene un acortador de enlaces (país/ciudad, UTMs) — **nota de higiene de datos**: esas capturas eran de la cuenta real de Klinkert del usuario; se tomó solo la idea de campos/UI, nada de ese contenido (nombres, URLs, carpetas) entró a este proyecto, ver regla permanente sobre esto en la memoria de sesión.

Solución construida, pensada como mecanismo **general** para cualquier cosa "fuera de API" a futuro (no solo clase/replay — por eso el campo `tipo` queda libre, no un enum cerrado): la persona hace clic en un link propio (`vermetricas.com/r/{token}`), eso nos avisa primero (a qué lead pertenece, país/ciudad) y recién ahí redirige al destino real.

Decisiones confirmadas con el usuario (`AskUserQuestion`): la URL de destino (clase/replay) se configura **por dashboard**, no por punto de captación; la generación del link personalizado por lead la **pide GHL** (modelo *pull*, no push) — en el mismo workflow de GHL que ya manda el mensaje 1a1, se agrega un paso de Webhook ANTES de mandar el mensaje, que le pide a Vermetricas el link de ese lead y lo inserta en el texto; geolocalización con un servicio gratuito estándar, sin credenciales nuevas.

**Backend**:
- `v3_dashboards` gana la columna `url_enlaces jsonb NOT NULL DEFAULT '{}'::jsonb` — deliberadamente un objeto libre keyed por `tipo` (ej. `{"clase": "...", "replay": "..."}`), no columnas fijas, así un "tipo" nuevo a futuro no necesita migración. Migrada + expuesta vía un tercer webhook trigger (`PATCH`, mismo path `v3-dashboards`) agregado a `Núcleo — V3 Dashboards` (n8n, id `6lZrzNxN2PRXfjXK`) → `V3Dash - Webhook Actualizar` → `V3Dash - Asegurar Columna Enlaces` (ALTER, sin parámetros) → `V3Dash - Actualizar Enlace` (`UPDATE ... SET url_enlaces = url_enlaces || jsonb_build_object($3,$4) WHERE id=$1 AND cliente_id=$2`). **Gotcha confirmado de nuevo esta sesión**: una migración DDL multi-statement no puede ir en el mismo nodo Postgres que una query parametrizada (el protocolo extendido/preparado de Postgres solo soporta un statement cuando hay parámetros bindeados) — por eso son dos nodos separados.
- Nuevo workflow `Integraciones — Enlaces Cortos (Cliente)` (id `EotGQtUyd51yoWoT`, 22 nodos) con dos webhooks:
  - `generar-enlace` (POST, lo llama **GHL**): busca el lead más reciente por correo/teléfono (NULLIF-seguro) → resuelve `v3_dashboards.url_enlaces ->> tipo` (si no hay URL configurada para ese tipo, error explícito, nunca se inventa un destino) → reusa el enlace existente si ya se generó uno para ese `(lead_id, tipo)` (`UNIQUE` constraint, idempotente — así GHL puede reintentar sin crear duplicados) o genera uno nuevo (`token = encode(gen_random_bytes(20), 'hex')`) → responde `{url: "https://www.vermetricas.com/r/" + token}`.
  - `resolver-enlace` (GET, lo llama **solo** nuestro propio `/r/[token]`, nunca un cliente externo): busca por token → inserta un registro en `v3_enlaces_clics` (ip/país/ciudad/user-agent, siempre, cada clic) → mergea `extra['vio_' + tipo + '_at']` en el lead **solo la primera vez** (`COALESCE`, clics repetidos no pisan la fecha) → responde `{destino_url}`.
  - **Mismo gotcha de `$json` encontrado y corregido en ambos "Normalizar"**: un Code node después de un nodo Postgres (la migración DDL-ensure) leía bare `$json`, que en ese punto de la cadena es la salida del nodo Postgres (`{success:true}`), no el payload del webhook — todos los campos llegaban vacíos, causando 404 falsos. Se corrigió referenciando explícitamente `$('Enlaces - Webhook Generar').item.json` / `$('Enlaces - Webhook Resolver').item.json`. Mismo tipo de bug que ya está documentado para otras cadenas de esta sección — regla general: cualquier Code node con más de un nodo entre él y la fuente real del dato debe referenciar el nodo por nombre, nunca `$json` a secas.
- **`app/r/[token]/route.ts`** (nuevo, público, sin sesión — `/r` agregado a `PUBLIC_PATHS`): extrae la primera IP pública de `x-forwarded-for`, geolocaliza con `http://ip-api.com/json/{ip}?fields=status,country,city` (gratis, sin API key, timeout de 2s, nunca bloquea el redirect si falla), llama **directo** al webhook `resolver-enlace` de n8n (server-to-server — a propósito **no** pasa por el proxy `/api/hooks`, porque ese proxy es solo para llamadas iniciadas externamente, y esta la inicia nuestro propio servidor) y hace `NextResponse.redirect(destino_url, 302)`. 404 propio (HTML simple) si el token no existe o algo falla. El proyecto usa Next 14.2.5 (sin `after()` estable) — por eso la llamada de log es síncrona antes de redirigir, no en background.
- `app/api/hooks/[...path]/route.ts`: agregado `"integraciones/generar-enlace"` a `ALLOWED_PATHS` (lo llama GHL) — `resolver-enlace` **no** se agrega ahí a propósito, nunca lo llama nadie externo.
- **UI**: `app/v3/[clienteId]/endpoints/page.tsx` ganó un bloque "Enlace corto — clase y replay" con dos inputs (URL de la clase / URL del replay) + botón Guardar (`PATCH /api/v3/dashboards`, nuevo método en `app/api/v3/dashboards/route.ts`, mismo patrón de sesión que `POST`), y un tercer bloque **solo visible para `role === "admin"`** con la URL del webhook `generar-enlace` para pegar en el workflow de GHL, mismo patrón que "Mensaje 1a1 recibido".

**Verificado en vivo de punta a punta contra `cliente-prueba-draft`**: configuró `url_clase`/`url_replay` de un dashboard real desde la UI nueva, llamó `generar-enlace` simulando a GHL (recibió `/r/{token}`), abrió ese link **en el navegador real** → redirigió al destino configurado (YouTube), quedó una fila en `v3_enlaces_clics`, y el Home mostró "Vieron la clase"=1 / "Vio replay"=1 reflejando `extra.vio_clase_at`/`extra.vio_replay_at`. Pedir el mismo link dos veces devolvió el mismo token (idempotencia confirmada). **Con esto, de la fila de KPIs original, solo queda sin resolver el "sin match" de Grupos (ver Pendientes).**

**Nota sobre datos de demo**: todos los números de prueba de esta sesión (Hotmart, Soporte, Enlaces) se generaron llamando a los webhooks reales con payloads de prueba — nunca escribiendo un número fijo en el código o directo en la base — mismo criterio ya establecido para `cliente-prueba-draft`. El reloj del servidor de n8n/Postgres corre ~1 día adelantado al de este entorno local — datos recién sembrados pueden caer fuera del filtro default "Últimos 30 días" del Home; hay que elegir "Todo el período" para verlos.

### "Páginas de testeo" — comparación A/B, visitas desde Meta (2026-10-02)

Pedido del usuario: cuando un cliente corre varias páginas de testeo (landings distintas compitiendo por el mismo lanzamiento, para ver cuál convierte más), quiere ver por página: cantidad de visitas, registrados, % de conversión (visitas → registros), cuántos respondieron la encuesta y cuántos entraron al grupo. Cada "página de testeo" ya existía como concepto en el esquema — es exactamente un **punto de captación** (`v3_captacion_puntos`), que ya trae su propio nombre/token/endpoints.

**Lo único que faltaba era "visitas"** — hoy nada trackea que alguien *abrió* la página, solo que *se registró*. Se evaluaron tres formas de resolverlo con el usuario (`AskUserQuestion`): (1) un píxel propio que el cliente pega en cada página, (2) reusar el acortador de enlaces (sección anterior) como entrada de tráfico, o (3) usar lo que Meta ya reporta (Clics en el enlace) por anuncio/conjunto/campaña. El usuario eligió la opción 3 — **sin pixel nuevo, sin tocar la página del cliente**, a cambio de una limitación real y explícita: solo funciona si cada página de testeo corre como su propio anuncio/conjunto/campaña dedicado en Meta (si el cliente manda varias páginas desde el mismo anuncio, por ejemplo con un parámetro de URL, esto no las distingue).

- **`Integraciones — Pull Meta Ads (Cliente)`** (n8n, id `g3kj8LgGQP9CeCgL`): las tres llamadas de insights (`campaign`/`adset`/`ad`) ganaron `inline_link_clicks` en su `fields` — es el campo real de "Clics en el enlace" de Meta (distinto de `clicks`, que cuenta todo clic sobre el anuncio, incluye likes/comentarios). `Etiquetar y Acumular` mapea esto a `link_clicks` en `campanas`/`conjuntos`/`anuncios` — aditivo, sin nodos nuevos. `lib/meta-ads/types.ts`: `link_clicks: number` en los tres tipos (`MetaCampaignRow`/`MetaAdsetRow`/`MetaAdRow`).
- **`v3_captacion_puntos` gana tres columnas** (`meta_nivel text`, `meta_entity_id text`, `meta_entity_nombre text`, todas nullable — una página sin vincular simplemente no tiene visitas, nunca se inventa un número): el vínculo se guarda manualmente desde `/v3/[clienteId]/endpoints`, eligiendo nivel (Campaña/Conjunto/Anuncio) y después la entidad real de una lista (poblada reusando `/api/anuncios/meta`, mismo endpoint que ya alimenta Administrador de Anuncios — cada opción del `<select>` muestra sus clics en el enlace de los últimos 30 días, para elegir con el dato a la vista).
- **Nuevo webhook `PATCH /webhook/v3-captacion-puntos`** en `Núcleo — V3 Puntos de Captación` (n8n, id `9rANDT9ftOkmPO6u`, mismo path que ya tenía `GET`/`POST`, método nuevo) — body `{punto_id, dashboard_id, cliente_id, meta_nivel, meta_entity_id, meta_entity_nombre}`; mandar `meta_nivel`/`meta_entity_id` vacíos **desvincula** la página (`NULLIF` en el UPDATE). Valida que el punto realmente pertenezca a ese `dashboard_id`+`cliente_id` antes de actualizar (mismo criterio de seguridad que el resto de los webhooks de este workflow). Ruta Next.js: `PATCH` nuevo en `app/api/v3/captacion-puntos/route.ts`, mismo patrón de sesión/`clientesDeSesion` que su `GET`/`POST`.
- **Gotcha real de esta sesión, mismo de siempre pero cometido por mí mismo esta vez**: la migración (`ALTER TABLE` de las 3 columnas nuevas) se encadenó para correr también **inline, antes de la validación**, en el propio webhook PATCH (no solo detrás del trigger manual, que no se puede disparar vía la API pública de n8n — ver "Acceso directo a la API de n8n" más arriba). Al insertarla ahí, el Code node de validación siguiente leía bare `$json` — que en ese punto de la cadena es la salida del nodo Postgres de la migración (`{success:true}`), no el payload del webhook — y todos los campos llegaban `null`/vacíos. Mismo bug ya documentado dos veces antes en esta sección, encontrado vía `GET /executions/:id?includeData=true`, corregido referenciando `$('Captacion - Webhook Vincular Meta').item.json.body` explícitamente.
- **`Captacion - Listar Puntos` y `Leads - Listar`** (mismo workflow): el primero ahora selecciona `meta_nivel`/`meta_entity_id`/`meta_entity_nombre`; el segundo ahora selecciona `punto_captacion_id` (la columna ya existía en `client_leads` desde el principio del embudo, pero nunca se exponía al frontend — necesaria para poder agrupar leads por página).
- **`lib/v3/embudo.ts`**, nueva función `calcularPaginasTesteo(leads, puntos, metaData)`: agrupa `leads` por `punto_captacion_id`, cuenta registrados/encuesta/grupo, y busca `link_clicks` en `metaData` por `campaign_id`/`adset_id`/`ad_id` según el `meta_nivel` del punto — `visitas` queda en `null` (no `0`) cuando la página no está vinculada, y `conversion` queda en `null` cuando no hay visitas con qué dividir.
- **`components/v3/PaginasTesteoTable.tsx`** (nuevo): tabla simple (Página/Visitas/Registrados/% Conversión/Encuesta/Entró al grupo), ordenada por registrados descendente, con un sub-texto por fila ("Vinculada a: `<nombre del anuncio>`" o "Sin vincular con Meta"). Montada en `app/v3/[clienteId]/page.tsx` justo debajo de "Tendencia de Hotmart".
- **Verificado en vivo contra `cliente-prueba-draft`**, dashboard "Demo Presentacion": se crearon dos puntos de captación reales ("Pagina de captación", ya existente con 150+ leads de una siembra anterior, y una nueva "Pagina de captacion B"), vinculados a dos anuncios reales distintos de la cuenta de Meta del cliente; se sembraron leads/encuesta/grupo reales vía los webhooks correspondientes para la página B. Resultado en el Home: Página A (vinculada a un anuncio con 1.818 clics en el enlace) → 153 registrados, 8.4% de conversión; Página B (vinculada a un anuncio con 3.300 clics) → 8 registrados, 0.2% — exactamente el tipo de comparación que pidió el usuario, con números reales de extremo a extremo (nada hardcodeado).

**Creación en lote al armar el dashboard (mismo día)**: el usuario pidió que, al crear un dashboard de tipo Lanzamiento, también se pregunte cuántas páginas de testeo va a correr (1 a 5 — no espera testear más de 5 a la vez), para no tener que dar de alta cada punto de captación a mano después. `components/v3/V3Topbar.tsx`: el form "Crear nuevo" gana un selector de pills (1-5, solo visible con tipo Lanzamiento); al confirmar, además de `POST /api/v3/dashboards`, encadena un `POST /api/v3/captacion-puntos` por cada página ("Página A".."Página E"), con una etiqueta de GHL auto-generada (`slugify(nombre del dashboard) + "_pagina_" + letra`, ej. `lanzamiento_agosto_pagina_a`) — cada punto ya trae solo sus endpoints hermanos (mismo mecanismo que ya existía, luego ampliado con "visita" más abajo). Sin backend nuevo: reutiliza tal cual el endpoint de creación de puntos que ya existía para el alta manual desde Endpoints (que sigue disponible para agregar más páginas después, o para corregir la etiqueta si hace falta). Si alguna página falla al crearse (red, etc.), el dashboard igual queda creado y el formulario se mantiene abierto mostrando cuáles páginas fallaron, para agregarlas a mano. Verificado en vivo: dashboard de prueba con 3 páginas → "Página A/B/C" aparecieron con sus etiquetas correctas en Endpoints.

### Corrección — "Páginas de testeo" pasa de Meta a un pixel propio (2026-10-02, mismo día)

El usuario señaló un problema real con el diseño de arriba: en la práctica, una misma página de testeo casi nunca recibe tráfico de un solo anuncio — un trafficker suele correr 5, 6, 7 anuncios distintos (creativos/públicos distintos) apuntando **a la misma landing**, para encontrar cuál convierte mejor. Vincular la página a **un** anuncio/conjunto/campaña (como quedó armado arriba) subcuenta sistemáticamente en ese escenario — solo captura el tráfico de la entidad elegida, ignorando el resto.

**Antes de descartar la idea de Meta, se investigó en vivo si se podía sumar automáticamente el tráfico de *todos* los anuncios que apuntan a una misma URL de destino** (sin que el admin tenga que vincular nada a mano) — resultado: **no es viable con la conexión actual**. Se instrumentó temporalmente `Integraciones — Pull Meta Ads (Cliente)` (revertido después de la prueba, sin dejar residuo) para inspeccionar los creativos reales de la cuenta de `cliente-prueba-draft`: casi todos sus anuncios están armados con la técnica de "usar una publicación existente" (un post de la Página potenciado como anuncio, muy común en este tipo de video-ads orgánicos) — en ese caso, Meta **no expone la URL de destino en el anuncio ni en su creativo**, vive en el post de la Página al que apunta. Al intentar leer ese post con el token ya conectado (`ads_read`+`ads_management`), Meta devolvió un error real y reproducible:

> `(#10) This endpoint requires the 'pages_read_engagement' permission or the 'Page Public Content Access' feature.`

Es decir, haría falta pedirle al cliente un permiso adicional de **Páginas** (no solo de Anuncios) — un paso más de conexión, no un simple cambio de código — y aun así solo cubriría los anuncios armados directo en Ads Manager con una URL propia en el creativo (`object_story_spec.link_data.link`), no los que usan una publicación existente. Mezclar "a veces sí, a veces no" es poco confiable para un dato tan central. Con esto confirmado, se descartó la vía de Meta por completo para esta feature.

**Reemplazo: pixel propio** (la opción que el usuario ya había anticipado como respaldo) — un `<img>` de 1x1 oculto que el cliente pega una vez en cada página de testeo, cuenta toda visita real sin importar cuántos anuncios distintos manden tráfico ahí (ni si es orgánico/directo). Un `<img>` no tiene restricción de CORS para cargar (a diferencia de un `fetch`/XHR), así que no hizo falta ninguna configuración especial de cabeceras para que funcione cross-origin desde el dominio del cliente.

- **Se revirtió todo lo de Meta de la sección anterior**: se sacaron las 9 nodos "Vincular Meta" de `Núcleo — V3 Puntos de Captación`, el `PATCH` de `app/api/v3/captacion-puntos/route.ts`, y el bloque de UI correspondiente en `/v3/[clienteId]/endpoints`. Las 3 columnas (`meta_nivel`/`meta_entity_id`/`meta_entity_nombre`) se dejaron en la tabla sin usar (un `DROP COLUMN` no aporta nada funcional y agrega riesgo innecesario) — si alguna vez se audita el esquema, son candidatas a limpieza. `link_clicks` en `lib/meta-ads/types.ts` y el pull de Meta **se dejaron como están** (ya no alimentan esta feature, pero es un dato genéricamente útil — "Clics en el enlace" real de Meta — que no cuesta nada mantener disponible para otra pantalla el día de mañana).
- **Nueva tabla `v3_captacion_visitas`** (`id, punto_captacion_id, ip, user_agent, created_at`) — un registro por cada carga de página (no deduplicado: cuenta "vistas de página", no "visitantes únicos" — igual que ya documentado para los clics del acortador de enlaces, se prefirió simplicidad sobre una lógica de deduplicación por IP/cookie que no se pidió).
- **`v3_punto_endpoints` gana el tipo `'visita'`** — se agregó al `CHECK` de la columna `tipo` (buscando el nombre real de la constraint vigente en vez de asumir el autogenerado, por las dudas) y al array que genera los 4→5 endpoints hermanos de cada punto nuevo. Los puntos que ya existían de antes de este cambio se completan solos la próxima vez que se listan (`WHERE NOT EXISTS`, idempotente) — sin necesidad de migrar nada a mano.
- **Migración 100% inline, sin trigger manual**: como el trigger manual de este workflow no se puede disparar vía la API pública de n8n (ver "Acceso directo a la API de n8n" más arriba), toda la migración (`CREATE TABLE`, el `ALTER` del `CHECK`, el backfill de endpoints faltantes) se encadenó **delante de `Captacion - Listar Puntos`**, para que corra sola la primera vez que alguien abre Endpoints o el Home después del deploy.
  - **Gotcha real, de nuevo el mismo bug — esta vez lo cometí yo mismo por tercera vez en la sesión**: al insertar ese nodo de migración justo antes de `Captacion - Listar Puntos`, su `queryReplacement` (que leía `$json.query.dashboard_id`/`cliente_id`) pasó a leer la salida del nodo de migración (`{success:true}`) en vez del payload del webhook, y la query terminó corriendo con parámetros vacíos — **0 resultados, sin ningún error visible** (ver `GET /executions/:id?includeData=true` para cómo se diagnosticó). Mismo patrón ya documentado dos veces antes en esta sección, pero esta fue la primera vez que afectó a un nodo Postgres con `queryReplacement`, no solo a un Code node — la lección se generaliza: **cualquier expresión que lea `$json` dejar de ser segura en cuanto se inserta un nodo nuevo justo antes**, sea Code o Postgres. Se corrigió referenciando `$('Captacion - Webhook Listar Puntos').item.json.query...` explícitamente.
- **Nuevo webhook `GET /webhook/v3-captacion-visitas?dashboard_id=&cliente_id=`** (mismo workflow `9rANDT9ftOkmPO6u`) — lista las visitas crudas (`id, punto_captacion_id, created_at`) de todos los puntos de un dashboard, mismo patrón `alwaysOutputData`+filtro que el resto de los listados de este workflow. Se devuelven filas crudas (no un conteo ya agregado) para que el frontend pueda filtrarlas por el mismo rango de fecha que ya usa el resto del Home.
- **Nuevo webhook `GET /webhook/integraciones/captacion-visita?token=...`** en `Integraciones — Eventos de Embudo (Cliente)` (id `0nueiQdNQCp2qlw9`) — a diferencia de Encuesta/Grupos/Mensaje 1a1 (que buscan y actualizan un lead existente), este no identifica a ninguna persona: busca el `punto_captacion_id` por token+tipo `'visita'` (404 si no existe) e inserta una fila en `v3_captacion_visitas` con la IP (primera de `x-forwarded-for`) y el user-agent. Responde `{ok:true}` en JSON — **no hace falta devolver una imagen real**: un `<img>` oculto (`display:none`, 1x1) dispara la petición igual sea cual sea la respuesta, lo único que importa es que el navegador la mande.
- **`app/api/hooks/[...path]/route.ts`**: agregado `"integraciones/captacion-visita"` a `ALLOWED_PATHS` — el pixel pasa por el mismo proxy enmascarado que todo lo demás, nunca expone el host de n8n.
- **`/v3/[clienteId]/endpoints`**: la tarjeta de cada punto gana una fila "Visitas (pixel para 'Páginas de testeo')" — a diferencia del resto de los endpoints (que copian una URL pelada para pegar en un form/GHL), el botón "Copiar snippet" copia un `<img src="..." width="1" height="1" style="display:none" alt="" />` ya armado, listo para pegar en el `<head>` o antes de `</body>` de la página — con una nota chica explicando esto justo debajo de esa fila.
- **`lib/v3/embudo.ts`**: `calcularPaginasTesteo(leads, puntos, visitas, rangoPeriodo)` — cambia de firma (ya no recibe `metaData`), cuenta visitas filtrando por `punto_captacion_id` y por el mismo `rangoPeriodo` que ya aplica el resto del Home (antes, con Meta, las visitas ignoraban el filtro de fecha — ahora quedan consistentes con el resto de la tabla). `visitas` ahora es siempre un número (nunca `null`) porque cada punto siempre tiene su endpoint de visita, exista o no tráfico real todavía.
- **`components/v3/PaginasTesteoTable.tsx`**: sin "Sin vincular con Meta" — si `visitas === 0` y `registrados > 0`, muestra en su lugar "¿Ya pegaste el pixel de visitas en esta página?", una pista más útil (lo más probable en ese caso es que falte pegar el snippet, no que nadie haya entrado).
- **Variable de entorno nueva**: `N8N_V3_CAPTACION_VISITAS_URL` (agregada a `.env.local` y a Vercel en los tres entornos).
- **Verificado en vivo de punta a punta**: token inválido → 404; 3 hits reales contra el pixel de "Página A" (vía `curl`) quedaron en `v3_captacion_visitas`; un `<img>` real inyectado en una página cargada en el navegador (no `curl`) contra el pixel de una tercera página de prueba se registró igual, confirmando que el mecanismo funciona desde un browser real y no solo por llamada directa al webhook. El Home mostró los conteos correctos por página, filtrados dentro del período elegido.

### Variables de entorno nuevas (agregar también a Vercel — sección 6/17)

```
N8N_V3_DASHBOARDS_URL=.../webhook/v3-dashboards
N8N_META_ADS_ESTADO_URL=.../webhook/integraciones/meta-ads-estado
N8N_V3_CAPTACION_PUNTOS_URL=.../webhook/v3-captacion-puntos
N8N_V3_LEADS_URL=.../webhook/v3-leads
N8N_V3_LEADS_HISTORIAL_URL=.../webhook/v3-leads-historial
N8N_V3_LEADS_ANALISIS_RECORRIDO_URL=.../webhook/v3-leads-analisis-recorrido
N8N_ENLACES_CORTOS_URL=.../webhook/integraciones   # base; el código agrega /generar-enlace o /resolver-enlace
N8N_V3_CAPTACION_VISITAS_URL=.../webhook/v3-captacion-visitas
META_APP_ID=                      # vacío a propósito — ver "Pendientes"
META_APP_SECRET=                  # vacío a propósito — ver "Pendientes"
NEXT_PUBLIC_META_APP_ID=          # vacío a propósito — ver "Pendientes"
META_OAUTH_STATE_SECRET=...       # sí tiene valor real, ya en Vercel
```

**Todas ya están replicadas en Vercel** (Production/Preview/Development, incluyendo `N8N_ENLACES_CORTOS_URL`/`N8N_V3_CAPTACION_VISITAS_URL`) salvo `META_APP_ID`/`META_APP_SECRET`/`NEXT_PUBLIC_META_APP_ID`, que se dejaron sin valor a propósito (ver "Conexión de Meta Ads vía Continuar con Facebook" arriba). `N8N_CAPTACION_LEAD_URL` y `NEXT_PUBLIC_CAPTACION_LEAD_URL`, que sí llegaron a existir brevemente, se **eliminaron** (ver "Endpoints enmascarados" arriba) — los endpoints públicos del embudo ya no usan variables de entorno, van todos por `/api/hooks/[...path]` + `N8N_WEBHOOK_BASE_URL` (que ya existía desde la sección 20).

### Responsive — la V3 nunca había sido probada en mobile de verdad (2026-10-02)

El usuario notó que los números grandes se cortaban contra el borde de las tarjetas en mobile y pidió una pasada de responsive sobre toda la V3. Se probó en vivo con el viewport emulado en 375px (preset "mobile") contra `cliente-prueba-draft` — dos bugs reales, no cosméticos:

- **`components/v3/KpiCard.tsx`**: el valor (`text-2xl`, sin `min-width:0` ni control de desbordamiento) se salía del borde de la tarjeta con números largos (`US$ 2.063.980`, `5100.0%`) — la tarjeta en sí no tenía `min-w-0`, y como ítem de grid eso le permitía forzar el ancho de su columna más allá del espacio disponible. Se corrigió con `min-w-0` en la tarjeta y su contenido, tamaño de fuente responsivo (`text-lg sm:text-xl lg:text-2xl`) y `break-words` en el valor — si un número es tan largo que ni reduciendo el tamaño entra en una línea, pasa a una segunda línea en vez de perder dígitos (nunca se trunca un valor numérico real). La etiqueta de arriba (ej. "FACTURACIÓN BRUTA") sí puede truncarse con `...`, es texto descriptivo, no un dato.
- **`V3Sidebar`/`V3Topbar`/`app/v3/layout.tsx`**: el sidebar solo tenía comportamiento responsivo para desktop (`md:fixed`/`md:w-...` — colapsa a modo ícono, nunca se oculta) — por debajo de `md` (768px) no tenía ningún tratamiento mobile, así que se renderizaba como un bloque normal de ancho completo, obligando a scrollear mucho antes de ver cualquier contenido real de la página. Se agregó un patrón de panel deslizable: `app/v3/layout.tsx` pasó a client component y levanta el estado `mobileNavOpen` (son hermanos, no padre-hijo, así que el estado no puede vivir en ninguno de los dos solo); `V3Topbar` gana un botón de hamburguesa (`md:hidden`) que lo abre; `V3Sidebar` gana un backdrop oscuro + un botón de cerrar (ambos `md:hidden`) y pasa de `md:fixed` a `fixed` siempre, con `-translate-x-full`/`translate-x-0` según `mobileOpen` (visible siempre en desktop vía `md:translate-x-0`). Como los links de navegación son `<a>` normales (no hay enrutado SPA que preserve el layout sin recargar), el panel se cierra solo con un `useEffect` que escucha cambios de `pathname`.
- **`app/v3/[clienteId]/conexiones/page.tsx`**: las tres tarjetas de conexión (GHL/Meta Ads/Hotmart) usaban `flex items-center justify-between` — en mobile angosto, el badge "Conectado" + los botones ("Reconectar", o "Ver webhook" + "Reconectar" en el caso de Hotmart) se salían de la pantalla por el lado derecho. Se cambió a `flex-col sm:flex-row` (apila en mobile, fila en desktop) + `flex-wrap` en el grupo de badge/botones, para que si ni apilado entran los 2-3 elementos en una fila, pasen a una segunda línea en vez de cortarse.
- **Verificado en vivo** (viewport 375×812, cliente de prueba real): Home completo (KPIs, embudo, origen del tráfico, Tendencia de Hotmart, Páginas de testeo), Conexiones, Endpoints y el form "Crear nuevo" (con el selector de páginas de testeo) — todos sin overflow horizontal ni contenido cortado; el menú hamburguesa abre/cierra y navega correctamente.
- **No se tocó**: Administrador de Anuncios (`MetaAdsTable`, tabla estilo CRM con checkboxes/switches/barra flotante) ni Análisis de Anuncios (`AdCreativeCard`) — no se llegaron a auditar en esta pasada, quedan como posible siguiente paso si el usuario lo pide.

### Leads por país y ciudad — mapa de calor + tablas con paginación (2026-10-02)

Pedido del usuario: debajo de "Páginas de testeo", un mapa de calor mundial de leads por país y, en la misma fila, dos tablas (país / ciudad) — con paginación, reusando la que ya tienen otras tablas del proyecto.

**El problema de fondo: `client_leads` nunca había guardado país/ciudad.** Esa información sí existía para los clics del acortador de enlaces (`v3_enlaces_clics.pais/ciudad`, sección "Acortador de enlaces" arriba), pero nunca se había llevado a los leads en sí. Se construyó la geolocalización real, de punta a punta:

- **`client_leads` gana `pais text`, `ciudad text`** (nullable — un lead sin geolocalizar simplemente no aparece en el mapa/tablas, nunca se inventa un país).
- **`app/api/hooks/[...path]/route.ts`**: el proxy enmascarado nunca reenviaba la IP real del visitante a n8n (n8n solo veía la IP del propio proxy). Ahora reenvía `x-forwarded-for` tal cual la puso Vercel en la request entrante — sin esto, cualquier intento de geolocalizar en el lado de n8n hubiera devuelto siempre la ubicación de nuestro propio servidor, no la del lead real.
- **`Integraciones — Captación Lead (Cliente)`** (n8n, id `p8DlcZTE8AxfU5Ri`): nuevo nodo `Captacion - Geolocalizar IP` entre `Normalizar Lead` e `Insertar` — toma la primera IP de `x-forwarded-for`, llama a `http://ip-api.com/json/{ip}?fields=status,country,city` (mismo servicio gratuito ya usado en el acortador de enlaces, timeout 2s, `onError: continueRegularOutput` — la geolocalización nunca bloquea el guardado del lead, igual que en `/r/[token]/route.ts`). `pais`/`ciudad` quedan vacíos si falla, nunca bloquean nada.
  - **Gotcha de `$json`, de nuevo — esta vez evitado a propósito**: al insertar el nodo de geolocalización entre `Normalizar Lead` e `Insertar`, el `queryReplacement` de `Insertar` ya no podía leer `$json.clienteId` etc. (eso ahora es la salida de Geolocalizar IP, no de Normalizar Lead). Se corrigió **de entrada**, sin pasar por el ciclo de romper-y-arreglar de las veces anteriores — cada valor del INSERT referencia explícitamente `$('Captacion - Normalizar Lead').item.json...` o `$('Captacion - Geolocalizar IP').item.json...`, nunca `$json` a secas.
- **Formato de los valores — confirmado contra la API real, no supuesto**: `ip-api.com` devuelve el país en **inglés** ("United States", "Spain", "Mexico" — confirmado con `curl` contra una IP real) — se guarda tal cual (mismo formato para datos reales y de demo, para que nunca haya dos buckets distintos para el mismo país). La traducción a español para mostrar en pantalla vive en el frontend (`PAIS_ES` en `components/v3/LeadsWorldMap.tsx`), nunca en la base.
- **`Leads - Listar`** (mismo patrón de siempre): agrega `pais`, `ciudad` al `SELECT`.
- **Datos de demo sembrados para los 450 leads viejos** (no se pueden geolocalizar por IP real — son leads sintéticos, nunca llegaron desde una IP de verdad): distribución creíble pesada hacia Colombia (~54%, consistente con el resto de los datos de este cliente — números en COP, teléfonos `+57`) y el resto repartido entre México/Estados Unidos/España/Argentina/Perú/Chile/Ecuador, con ciudades reales de cada país.
  - **Gotcha real de este seed — mismo tipo de error nuevo**: el primer intento usó `UPDATE ... FROM LATERAL (SELECT ... ORDER BY random() LIMIT 1)` sin que el subquery referenciara ninguna columna de la fila externa — sin esa correlación real, Postgres evaluó el `LATERAL` **una sola vez para las 450 filas**, dejándolas todas con el mismo país. Se corrigió con el patrón robusto de siempre para esto: una subquery `SELECT id, floor(random() * N)::int AS idx FROM client_leads WHERE ...` (el `random()` sí se evalúa por fila ahí, al ser parte directa del `SELECT`) y un `CASE idx WHEN ...` para mapear el índice a país/ciudad.
- **Verificado en vivo de punta a punta**: un lead real creado vía `curl` contra el proxy local con `x-forwarded-for: 190.85.12.34` (una IP colombiana real) quedó geolocalizado automáticamente como `pais: "Colombia", ciudad: "Bogotá"` — sin tocar la base a mano, todo por el flujo real.

**Frontend**:
- **`lib/v3/embudo.ts`**, nueva función `calcularGeografia(leads)` — agrupa por `pais` y por `(ciudad, pais)`, ordenado por cantidad descendente; ignora leads sin geolocalizar (no cuenta un "—" como un país real).
- **`components/v3/LeadsWorldMap.tsx`** (nuevo) — mapa choropleth con `react-simple-maps` + `d3-geo` (únicas dependencias nuevas, livianas, es exactamente la librería estándar para este caso — no una migración de sistema de diseño como las que se evaluaron y descartaron otras veces esta sesión). Topología pública `world-atlas@2/countries-110m.json` (vía CDN, mismo archivo que usa cualquier mapa choropleth de este tipo, no hay coordenadas inventadas a mano) — los nombres de país de esa topología están en inglés, confirmados contra el archivo real antes de escribir el componente (`United States of America` es el único alias real necesario; el resto — Colombia/México/España/Argentina/Perú/Chile/Ecuador — coincide tal cual). Color del degradé con los tokens de marca (`--color-primary` → `--color-secondary`, nunca los colores azules de la captura de referencia que pasó el usuario — mismo criterio de "mecanismo sí, colores no" ya aplicado toda esta sesión), zoom/pan con `ZoomableGroup` + botones `+`/`−`/`Reset`, tooltip al pasar el mouse (nombre en español + cantidad de leads).
- **`components/v3/GeoRankingTable.tsx`** (nuevo, genérico) — tabla simple con paginación (`components/ui/pagination.tsx`, el mismo componente que ya usan Base de datos/Administrador de Anuncios/Análisis de Anuncios), reusada tal cual para País y Ciudad en vez de duplicar el componente dos veces.
- **`components/v3/PaginasTesteoTable.tsx`** también ganó paginación (pedido explícito del usuario: "a todas las tablas que estamos agregando" — hasta ahora mostraba todas las páginas de testeo sin cortar, suficiente con 3 pero inconsistente con el resto).
- Montado en `app/v3/[clienteId]/page.tsx`, fila nueva debajo de "Páginas de testeo": `grid lg:grid-cols-[1.6fr_1fr_1fr]` (mapa más ancho que las dos tablas), colapsa a una columna en mobile — probado en vivo con el viewport en 375px, sin overflow.

### Corrección — `generar-enlace` se separa en dos webhooks independientes (2026-10-02)

El usuario planteó una duda válida sobre el diseño original del acortador de enlaces (sección "Acortador/trackeador de enlaces propio" arriba): un solo webhook `generar-enlace` que recibe `tipo: "clase"|"replay"` en el body se presta a confusión al configurarlo en GHL — es fácil que alguien arme el workflow de GHL sin mandar `tipo`, o con el valor equivocado, y no hay forma de notar el error desde la URL sola. Se separó en dos webhooks, cada uno con su propio `tipo` ya fijo — GHL ya no manda ni necesita saber qué es `tipo`.

- **`Integraciones — Enlaces Cortos (Cliente)`** (n8n, id `EotGQtUyd51yoWoT`): se sacaron `Enlaces - Webhook Generar`, `Enlaces - Asegurar Tablas (Generar)` y `Enlaces - Normalizar Generar` (el trío compartido) y se reemplazaron por dos ramas completas y paralelas — `Enlaces - Webhook Generar Clase` (path `integraciones/generar-enlace-clase`) y `Enlaces - Webhook Generar Replay` (path `integraciones/generar-enlace-replay`), cada una con su propia migración "ensure" (duplicada, sin parámetros, barata) y su propio nodo `Preparar` que fija `tipo: 'clase'`/`'replay'` como literal en vez de leerlo del body. Las dos ramas convergen en el mismo `Enlaces - Buscar Lead Y Destino` de siempre — el resto de la cadena (buscar lead, resolver destino, buscar/crear el enlace, responder) no se tocó.
- **Gotcha real de esta sesión, por tercera vez con la misma forma**: al borrar `Enlaces - Normalizar Generar`, dos nodos más abajo en la cadena (`Enlaces - Buscar Enlace Existente` e `Enlaces - Insertar Enlace`) seguían referenciándolo por nombre explícito (`$('Enlaces - Normalizar Generar').item.json...`) para leer `tipo`/`clienteId` — como el nodo ya no existe, esas expresiones resolvían a `undefined` **sin tirar error** (la respuesta volvía `200 OK` con `{"url": ".../r/undefined"}`, un bug silencioso, no un crash). Se corrigió haciendo que `Enlaces - Buscar Lead Y Destino` seleccione también `$1::text AS cliente_id, $4::text AS tipo` como parte de su propio `SELECT` (antes solo traía `lead_id`/`dashboard_id`/`destino_url`), así los dos nodos de más abajo tienen una única fuente consistente (`$('Enlaces - Buscar Lead Y Destino')`) sin importar cuál de las dos ramas nuevas disparó la ejecución. **Lección reforzada una vez más**: borrar o renombrar un nodo requiere grep mental de *todas* las referencias `$('<nombre>')` en el resto del workflow, no solo las del nodo inmediatamente siguiente.
- **`app/api/hooks/[...path]/route.ts`**: `ALLOWED_PATHS` cambia `"integraciones/generar-enlace"` por los dos paths nuevos.
- **`app/v3/[clienteId]/endpoints/page.tsx`**: el bloque admin-only pasa de un botón "Copiar" a dos filas ("Webhook para GHL — vio la clase" / "— vio el replay"), cada una con su propia URL. El body que GHL manda a cualquiera de los dos ahora es solo `{telefono?, correo?}` — ya no hace falta mandar `tipo`.
- **Verificado en vivo**: los dos endpoints nuevos devuelven tokens distintos para la misma persona (uno por tipo, cada uno resolviendo al destino correcto — clase vs. replay), y la idempotencia sigue funcionando (pedir el mismo tipo dos veces da el mismo token).

### Seed grande de demo — 324.723 leads reales reescalados a una muestra de 3.000 + resultados de encuesta (2026-10-02)

El usuario pidió números de demo mucho más grandes y "más reales": con los $259.779 de inversión real (ya conectada vía Meta Ads para `cliente-prueba-draft` / dashboard "Demo Presentación", id 7) como dato fijo, asumir 324.723 leads captados, de los cuales 95% entran a los grupos, 40% ven la clase, 15% ven el replay y 10% compran.

- **Se señaló antes de sembrar nada**: el Home de la V3 trae *todos* los leads del dashboard en un solo JSON y agrega todo client-side (cada KPI/tabla/gráfico recorre el array completo en el navegador) — un patrón pensado para cientos/miles de filas, no 324.723. Sembrar el número literal haría que este cliente demo se vuelva notoriamente lento, justo lo que el usuario pidió evitar explícitamente en otra parte de esta sesión ("no puede verse como errores o bugs"). Se le preguntó al usuario y eligió explícitamente: **una muestra reducida que preserva exactamente las mismas proporciones** (95/40/15/10%), no el volumen literal.
- **Escala elegida**: 3.000 leads totales para el dashboard (en vez de 324.723) — ~100x más chico, pero exactos en los porcentajes pedidos. La inversión real ($259.779) no se tocó — es un dato que ya estaba conectado, no algo que se fabrica. Consecuencia matemática directa y esperada: el CPL pasó de ~US$576 (con los 451 leads que había antes) a **US$86,59** (259.779 / 3.000) — más realista que antes, pero lejos de los ~US$0,80 que saldrían de dividir literalmente por 324.723. Es el trade-off que el usuario aceptó a cambio de que el dashboard siga siendo rápido.
- **No se borró nada de lo que ya existía** (451 leads previos, con sus datos ya verificados de Hotmart/soporte/encuesta de los Addendums anteriores) — se sumaron 2.549 leads nuevos + se completó el flag "entró al grupo" en 231 de los leads viejos que no lo tenían, para que el total combinado (viejo + nuevo) cerrara exacto en 95/40/15/10% sobre el total final de 3.000. Verificado en vivo: Registrados 3.000, Entró al grupo 2.850 (95.0%), Vieron la clase 1.200 (40.0%), Vio replay 450 (15.0%), Compraron/Ventas 300 (10.0%) — y estos números reconcilian con la tabla de "Páginas de testeo" (2.991+8+1=3.000 por punto) y con el mapa/tablas de país-ciudad (suman 3.000).
- **Mecanismo**: igual que los backfills anteriores de esta sesión — se generaron los leads en Python (nombres/correos/teléfonos variados, fecha de creación repartida en los últimos ~85 días, país/ciudad con la misma distribución ponderada ya usada en el backfill de geolocalización, utm_source/página de origen con los mismos pesos que los leads reales existentes) y se insertaron vía un `INSERT` masivo (937KB, una sola sentencia) montado temporalmente en el nodo `Captacion - Asegurar Visitas` de `Núcleo — V3 Puntos de Captación` (mismo patrón "ensure" ya usado varias veces), disparado una vez vía el webhook real `v3-captacion-puntos`, y revertido. Se precalculó todo en Python (no con `random()` dentro del SQL) para no repetir el bug de conteos no deterministas ya documentado antes en esta sesión.
- **Ventas nuevas** llevan los mismos campos que las ventas reales de Hotmart (mismo `producto`/`monto`/`moneda`/`producto_id` que ya usaba el resto de la demo) y una mezcla de `cuotas` (70% pago único, 30% repartido en 3/6/9/12 cuotas) para que "Facturación pago único vs. en cuotas" también se mueva de forma consistente y no quede desactualizada frente al nuevo total de ventas.

**Resultados de la encuesta — nueva sección en el Home** (pedido inmediatamente después, con 5 preguntas y gráficos de referencia estilo encuesta de opción múltiple): se agrega, al final del Home de Lanzamiento, una sección "Resultados de la encuesta" con un panel por pregunta (barra horizontal por opción, con `%` y conteo). El usuario pidió explícitamente que las respuestas quedaran atadas a leads reales existentes ("que sea como si las personas registradas hubieran respondido"), no como un número flotante sin dueño.

- **Las 5 preguntas son fijas** (constante `ENCUESTA_PREGUNTAS` en `lib/v3/embudo.ts`, con su texto y el orden de opciones tal cual la encuesta real, no ordenadas por frecuencia): rango de edad, situación actual, qué intentó antes, cuánto invertiría, y qué acompañamiento querría.
- **Se reutilizó el cohorte de "Encuesta" que ya existía** — los 103 leads de `cliente-prueba-draft` que ya tenían `extra.encuesta_at` seteado de antes (ver tarjeta "Encuesta" del embudo). Se les completó `extra.respuestas` (antes vacío `{}` en casi todos) con una respuesta por pregunta, generada en Python con las proporciones del ejemplo que pasó el usuario pero reescaladas a los 103 respondientes reales (ej. "55 años o más" pasa de 33.3% en la referencia a 34 de 103 acá) — mismo mecanismo de asignación aleatoria-pero-exacta que el seed grande de arriba, vía el mismo nodo "ensure" temporal. Esto significa que el número "103" de la tarjeta "Encuesta" del embudo y el "103 leads que completaron la encuesta" de esta sección nueva son, literalmente, el mismo grupo de filas — no dos números inventados por separado.
- **Frontend**: `calcularEncuesta(leads)` (nuevo, en `lib/v3/embudo.ts`) agrega `extra.respuestas` de los leads reales (excluyendo `sin_match`) contra las opciones fijas de cada pregunta. Nuevo componente `components/v3/EncuestaPreguntaPanel.tsx` — se evaluó reusar `HorizontalBarPanel` pero sus labels son de ancho fijo (`w-28 truncate`), pensado para textos cortos (país/UTM); las opciones de esta encuesta son oraciones largas, así que se armó un componente chico aparte con el label arriba (sin truncar, puede ocupar 2 líneas) y la barra+porcentaje debajo — mismo estilo visual (`bg-primary`, `bg-surface-high`) que el resto de la V3, ninguna paleta nueva.
- **Verificado en vivo** (local, `/v3/{clienteId}?dashboard=7`, filtro "Últimos 30 días" por defecto): las 5 preguntas se renderizan con los porcentajes exactos sembrados, sin overflow en mobile (375px) ni desktop.

### Respuestas de encuesta visibles por lead + marca "Alto valor" (2026-10-02)

Pedido inmediato tras la sección de encuesta anterior: que las respuestas de cada persona también se puedan ver en Base de datos (no solo agregadas en el Home), y que se identifique y destaque a quien respondió la opción de mayor disposición a invertir.

- **`lib/v3/embudo.ts`**: `obtenerRespuestasLead(lead)` centraliza el type-guard de `extra.respuestas` (reusado también dentro de `calcularEncuesta`, antes duplicado). `PREGUNTA_VALOR_ALTO = {clave: "inversion", opcion: "Más de $1.000 USD si veo mucho valor"}` + `esLeadAltoValor(lead)` — la pregunta de inversión es, por ahora, la única marcada como señal de valor; si una encuesta futura no la trae, simplemente nadie queda marcado (no se inventa una señal que no existe).
- **`components/v3/LeadEncuestaPanel.tsx`** (nuevo): modal con las 5 preguntas/respuestas de un lead puntual, mismo estilo que `LeadHistorialPanel` (que ya existía para el historial de eventos) pero sin fetch propio — las respuestas ya viajan en el lead cargado, no hace falta pedirlas aparte.
- **`app/v3/[clienteId]/base-datos/page.tsx`**: cada fila con `extra.respuestas` gana un ícono (`ClipboardList`) junto al de historial que abre el panel. El lead marcado por `esLeadAltoValor` gana un badge verde "Alto valor" junto al nombre (único badge en verde de esta tabla — los demás, "Sin match"/"Sin embudo", son neutros) — aplica tanto en "Leads captados" como en "Ventas", ya que la encuesta se responde antes de comprar o no.
- **Verificado en vivo**: de los 3 leads de la demo que respondieron "Más de $1.000 USD si veo mucho valor", los que aparecen en la tabla muestran el badge verde correctamente; el panel de respuestas abre y resalta en verde esa misma opción cuando corresponde.

### "Equipo" — el cliente invita a su propio equipo, mismo acceso completo (2026-10-02)

Primer paso de una iniciativa más grande del usuario ("algo importante que voy a agregar"): que el dueño de una cuenta pueda sumar gente de su equipo al dashboard sin pedirle a Atlas que dé de alta cada usuario a mano. Antes de construir, se confirmó con el usuario (`AskUserQuestion`) tres decisiones de alcance:

1. **Cómo entra el invitado**: reusar el sistema de invitación por link que ya existía (hasta ahora solo lo usaba un admin de Atlas para dar de alta el primer usuario de un cliente nuevo) — el invitado recibe un correo con un link, entra y elige su propia contraseña. Se descartó la opción de generar y mandar una contraseña por correo (más trabajo nuevo, sin necesidad real).
2. **Nivel de acceso**: el mismo acceso completo que quien invita — mismo `cliente_id`, mismo rol. Sin sistema de permisos granular todavía (quedaría como una iteración futura si hace falta).
3. **Límite de miembros**: sin límite por ahora.

**Hallazgo clave explorando el código antes de construir**: el modelo de datos para esto ya existía — `users (id, email, name, role, created_at)` + tabla puente `user_clients (user_id, cliente_id)`, con un workflow n8n `Núcleo — Admin de Usuarios` (id `eHPNof9bK2DIzLGg`) que ya sabía asignar/quitar un `cliente_id` a un usuario (`POST /webhook/admin/cliente-usuario`, acción `asignar`/`quitar`) — solo que todo esto estaba gateado a `session.role === "admin"` en el lado de Next.js. El trabajo real fue exponer una versión **self-service** (cualquier sesión con acceso a ese `cliente_id`, no solo admin) y agregar el único pedazo que faltaba: **listar** quién ya tiene acceso a un cliente puntual (antes solo existía un listado admin-wide de *todos* los usuarios de la plataforma).

- **n8n**: nuevo webhook `GET /webhook/v3-equipo?cliente_id=` agregado al mismo workflow `Núcleo — Admin de Usuarios` (4 nodos nuevos: `V3Equipo - Webhook Listar` → `V3Equipo - Consultar` → `V3Equipo - Responder OK`/`Error`) — `SELECT u.id, u.email, u.name, u.role, u.created_at FROM users u JOIN user_clients uc ON uc.user_id = u.id WHERE uc.cliente_id = $1`. Nueva variable `N8N_V3_EQUIPO_URL`.
- **`lib/invite.ts`**: `InvitePayload`/`signInviteToken` ganan un `redirect?: string` opcional — las invitaciones de equipo de la V3 lo setean a `/v3/{clienteId}` para que, al crear la cuenta, la persona caiga directo en el dashboard nuevo en vez del destino histórico `/panel/conexiones` (que sigue siendo el default cuando no se pasa `redirect`, para no romper el flujo admin existente). `app/api/auth/registro-invitado/route.ts` devuelve ese `redirect` en su respuesta; `app/invitacion/[token]/page.tsx` lo usa si viene.
- **`app/api/v3/equipo/route.ts`** (nuevo): GET lista el equipo de un `cliente_id` (mismo chequeo de acceso que el resto de la V3: admin o `clientesDeSesion` incluye el cliente); POST genera el invite token (con el `redirect` de arriba) y **manda el correo automáticamente** (`lib/email.ts` → `sendTeamInviteEmail`, mismo template/remitente que el de reseteo de contraseña) — no se le pide al dueño de la cuenta copiar y pegar un link a mano; DELETE reusa el webhook `admin/cliente-usuario` existente con `accion: "quitar"`, con una regla dura: **nadie puede quitarse a sí mismo** (evita que alguien se bloquee el acceso sin querer).
- **`app/api/auth/me/route.ts`**: ahora también devuelve `user_id` (antes solo `role`/`clientes`) — lo necesita el frontend de Equipo para saber cuál fila de la tabla es "vos" y no mostrarle el botón de quitar sobre sí mismo.
- **UI**: nueva página `app/v3/[clienteId]/equipo/page.tsx` — formulario de invitar por correo + tabla de miembros actuales (nombre, correo, fecha, botón quitar). Nuevo link "Equipo" en `V3Sidebar.tsx`, en el mismo bloque de "Conexiones"/"Endpoints" (que ya vive justo arriba del footer con el switch de tema — cumple el pedido explícito del usuario de posición).
- **Gotcha real de esta sesión, de testing, no de código**: al verificar el flujo en vivo se registró un usuario de prueba en una segunda pestaña del navegador — como las pestañas comparten la misma cookie de sesión (no están aisladas), el login nuevo **reemplazó la sesión en todas las pestañas**, incluida la que tenía logueada a la cuenta estándar de pruebas (`jcvv90@gmail.com`). Sin notarlo, se terminó quitando por error el acceso de esa cuenta al cliente de prueba al clickear "Quitar acceso" creyendo que se actuaba como esa cuenta. Detectado de inmediato por el resultado inesperado en pantalla, revertido llamando directo al webhook de n8n (`accion: "asignar"` para restaurar el acceso) y se borró el usuario de prueba creado. **Lección para la próxima vez que se pruebe un flujo de login/registro con múltiples "personas" en el mismo navegador**: usar pestañas con contexto aislado (o verificar explícitamente qué sesión está activa antes de una acción destructiva), no asumir que dos pestañas del mismo navegador tienen sesiones independientes.
- **Verificado en vivo de punta a punta**: invitar por correo real (Resend aceptó el envío), abrir el link de invitación, crear la cuenta → auto-login → redirigido directo a `/v3/{clienteId}` (no a `/panel/conexiones`) → el nuevo miembro aparece en la lista de "Equipo" con exactamente el mismo acceso (ve y puede operar todo igual) → el botón "Quitar acceso" no aparece sobre la propia fila de quien mira la pantalla, sea cual sea la cuenta.

### "Endpoints" se renombra a "Webhooks" + limpieza de datos de prueba (2026-10-02)

El usuario pidió un nombre más claro para la sección que antes se llamaba "Endpoints" (confunde a un cliente no técnico) — se cambió a **"Webhooks"**, que es literalmente lo que esa pantalla muestra (URLs para pegar en otra plataforma). Cambio de ruta incluido: `app/v3/[clienteId]/endpoints/` → `app/v3/[clienteId]/webhooks/` (la carpeta se movió con `git mv`), link del sidebar y textos de la página actualizados. No se tocaron los nombres internos (`V3EndpointTipo`, etc.) — es solo el nombre visible al usuario.

De paso se limpiaron de la base los leads/puntos de captación que quedaron de las pruebas en vivo de la sesión anterior (verificar que el envío a GHL se había quitado de verdad): leads `Prueba Sin Push GHL`/`Prueba Produccion Sin GHL` y puntos de captación `Prueba Sin Etiqueta GHL`/`Verificación sin GHL push`, todos en el dashboard "Demo Presentación" — el usuario los señaló explícitamente ("cosas como esa ya no van"). Se borraron vía el mismo mecanismo "ensure" temporal ya usado el resto de la sesión (nunca hay un endpoint de DELETE para puntos de captación o leads, así que no había otra forma), verificando antes los IDs exactos para no tocar ningún dato real de la demo.

**Pendiente explícito, anotado por el usuario para después**: límite de miembros de equipo y sistema de permisos granular (ver sección "Equipo" arriba) — "luego vemos lo del límite y los permisos, esto sería una tarea pendiente".

### Pill de estado reusable (`Status`) para Conectado/Conectando/No conectado (2026-10-02)

El usuario pasó un snippet de un registro shadcn (`status.tsx` con `class-variance-authority` + `radix-ui`, colores Tailwind literales `green-500`/`destructive`/`orange-500`, soporte `dark:`) pidiendo usarlo para los 3 estados de las tarjetas de Conexiones. **Se adaptó en vez de copiar tal cual**, por las mismas razones ya documentadas antes en este archivo para el gráfico de tendencia de Hotmart (rechazo de un snippet shadcn por dependencias innecesarias):

- Este proyecto **no tiene configurado `darkMode` en `tailwind.config.ts`** — el claro/oscuro se resuelve 100% vía variables CSS que pisa `ThemeSwitch` en runtime, no la clase `dark:` de Tailwind. Las clases `dark:text-green-400` del snippet original simplemente nunca se activarían acá — no son un bug visible, pero sí código muerto.
- Los colores del snippet (`green-500`, `destructive`, `orange-500`) son literales de la paleta de shadcn, no los tokens de marca (`--color-success`/`--color-error`/`--color-warning`, ver skill `vermetricas-brand`) que usa el resto de la V3 — usarlos tal cual habría introducido una paleta paralela.
- `radix-ui`/`class-variance-authority` no estaban instalados y no hacían falta — no se usa `asChild`/polimorfismo acá, un objeto de variantes simple alcanza (mismo criterio de "no instalar una dependencia nueva para algo que ya se puede hacer con lo que hay" aplicado en esta sesión varias veces).
- Las tarjetas de Conexiones (GHL/Meta Ads/Hotmart) ya tenían, repetida 3 veces a mano, casi exactamente esta misma idea (punto + `animate-ping` para "Conectado", punto gris estático para "No conectado") — lo único que faltaba de verdad era el tercer estado (**Conectando**, mientras se guarda una conexión nueva) y sacar la duplicación.

**`components/ui/status.tsx`** (nuevo, mismo patrón simple que `components/ui/pagination.tsx` — sin librería de variantes): `<Status variant="success" | "pending" | "neutral" />`. `pending` usa `animate-pulse` (no `animate-ping`) para diferenciar visualmente "efectivamente conectado, emitiendo señal" de "hay una acción en curso" — con `text-primary`/`border-primary/40`/`bg-primary/10`, reusando el patrón de opacidad sobre token que ya usa el badge "Alto valor" de Base de datos.

**`app/v3/[clienteId]/conexiones/page.tsx`**: las 6 variantes de pill repetidas a mano (conectado/no-conectado × GHL/Meta/Hotmart) se reemplazan por `<Status variant={guardando ? "pending" : conectado ? "success" : "neutral"} />`. Cambio de comportamiento aprovechado de paso: antes la fila entera (pill + botones) se ocultaba mientras el formulario de reconexión estaba abierto (`{formAbierto ? null : ...}`), perdiendo de vista si ya estabas conectado; ahora el pill queda siempre visible (solo se ocultan los botones redundantes "Reconectar"/"Ver webhook" mientras el form está abierto), así "Conectando" se ve de verdad en el momento real de guardar. Verificado en vivo: abrir "Reconectar" en GHL deja el pill "Conectado" visible sin los botones — probado sin llegar a enviar el formulario, para no pisar la conexión real guardada de la cuenta de prueba.

### Acceso por suscripción — estado de cuenta y tipo de acceso (etapa 1, 2026-10-05)

Pedido del usuario: las cuentas de clientes de Vermetricas se bloquean (no se borran) si cancelan o dejan de pagar, se reactivan al volver a pagar, y si están atrasados ven un aviso de pago pendiente. Además hay tipos de acceso asignados a mano: **vitalicio**, **prueba de 7 días** y **demo de 15 días**.

- **Base de datos** (tabla `users`, migración aplicada vía el workflow `Núcleo — Auth y Registro`, id `PeKficcJSM9S7ZeO`, nodo temporal de DDL y luego consulta permanente): `estado_cuenta` (`activa` | `pago_pendiente` | `bloqueada`, default `activa`), `tipo_acceso` (`vitalicio` | `prueba_7` | `demo_15`, default `vitalicio`) y `acceso_vence_at` (nullable). Las cuentas existentes quedan activas y vitalicias — nadie pierde acceso.
- **Login** (`Auth - Buscar Usuario` + nuevo `Auth - ¿Acceso vigente?` en el mismo workflow): si la cuenta está bloqueada o venció la prueba, responde 403 con un mensaje claro y no emite token. Si está con pago pendiente, entra normal. El token ahora incluye `estado` además de `user_id`/`role`/`clientes`.
- **Endpoint de estado** `GET /webhook/auth-estado?user_id=` (mismo workflow): lo consulta `/api/auth/me` en cada carga.
- **Decisión de cierre del hueco de sesiones abiertas** (confirmada por el usuario): opción 1 — el bloqueo se aplica en la próxima carga de página (no en cada request a la API), y la cookie bajó de 7 días a 1 día para acotar la ventana. Si `auth-estado` falla, no se bloquea a nadie (preferible a tirar a todos afuera por un blip de n8n). **Hueco conocido**: alguien con una cookie vigente que llame la API directo no queda bloqueado hasta que la cookie venza (máx. 1 día) o recargue una página de la V3 — aceptado por ahora, se revisa si hace falta endurecerlo.
- **Admin**: `POST /api/admin/cuenta-estado` (solo `role === "admin"`) → workflow `Núcleo — Admin de Usuarios` (id `eHPNof9bK2DIzLGg`, nodo `AdminCuenta - Actualizar`). Acepta `estado_cuenta`, `tipo_acceso` y calcula `acceso_vence_at` (hoy + 7 o + 15 días; vitalicio lo borra). **Todavía no hay control visual en `/admin/usuarios`** — se suma en la etapa 2 junto con el alta manual simplificada.
- **Pantalla de bloqueo** (`components/v3/EstadoCuentaGate.tsx`, usado en `app/v3/layout.tsx`): si `bloqueado` → "Tu acceso no está vigente"; si `pago_pendiente` → "Tenés un pago pendiente" con botón Salir. Los datos no se borran en ninguno de los dos casos.
- **Bug real encontrado en pruebas**: vitalicio no limpiaba `acceso_vence_at` porque la expresión de n8n usaba `||` (un texto vacío se trataba como "sin cambio"). Se cambió a `??` en `AdminCuenta - Actualizar`.
- **Verificado en vivo** contra un usuario de prueba descartable (creado y borrado en la misma prueba): bloquear → login rechazado (403) → reactivar → login OK → prueba de 7 días vencida → login rechazado → pago pendiente muestra el aviso en V3 → bloqueado muestra la pantalla de acceso vencido. La cuenta estándar de pruebas (`jcvv90`) sigue entrando normal.

### Alta manual de usuarios + correos vinculados (etapa 2, 2026-10-06)

Modelo confirmado por el usuario: **crear un usuario crea su cliente, y tienen el mismo nombre** (si se llama "Andrés", el cliente es "Andrés"). El cliente recibe un ID aleatorio único (lo genera el workflow de clientes, no el nombre). La estrategia (Lanzamiento / Webinar) la elige el cliente al crear su dashboard, así que el alta del admin ya no la pide. En la lista de usuarios se muestra el correo además del nombre, porque dos personas pueden llamarse igual.

- **Alta** (`POST /api/admin/usuario-nuevo`, botón "Crear y enviar acceso" arriba de `/admin/usuarios`): pide nombre, correo, rol (cliente / admin / check-in) y tipo de acceso. Genera una contraseña temporal de 12 caracteres, crea el usuario, crea su cliente, lo vincula, asigna el rol y el tipo de acceso, y manda el correo con la contraseña temporal (`sendTemporaryPasswordEmail` en `lib/email.ts`). Si el correo falla, el usuario igual queda creado y la pantalla lo avisa para que se le mande a mano.
- **Crear cliente en n8n** (`Gestión de Clientes`, `admin/crear-cliente`): ahora devuelve el `id` generado (antes solo `ok`), y la respuesta sale en paralelo a la creación de campañas iniciales — sin eso, con cero estrategias el flujo no respondía nunca. `/admin/clientes` ya no pide estrategias.
- **Estado y tipo de acceso por usuario** (en la misma tabla): selectores de estado (activa / pago pendiente / bloqueada) y de tipo (vitalicio / prueba 7 / demo 15), con la fecha de vencimiento visible. Usan `POST /api/admin/cuenta-estado` de la etapa 1. La lista de usuarios ahora devuelve `estado_cuenta`, `tipo_acceso`, `acceso_vence_at` y `correos_extra`.
- **Correos vinculados**: tabla nueva `user_emails_extra` (un usuario puede tener más de un correo, único en toda la plataforma). El login busca el correo en `users.email` **o** en esa tabla (`Auth - Buscar Usuario`). Acciones desde la pantalla de usuarios, vía `POST /api/admin/correos` → workflow `Núcleo — Admin de Usuarios` (`admin/correos`): **agregar** un correo extra, **quitar** uno, o **usar como principal** (el correo principal cambia; el anterior deja de entrar, no queda como extra — es lo que se decidió: "cambiar" reemplaza, "agregar" suma).
- **Bug real encontrado en pruebas**: la respuesta de `admin/correos` mostraba el estado de *antes* de la acción (las lecturas de una consulta con CTEs no ven sus propias escrituras). No afecta los datos — la pantalla recarga la lista después de cada acción — pero la respuesta no debe usarse como estado final.
- **Verificado en vivo** contra usuarios descartables (creados y borrados en la misma prueba): cadena completa del alta (usuario → cliente → vínculo → prueba 7 días con vencimiento visible en la lista), agregar correo extra y entrar con él, quitarlo y dejar de entrar, cambiar el principal y entrar con el nuevo (el anterior ya no entra). El correo de bienvenida **no se probó enviando** para no mandar correos de prueba; la pantalla de admin **no se pudo probar logueada** (no hay contraseña de admin disponible en la sesión de prueba) — queda para revisar en vivo.

### Whop — endpoint del webhook de ventas y membresías (etapa 3, parte 1, 2026-10-06)

Decisión de negocio (confirmada con John): las ventas se cobran por **Whop**, no por Hotmart. Planes mensuales, trimestrales y semestrales, con posibilidad de prueba. Hotmart no tuvo ventas y su tarjeta queda visible en Conexiones.

- **URL para pegar en Whop**: `https://www.vermetricas.com/api/whop/webhook` (POST). Es pública y pasa el middleware sin sesión (`/api/whop/webhook` en `middleware.ts`).
- **Verificación de firma** (`app/api/whop/webhook/route.ts`): estándar Standard Webhooks — HMAC-SHA256 sobre `{webhook-id}.{webhook-timestamp}.{cuerpo crudo}` con el secreto `ws_` (variable `WHOP_WEBHOOK_SECRET`), comparación en tiempo constante, y rechazo si el timestamp tiene más de 5 minutos. Como el formato exacto del secreto no está claro en la documentación resumida, se aceptan dos variantes (el texto tal cual, o su parte base64 sin prefijo): **hay que confirmar con el primer evento real de Whop**. Sin firma válida responde 401 y no guarda nada.
- **Guardado**: el endpoint reenvía el evento verificado al workflow de n8n `Integraciones — Whop Eventos` (id `Z51UQQM9MdrFvDXo`, activo). Ahí se guarda en la tabla `whop_eventos` (`webhook_id` como clave primaria, tipo, payload) con `ON CONFLICT DO NOTHING`, así un reintento de Whop con el mismo `webhook-id` no duplica nada. La lógica de crear usuario/cliente, pago pendiente y bloqueo se hace después, leyendo esta tabla (`procesado` queda en `false` hasta entonces).
- **Verificado en pruebas locales**: firma válida → 200 y guardado; firma falsa → 401; timestamp viejo → 401; sin headers → 401. Eventos de prueba enviados dos veces con el mismo id → ambos responden OK.
- **Antes de activarlo en Whop** hace falta: (1) crear el webhook en el panel de Whop con los eventos de membresía y pago, (2) copiar el secreto `ws_` que Whop muestra una sola vez, (3) cargarlo en Vercel como `WHOP_WEBHOOK_SECRET` y redeployar. Si el secreto no está, el endpoint responde 500 y Whop reintenta por varios días.

### V3 como única versión visible + usuarios en la barra lateral (2026-10-06)

- **Entrada**: el login lleva a `/v3` (antes a `/`, la versión clásica). `/` sigue existiendo como respaldo, pero nadie llega ahí por navegación. El admin cae en el primer cliente de la lista, igual que antes; si no tiene ninguno, la raíz de la V3 lo avisa.
- **Sin link a la clásica**: se sacó "Volver a la versión clásica" de la barra lateral de la V3, y el aviso de "Próximamente" ya no ofrece ir a la clásica.
- **Usuarios en la V3**: nuevo ítem "Usuarios" en la barra lateral, visible solo para admin, que abre `/v3/usuarios`. La lógica de la pantalla vive ahora en `components/v3/UsuariosAdminPanel.tsx`, compartido por la V3 y por `app/admin/usuarios` (versión vieja, respaldo). El alta de usuario se abre en un popup con el botón "+ Nuevo usuario"; al crear, el popup se cierra y la lista se recarga.
- **Verificado**: login del admin → entra a `/v3` y termina en la primera cuenta; la barra lateral muestra Dashboard y Usuarios; el popup se abre desde la pantalla de usuarios. La captura del navegador mostró la tabla "traspasando" el popup, pero en el DOM el popup es el elemento de arriba y tiene fondo sólido: es un artefacto de la captura, no del código.

### Permisos por cliente: niveles y dashboards (2026-10-06)

Cada persona-cliente tiene un **nivel** (`dueno`, `operador`, `solo_lectura`), una lista de **dashboards permitidos** (vacía = todos) y un **origen** (quién lo agregó). Viven en `user_clients`.

- **Niveles**: *Dueño* = acceso completo (como hoy). *Operador* = crea y configura (dashboards, conexiones, webhooks, leads), no gestiona el equipo. *Solo lectura* = ve, no escribe.
- **Quién gestiona el equipo**: solo el dueño invita y quita miembros.
- **Dashboards por persona**: el dueño elige cuáles ve cada miembro, al invitarlo. Solo se pueden elegir dashboards del propio cliente.
- **Servidor** (`lib/permisos.ts`, función `exigirAcceso`): en cada acción lee el nivel de la base (no del token), así un cambio aplica en la siguiente acción. Si no hay vínculo o la consulta falla, se niega. Lo usan todas las rutas de la V3 que escriben o leen por dashboard (dashboards, captación/webhooks, visitas, leads, historial, anuncios, conexiones de GHL/Hotmart/Meta, confirmación de Meta, equipo).
- **Lecturas restringidas**: los leads exigen un dashboard permitido; el historial se filtra por dashboard; la lista de dashboards se filtra; los anuncios exigen que la nomenclatura corresponda a un dashboard permitido; el **análisis de recorrido** (cruza todos los dashboards) queda solo para acceso completo.
- **Verificado en vivo** con dos miembros descartables sobre un cliente de prueba: solo lectura ve solo su dashboard, no crea ni invita; operador ve su dashboard, pasa el control de escritura, no invita. Los miembros se borraron después.
- **Pantalla (etapa 3)**: ver la sección siguiente.

### Permisos en la pantalla (etapa 3, 2026-10-06)

La pantalla consulta el nivel con `GET /api/v3/acceso?cliente_id=` (hook `components/v3/useAcceso.ts`) y oculta lo que no corresponde. El servidor sigue validando cada acción: esto es solo para no mostrar botones que terminan en error.

- **Solo lectura**: no ve Conexiones ni Webhooks en la barra lateral, no ve "Crear nuevo", no ve el formulario de invitar ni los botones de quitar miembros, no ve el Recorrido de compra (cruza todos los dashboards), no ve los interruptores de pausar anuncios, y no puede crear ni guardar enlaces en Webhooks.
- **Operador**: ve y crea todo lo que es de su alcance, excepto el equipo (invitar y quitar), que es solo del dueño.
- **Dueño**: sin cambios.
- **Selector de cliente**: ahora lo puede usar cualquier persona con más de un cliente (antes solo el admin). Así quien trabaja con varios cliente cambia de uno a otro desde la barra lateral.
- **Verificado en vivo**: con un miembro de solo lectura sobre un cliente de prueba, la barra lateral, la barra superior, Base de datos y Equipo se ven como corresponde. El usuario se borró después.
- **Pendiente**: la pantalla de Conexiones y Webhooks para solo lectura sigue mostrando los datos; solo se ocultan las acciones. Y la tabla de usuarios sigue sin versión móvil.

### Pruebas de permisos (etapa 4, 2026-10-06)

Se probaron en vivo, contra las rutas reales, cinco perfiles descartables sobre un cliente de prueba: dueño, operador con acceso completo, operador restringido a un dashboard, solo lectura con acceso completo, y solo lectura restringida a un dashboard. Resultado: **0 fallas**.

- **Dueño**: lee todo, pasa el control de escritura, y no puede quitarse a sí mismo del equipo.
- **Operador (acceso completo)**: lee todos los dashboards y el análisis de recorrido, escribe, y no puede quitar miembros (403).
- **Operador (un dashboard)**: lee solo ese dashboard (403 en los demás), la lista de dashboards muestra solo ese, y exige elegir un dashboard para ver leads.
- **Solo lectura (acceso completo)**: lee todo, y todas las escrituras dan 403 (crear dashboard, crear punto de captación, invitar).
- **Solo lectura (un dashboard)**: lee solo ese dashboard, y las escrituras dan 403.
- **Cliente ajeno**: 403 aunque la persona tenga cuenta.

Las pruebas no quedan en el repositorio; se corren con un script temporal que crea los usuarios, prueba, y los borra al final.

### Pendientes / deferred explícitamente

- **OAuth de Meta — scaffolding completo, bloqueado por un trámite externo**: todo el código está construido y en producción (ver sección dedicada arriba), pero apagado hasta que el usuario (1) cree la app en developers.facebook.com con el producto "Facebook Login for Business", (2) configure el redirect URI `https://www.vermetricas.com/api/oauth/meta/callback` y cargue las URLs de `/legal/privacidad`/`/legal/eliminar-datos`, y (3) pase el App ID/App Secret — recién ahí se activa el botón (funciona sin revisión para la cuenta del propio creador de la app, por "Standard Access") y se prepara el texto/guion del video para la revisión final de Meta (necesaria para que funcione con cuentas de clientes reales, no solo las del dueño de la app).
- **Avisar a Valentina Ortiz (Hotmart) y a John (WebinarKit) de la migración de ID de cliente** — son los dos únicos clientes con una integración basada en una URL pegada externamente; necesitan volver a copiar la URL nueva desde Conexiones (ver sección de migración de ID arriba).
- **Prueba en vivo de pausar/activar anuncios** — ver gotcha de la sección "Administrador de Anuncios" más abajo en este mismo archivo, bloqueada por el clasificador de seguridad de este asistente, pendiente de que el equipo la confirme manualmente.
- **Dashboards no filtran el Home** — el Home de la V3 no tiene ningún campo de nomenclatura de Meta; extenderlo requeriría decidir cómo nombrar/etiquetar las campañas internas de Vermetricas de forma compatible, algo no resuelto todavía.
- **Sin datos diarios/tendencia en Análisis de Anuncios** — esa pantalla no tiene una columna de sparkline (como sí tiene el dashboard de referencia que mostró el usuario) porque el pull actual solo trae totales de 30 días agregados a ese nivel; traer series diarias por anuncio multiplicaría las llamadas a Meta por cada fila del grid — se dejó fuera a propósito en vez de inventar una tendencia falsa. (El Home de Lanzamiento sí tiene su propio desglose diario, pero a nivel de cuenta/dashboard completo, no por anuncio individual — ver sección del gráfico de Desempeño por día arriba.)
- **Home de V3 para `webinar_automatizado`** sigue en placeholder "Próximamente" — no se portó el módulo del dashboard clásico en esta sesión.
- **Tipo Webinar sin funcionalidad propia** — hoy es idéntico a un dashboard normal (solo nomenclatura); qué necesita específicamente un dashboard de Webinar (asistencia, replay, etc.) no se definió todavía en esta sesión.
- **Revisar `Integraciones — Pull GoHighLevel (Cliente)` (id `aRtFZIe6q5ZrWolg`) por el mismo bug de `Authorization` duplicado** — ver el gotcha correspondiente más arriba en este archivo; no se tocó en esta sesión porque no es parte de la V3, pero comparte el mismo patrón de credencial y el mismo síntoma es de esperar ahí también.
- **Payload exacto de SendFlow (Ingreso a grupos) y de Hotmart siguen sin confirmar con un envío real** — se construyeron flexibles con los nombres de campo documentados públicamente, pendientes de ajuste fino en cuanto llegue un envío real de cada uno.
- **Wordmark del logo sin actualizar** — `vermetricas-horizontal-dark/light.png` y `vermetricas-lockup.png` siguen con el logo viejo (ver sección del logo arriba); necesitan que el usuario provea una versión nueva del wordmark completo (no solo el ícono).
- **Identidad de persona simplificada en el análisis agregado** — tanto el historial individual como el análisis agregado de recorrido matchean por correo/teléfono de forma directa (`OR` para una persona puntual, `COALESCE` para la agregación), sin resolución de identidad transitiva completa (ej. dos filas que comparten teléfono pero tienen correos distintos no se unen automáticamente en el análisis agregado) — suficiente para el volumen de datos actual, pero es una simplificación consciente, no una garantía general.
- **"Sin match" de Grupos todavía no implementado** — `Integraciones — Eventos de Embudo (Cliente)` (id `0nueiQdNQCp2qlw9`) sigue respondiendo 404 cuando el endpoint de Grupos no encuentra un lead por correo/teléfono (típico cuando SendFlow manda un número de WhatsApp distinto al de registro), en vez de guardar la fila igual marcada `sin_match: true` para poder matchearla a mano después — esta extensión quedó diseñada en el plan de la sesión pero no se tocó, el foco de 2026-10-02 fue Hotmart/Soporte/Enlaces Cortos.
- **Configuración real del workflow de GHL para `generar-enlace`, pendiente del lado del usuario/equipo Atlas, no es código**: el acortador de enlaces (sección arriba) está construido y verificado, pero ningún cliente real tiene todavía, dentro de su workflow de GHL, el paso de Webhook que llama a `generar-enlace` antes de mandar el mensaje 1a1 — hay que agregarlo manualmente en cada cliente que se active con esta feature, usando la URL que ahora se muestra en `/v3/[clienteId]/endpoints` (solo visible para admin).
- **`LeadsWorldMap`: el diccionario de alias mapa↔país solo cubre Estados Unidos** (el único caso real que afecta a este cliente hoy) — si en el futuro aparecen leads de países cuyo nombre en inglés (el que da `ip-api.com`) no coincide con el nombre en la topología del mapa (ej. Rusia, Corea del Sur, República Checa), esos países no se van a colorear en el mapa aunque sí cuenten bien en las tablas de País/Ciudad (que no dependen de la topología). Agregar el alias correspondiente a `ALIAS_MAPA_A_DATOS` cuando se dé el caso.

## 23. Administrador de Anuncios, Análisis de Anuncios y UTM del dashboard (2026-10-06)

Esta sección describe todo lo construido el 2026-10-06 en la V3. Complementa la sección 22 (que describe la V3 en general) y el resumen vigente del inicio.

### 23.1 Administrador de Anuncios (`/v3/[clienteId]/anuncios`)

**Pestañas y barra de acciones.** Las tres pestañas (Campañas, Conjuntos de anuncios, Anuncios) usan `components/v3/Tabs.tsx`, que acepta controles opcionales a la derecha (prop `acciones`) y no tiene desplazamiento vertical (`overflow-y-hidden`, para que no aparezca una barra de 1 px). A la derecha están el botón **Gráfico** (se habilita con al menos una fila seleccionada) y **Columnas**.

**Tabla (`components/v3/MetaAdsTable.tsx`).**
- La selección vive en la tabla y se avisa a la página con `onSeleccionChange`.
- La casilla aparece en todas las filas. La columna de Activo/Pausado (switch) solo aparece con permiso de escritura y solo para filas en estado `ACTIVE` o `PAUSED`.
- La barra de lote (pausar/activar seleccionados) solo actúa sobre las filas que se pueden alternar.
- Cambiar de pestaña limpia la selección y cierra la visión consolidada.

**Columnas (`lib/v3/columnas-tabla.ts`, `components/v3/PersonalizarColumnas.tsx`).**
- Métricas de **tráfico**: Gasto, Impresiones, Clics, Clics en enlace, CTR, CPM, CPC.
- Métricas de **conversión**: Leads (Meta), Ventas, ROAS, CPA.
- Categoría **Conversiones personalizadas**: una columna por cada conversión del cliente (ver 23.3).
- El popup tiene búsqueda, orden con flechas, "Restablecer", "Activar", botón de eliminar por conversión y "+ Crear conversión".
- La preferencia de columnas se guarda en el navegador, clave `vermetricas.v3.columnas-anuncios`. Es una comodidad por persona; no se comparte entre usuarios.
- `sanitizarColumnas` acepta solo claves conocidas o `conv:<id>`. Una columna guardada cuya conversión ya no existe se oculta.
- Sin dato se muestra "—" (no 0). Las campañas y conjuntos no tienen ventas ni ROAS (Meta solo los entrega a nivel anuncio).

**Filtro de fecha.** Usa `V3PeriodFilter`, el mismo componente del dashboard. Ver 23.4.

**Ver anuncio.** Cada tarjeta de anuncio tiene un botón "Ver anuncio" que abre `components/v3/VistaPreviaAnuncio.tsx`. Ver 23.5.

**Popups.** Los popups de la V3 llevan `backdrop-blur-sm` en el fondo: filtros y métricas, historial y encuesta de leads, usuarios, vista previa, columnas y crear conversión.

### 23.2 Visión consolidada (`components/v3/VisionConsolidada.tsx`)

Se abre con el botón **Gráfico** cuando hay filas seleccionadas.

- **Totales** (`lib/v3/totales-tabla.ts`): gasto, impresiones, clics, leads y ventas se suman. CTR, CPM, ROAS y CPA se calculan sobre los totales (ROAS = ingreso total / gasto de las filas con ROAS; CPA = gasto / ventas). Sin ventas, ROAS y CPA quedan en "—".
- **Gráfico diario** (`components/v3/SerieDiariaChart.tsx`): mismo estilo que "Desempeño por día" del dashboard.
  - **Barras**: una barra por métrica; la primera en el eje izquierdo y la segunda en el derecho.
  - **Línea**: área suave con degradado y puntos huecos, igual que el gráfico de tendencia de Hotmart.
  - Selector de hasta dos métricas entre nueve (gasto, impresiones, clics, leads, ventas, ROAS, CPA, CTR, CPM).
- **Anuncios de la selección**: una fila de anuncio representa ese anuncio; una campaña o conjunto representa todos los anuncios que tiene dentro. Límite de 200 anuncios por consulta.
- **Datos diarios** (`lib/v3/serie-diaria.ts`): cada día suma las cifras de los anuncios y las razones se calculan sobre esas sumas. La ruta `app/api/anuncios/meta/diario/route.ts` agrupa por cuenta publicitaria y aplica las mismas listas de acciones que el pull para leads (`lead`, `offsite_conversion.fb_pixel_custom`, `onsite_conversion.messaging_conversation_started_7d`) y ventas (`purchase`, `omni_purchase`).

### 23.3 Conversiones personalizadas (`lib/v3/conversiones.ts`)

Cada cliente puede crear conversiones que combinan dos eventos de sus leads, con un nombre propio. Se cuentan **por lead** y después se atribuyen a cada anuncio por `utm_content`. Campañas y conjuntos suman los anuncios que tienen dentro.

**Combinaciones:**
- **Y**: el lead tuvo los dos eventos.
- **Luego**: el primer evento ocurrió antes o al mismo tiempo que el segundo.
- **No**: el lead tuvo el primer evento y no el segundo.

**Eventos disponibles** (cada uno sale de un campo de `client_leads.extra` o del estado):
- Respondió la encuesta (`encuesta_at`), vio la página de gracias (`gracias_visto_at`), recibió el mensaje 1a1 (`mensaje_1a1_recibido_at`), entró al grupo (`grupo_ingresado_at`), contactó a soporte (`contacto_soporte_at`).
- Compró (`status = 'comprado'`, con `venta_at` o, si no está, `created_at`), abandonó el carrito (`carrito_abandonado_at`), tarjeta rechazada (`tarjeta_rechazada_at`), cuota pendiente (`cuota_pendiente_at`).

**Persistencia:**
- Tabla `v3_conversiones_personalizadas` (`id`, `cliente_id`, `nombre`, `config jsonb`, `created_at`, `actualizado_at`) con la misma estructura que los grupos.
- Workflow de n8n `Integraciones — Conversiones Personalizadas (Cliente)`, id `r4zalCpTDP2yvMi8`, con cuatro webhooks (listar, crear, actualizar, eliminar).
- Ruta `app/api/v3/conversiones/route.ts`: valida sesión y permiso (lectura para cualquier miembro; crear, actualizar y eliminar con escritura). Variable `N8N_V3_CONVERSIONES_URL`.
- El constructor es `components/v3/CrearConversion.tsx`: nombre, combinación, dos eventos y una frase que resume la regla.

### 23.4 Filtro de fecha en el Administrador de Anuncios

**Qué cambia.** El período elegido (Hoy, 7, 30 o 90 días, Todo el período, o Rango personalizado) viaja como `fecha_inicio` y `fecha_fin` hasta:
- La ruta `app/api/anuncios/meta/route.ts`, que pasa `time_range` al pull de n8n.
- El pull `Integraciones — Pull Meta Ads (Cliente)` (id `g3kj8LgGQP9CeCgL`): los nodos de campañas, conjuntos y anuncios usan `time_range` en lugar de `date_preset=last_30d`. El nodo de serie diaria del dashboard principal (con `time_increment`) no cambió.
- La ruta de la serie diaria, que también pasa `time_range` al workflow `Integraciones — Diario Meta Ads Anuncios (Cliente)` (id `fq6mEMqKau05PizC`).

**Rango (`lib/meta-ads/rango.ts`).**
- Sin rango, el valor por defecto son los últimos 30 días completos, sin hoy. Es el mismo equivalente de `last_30d`, así que el dashboard principal no cambia.
- Meta solo entrega cifras de hasta 37 meses atrás. El servidor recorta el inicio a 36 meses.
- "Todo el período" no trae fechas en el preset; la página pide desde 2000-01-01 y el servidor lo recorta.

**Carga.** Solo la primera carga muestra la pantalla de carga completa (`primeraCarga` es una referencia). Los cambios de período no desmontan la página, así que no se pierde la selección. Mientras Meta responde aparece "Actualizando datos de Meta…".

**Home.** El dashboard principal sigue en 30 días. Cambiarlo es otro paso.

### 23.5 Ver anuncio — vista previa de Meta

**Flujo.** `AdCreativeCard` → `VistaPreviaAnuncio.tsx` → `GET /api/anuncios/meta/vista-previa?cliente_id&ad_id` → workflow `Integraciones — Vista Previa Meta Ads (Cliente)` (id `LJca7dodTb7EMgRh`) → Graph API `/{ad_id}/previews?ad_format=DESKTOP_FEED_STANDARD` con el token del cliente.

- La ruta valida sesión, permiso de lectura y que `ad_id` sea numérico.
- Variable `N8N_META_ADS_VISTA_PREVIA_URL`.
- Quien ve la vista previa **no necesita cuenta de Meta**.

**Render.** Meta devuelve un iframe de 540 × 690 px. Vermetricas lo envuelve en un documento `srcDoc` con:
- Tamaño natural (540 px de ancho disponible, alto de 820 px para que entre el pie del anuncio).
- Una sola barra de desplazamiento vertical, la del documento. El iframe de Meta se fija con `scrolling="no"` reemplazando su valor original, no agregando otro atributo.
- Horizontal oculta.

**Por qué no el enlace al Administrador de Anuncios.** Ese enlace obliga a iniciar sesión en Facebook. La Biblioteca de Anuncios pública no mostró el anuncio al buscarlo por id.

### 23.6 Análisis de Anuncios (`/v3/[clienteId]/analisis`)

**Grupos guardados por cliente.**
- Tabla `v3_grupos_anuncios` (`id`, `cliente_id`, `nombre`, `config jsonb`, `created_at`, `actualizado_at`).
- Workflow `Integraciones — Grupos de Anuncios (Cliente)`, id `e8D08LZETDQ0FWUe`, con cuatro webhooks.
- Ruta `app/api/v3/grupos-anuncios/route.ts`. Variable `N8N_V3_GRUPOS_ANUNCIOS_URL`.
- La barra `components/v3/GruposAnuncios.tsx` muestra los predefinidos y, después de una línea separadora, los guardados. El botón "Ordenar" va en la misma fila, a la derecha; los grupos que no caben bajan de línea.
- "+ Guardar como grupo" guarda la configuración actual, con los anuncios seleccionados si se elige. "Guardar cambios en el grupo" aparece cuando la configuración difiere del grupo guardado. Eliminar pide confirmación.
- La configuración guardada incluye: `grupo`, `metricas`, `estado`, `gastoMinimo`, `campana`, `adIds`, `criterio` y `orden`.

**Criterio de leads calificados (grupo "Mejores leads").** `components/v3/CriterioLeadsPanel.tsx`.
- La pregunta sale de las respuestas reales de los leads del dashboard (`preguntasDisponibles`). Si la pregunta es una de las fijas de la encuesta muestra su texto; si no, la clave.
- Reglas:
  - **Las N de mayor monto**: el monto se lee como el número más alto del texto, con el punto como separador de miles. Los empates cuentan juntos.
  - **Monto desde**: las respuestas con monto mayor o igual al mínimo.
  - **Elegir a mano**: se marcan las respuestas tocándolas. Tocar una respuesta pasa el criterio a manual, partiendo de lo que ya estaba marcado.
- Las respuestas sin monto solo cuentan si se marcan a mano.
- Cambiar de pregunta borra las respuestas marcadas.
- El criterio se puede guardar como grupo desde el mismo panel.
- Al elegir un grupo guardado, el panel se muestra plegado con un resumen y el botón "Editar criterio".

**Cruce con anuncios.** Los leads se cruzan con cada anuncio por `utm_content`. Por anuncio se calculan: total de leads, leads calificados y porcentaje. La métrica "Leads calificados" muestra "n (x%)". El grupo ordena por porcentaje y después por total de leads.

**Filtros y métricas.** `components/v3/AnalisisFiltrosModal.tsx`: grupo, métricas (las que se muestran en cada tarjeta) y filtros de estado, campaña y gasto mínimo.

**Ordenar.** `components/v3/OrdenarAnuncios.tsx`: cualquier métrica en ascendente o descendente. Los anuncios sin dato van al final. Con "Orden del grupo" se usa el orden del grupo.

**Aviso de orden.** Si todos los anuncios empatan en la métrica del grupo, la página avisa que el orden es el de Meta, en lugar de mostrarlo como un ranking.

**Tarjetas.** `components/v3/AdCreativeCard.tsx` muestra solo las métricas elegidas y el botón "Ver anuncio" (ver 23.5). Recibe `clienteId` para pedir la vista previa.

### 23.7 UTM en el dashboard principal

- `lib/v3/embudo.ts`: `calcularUtms(leads)` y `UTM_CLAVES`. Cuenta los leads por valor de cada UTM; los leads sin valor cuentan como "(sin dato)"; excluye los leads sin match.
- Página `app/v3/[clienteId]/page.tsx`: sección debajo de país y ciudad con cinco tarjetas (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`), cada una con `GeoRankingTable` y columna "Valor".

### 23.8 Soporte y guía de Meta

- El sidebar de la V3 tiene un botón de soporte (ícono de salvavidas) que abre `/soporte`.
- La guía `/soporte/conectar-meta-ads` ahora indica el rol **Empleado** para el usuario del sistema, en lugar de Administrador. La razón: la BM de un cliente puede tener solo un cupo de Administrador, que ya puede estar ocupado. Se probó con un token real de un usuario del sistema con rol Empleado: recibió `ads_read` y `ads_management`, y no vence.

### 23.9 Variables de entorno nuevas

Agregar en `.env.local` y en Vercel (production, preview y development):
- `N8N_V3_GRUPOS_ANUNCIOS_URL`
- `N8N_V3_CONVERSIONES_URL`
- `N8N_META_ADS_VISTA_PREVIA_URL`
- `N8N_META_ADS_DIARIO_URL`

### 23.10 Workflows de n8n tocados o creados

| Workflow | Id | Qué hace |
|---|---|---|
| Integraciones — Pull Meta Ads (Cliente) | `g3kj8LgGQP9CeCgL` | Modificado: campañas, conjuntos y anuncios usan `time_range` |
| Integraciones — Diario Meta Ads Anuncios (Cliente) | `fq6mEMqKau05PizC` | Nuevo; luego modificado para `time_range` |
| Integraciones — Vista Previa Meta Ads (Cliente) | `LJca7dodTb7EMgRh` | Nuevo |
| Integraciones — Grupos de Anuncios (Cliente) | `e8D08LZETDQ0FWUe` | Nuevo |
| Integraciones — Conversiones Personalizadas (Cliente) | `r4zalCpTDP2yvMi8` | Nuevo |

Tablas nuevas en Postgres: `v3_grupos_anuncios` y `v3_conversiones_personalizadas`. Se crean solas con `CREATE TABLE IF NOT EXISTS` en el primer webhook que las usa.

### 23.11 Despliegue

- El commit `bf605c1` no generó despliegue en Vercel; el último despliegue de producción quedó en `c32f98b`.
- Se forzó un despliegue con un commit vacío (`566b644`), que sí se construyó. Después de cada push conviene revisar la lista de despliegues.

### 23.12 Gotchas de esta etapa

- **ID de cliente interno, no el slug.** Las tablas referencian `clients.id`, que es el ID largo (por ejemplo `321737bed089b0cb5ddb350b`), no el nombre legible. Con el slug, el insert falla con violación de clave foránea y el workflow responde 500 genérico.
- **PUT en n8n.** Solo se acepta `settings: { executionOrder: "v1" }`. Después de un PUT, desactivar y activar el workflow para que el webhook tome la versión nueva.
- **Meta y el rango.** Meta no entrega cifras de más de 37 meses atrás. Los rangos largos tardan varios segundos.
- **Iframe de Meta.** Trae `scrolling="yes"` y tamaño fijo de 690 px. Si se quita su desplazamiento, hay que darle alto suficiente, si no el contenido final queda cortado.
- **Atributos HTML duplicados.** Si se agrega un atributo que ya existe, el navegador usa el primero. Hay que reemplazar el valor existente.
- **`overflow-x-auto` activa el vertical.** En una fila de pestañas con un píxel de más aparece una barra vertical con flechas. Se resuelve con `overflow-y-hidden`.
- **Tokens en el chat.** Un token de Meta pegado en el chat queda expuesto. Se revoca después de la prueba (se hizo con el token de prueba).
- **Capturas de referencia de otras cuentas.** Son de otra cuenta y solo se toman como idea de diseño. No se copian nombres, campañas ni datos.
- **Ancho de página.** Con una ventana de 839 px el contenido es más ancho que la ventana, y el botón de la derecha de la fila de pestañas queda fuera de la vista. En escritorio no pasa.

### 23.13 Pendientes de esta etapa

- Configurar `utm_content={{ad.id}}` en los anuncios de cada cliente, para que el cruce con anuncios tenga datos reales.
- Extender el filtro de fecha al Home.
- Agregar "calificado" y "vio la clase" como eventos de conversión personalizada.
- Permitir editar el nombre de una conversión o de un grupo.
- Ajustar la altura de la vista previa para anuncios más altos que 820 px.
- Decidir si la barra de pausar/activar en lote se muestra solo cuando la selección es para pausar o activar.
- Revisar el ancho de la página en pantallas chicas (la fila de pestañas y la tabla se salen de la vista).
