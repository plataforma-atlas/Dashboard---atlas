// Un "dashboard" (proyecto) por cliente en la V3 — agrupa datos por una
// nomenclatura de campaña (ver Administrador de Anúncios). A futuro puede
// extenderse a otras partes de la V3; hoy solo Anúncios lo usa.
export type V3DashboardTipo = "lanzamiento" | "webinar";

export type V3Dashboard = {
  id: number;
  nombre: string;
  tipo: V3DashboardTipo;
  nomenclatura_filtro: string | null;
  // Un dashboard archivado sigue existiendo con todos sus datos — solo se
  // oculta del selector normal. Reversible (ver V3Topbar). Distinto de un
  // borrado real, que solo se permite cuando el dashboard no tiene leads.
  archivado: boolean;
  // URL real de destino por "tipo" de enlace corto (ver lib/v3/embudo.ts y
  // app/r/[token]/route.ts) — hoy "clase"/"replay", pero es un objeto libre
  // a propósito para poder sumar tipos nuevos sin migrar nada.
  url_enlaces: Record<string, string>;
  // Endpoints únicos del dashboard (encuesta/grupos/mensaje_recibido/gracias)
  // — uno solo por dashboard, compartido por todas sus páginas de captación.
  // Ver V3EndpointTipo: a diferencia de "visita", estos NO se duplican por
  // página (la encuesta y el webhook de grupos son los mismos sin importar
  // cuál landing haya testeado la persona).
  endpoints: V3PuntoEndpoint[];
  created_at: string;
};

// Una "página de captación" (antes "punto de captación") es una landing
// específica que se testea dentro de un dashboard de tipo Lanzamiento — la
// cantidad de páginas la elige la persona al crear el dashboard (o las va
// agregando después desde Webhooks). Cada página trae su propio endpoint de
// Captación (necesario: hay que saber cuál landing convirtió) y su propio
// pixel de Visitas (cuenta el tráfico de esa página en particular). El resto
// del embudo (Encuesta/Gracias/Grupos/Mensaje 1a1) NO vive acá — es el mismo
// para todas las páginas del dashboard, ver V3Dashboard.endpoints. Todo
// enmascarado vía /api/hooks (nunca se ve n8n), autenticado por su propio
// `token`, sin sesión.
export type V3EndpointTipo = "encuesta" | "gracias" | "grupos" | "mensaje_recibido" | "visita";

export type V3PuntoEndpoint = {
  tipo: V3EndpointTipo;
  token: string;
};

export type V3CaptacionPunto = {
  id: number;
  nombre: string;
  etiqueta_ghl: string;
  token_captacion: string;
  // Hoy solo trae "visita" (el pixel) — encuesta/gracias/grupos/mensaje se
  // movieron a V3Dashboard.endpoints.
  endpoints: V3PuntoEndpoint[];
  created_at: string;
};

// Una visita real a una página de testeo (hit del pixel propio — ver
// app/api/hooks y el endpoint "visita" en V3PuntoEndpoint). No identifica a
// la persona (se registra antes de cualquier dato de contacto), solo cuenta
// la carga de la página — ver lib/v3/embudo.ts, calcularPaginasTesteo().
export type V3CaptacionVisita = {
  id: number;
  punto_captacion_id: number;
  created_at: string;
};

export type V3LeadStatus = "lead" | "comprado";

export type V3Lead = {
  id: number;
  nombre: string | null;
  correo: string | null;
  telefono: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  pagina_origen: string | null;
  dashboard_id: number | null;
  punto_captacion_id: number | null;
  // Geolocalizados por IP al momento de la captación (ver Integraciones —
  // Captación Lead) — null si la geolocalización falló o el lead es viejo,
  // de antes de que existiera este campo.
  pais: string | null;
  ciudad: string | null;
  status: V3LeadStatus;
  extra: Record<string, unknown>;
  created_at: string;
};

// Una fila del historial completo de una persona (por correo o teléfono) a
// través de TODOS los dashboards de Lanzamiento en los que haya participado
// — a diferencia de V3Lead (que siempre se consulta ya filtrado a un
// dashboard), esto es justamente lo que permite ver el recorrido completo:
// cuántas veces se registró, en qué lanzamientos, y en cuál terminó
// comprando. dashboard_nombre viene null para ventas de Hotmart que llegan
// sin pasar por ningún punto de captación (fuera_de_embudo).
// Análisis agregado de "cuántos contactos le toma a la gente comprar",
// cruzando TODOS los dashboards del cliente (no se filtra por uno solo,
// porque el recorrido de una persona puede abarcar varios lanzamientos).
// Cada "interacción" cuenta igual que en V3LeadHistorialRow: un registro,
// cada sub-evento del embudo (encuesta/gracias/grupo/mensaje), y la propia
// compra como la última interacción de esa persona.
export type V3AnalisisRecorrido = {
  total_compradores: number;
  promedio: number | null;
  mediana: number | null;
  minimo: number | null;
  maximo: number | null;
  distribucion: { interacciones: number; cantidad: number }[];
};

export type V3LeadHistorialRow = {
  id: number;
  dashboard_id: number | null;
  dashboard_nombre: string | null;
  nombre: string | null;
  correo: string | null;
  telefono: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  status: V3LeadStatus;
  extra: Record<string, unknown>;
  created_at: string;
};
