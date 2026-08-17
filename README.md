# Dashboard de Lanzamiento — Método Floppy

Dashboard en Next.js que muestra el embudo de conversión (registro → webinar → tripwire → método),
consumiendo el webhook de n8n conectado a Postgres.

## Correr localmente

```bash
npm install
npm run dev
```

Abre http://localhost:3000

Si `N8N_WEBHOOK_URL` no está configurada, el dashboard muestra datos de ejemplo
automáticamente (mismo formato que el query real) para poder revisar el diseño
sin depender del webhook.

## Conectar el webhook real de n8n

1. En n8n, **activa el workflow** (toggle "Active"). Esto genera la URL de
   producción con `/webhook/` en vez de `/webhook-test/`.
2. Copia esa URL de producción.
3. En `.env.local` (local) y en Vercel → Settings → Environment Variables (producción),
   define:
   ```
   N8N_WEBHOOK_URL=https://tu-instancia-n8n.com/webhook/obtener-embudo
   ```
4. El endpoint interno `/api/funnel` hace de proxy: el navegador nunca llama a n8n
   directamente, siempre pasa por tu propio backend en Vercel. Esto evita problemas
   de CORS y no expone la URL del webhook en el código del cliente.

## ⚠️ Pendiente importante: SQL injection en el query de n8n

El query actual en el nodo "Consulta BD *Query" interpola los filtros de fecha y país
directamente como texto dentro del SQL (`{{ $json.query.pais }}`). Como este webhook
queda expuesto públicamente, se recomienda cambiar a **Query Parameters** del nodo
Postgres en n8n antes de usarlo en producción con clientes reales:

```sql
SELECT ...
WHERE fecha >= COALESCE($1::date, '2000-01-01')
  AND fecha <= COALESCE($2::date, '2099-12-31')
  AND ($3 = '' OR country = $3)
GROUP BY sort_order, stagename, utm_source, country
ORDER BY sort_order, utm_source;
```

Con los parámetros `{{ $json.query.fecha_inicio }}, {{ $json.query.fecha_fin }}, {{ $json.query.pais }}`
en el campo "Query Parameters" del nodo (no dentro del SQL).

## Deploy en Vercel

```bash
npm i -g vercel
vercel
```

O conecta el repo de GitHub directamente desde el dashboard de Vercel.
No olvides configurar `N8N_WEBHOOK_URL` en las variables de entorno del proyecto
en Vercel (Production, Preview y Development si aplica).

## Estructura

```
app/
  api/funnel/route.ts   → proxy server-side hacia el webhook de n8n
  page.tsx               → dashboard principal (client component)
  layout.tsx              → tipografías y metadata
components/
  KpiCards.tsx             → tarjetas de métricas (registros, ingresos, conversión, ticket)
  LaunchFunnel.tsx          → visualización del embudo por etapas
  CountryBarChart.tsx        → registros por país (recharts)
  SourceTable.tsx             → ingresos por fuente UTM
  FiltersBar.tsx               → filtros de fecha y país
lib/
  types.ts                      → tipos que reflejan el shape del query de n8n
  aggregate.ts                    → transforma filas crudas en datos para cada gráfico
  mock-data.ts                     → datos de ejemplo para desarrollo sin webhook
```

## Multi-cliente (siguiente paso)

Este proyecto está armado para un solo lanzamiento/tabla (`leads_lanzamiento_floppy`).
Para replicarlo a otros clientes, lo más simple es:
- Duplicar el proyecto y cambiar `N8N_WEBHOOK_URL` por el webhook de ese cliente, o
- Parametrizar `/api/funnel` con un `cliente_id` que el workflow de n8n use para
  elegir la tabla/subcuenta correcta (recomendado si van a ser muchos clientes).
