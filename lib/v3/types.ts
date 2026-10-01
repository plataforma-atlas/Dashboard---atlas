// Un "dashboard" (proyecto) por cliente en la V3 — agrupa datos por una
// nomenclatura de campaña (ver Administrador de Anúncios). A futuro puede
// extenderse a otras partes de la V3; hoy solo Anúncios lo usa.
export type V3DashboardTipo = "lanzamiento" | "webinar";

export type V3Dashboard = {
  id: number;
  nombre: string;
  tipo: V3DashboardTipo;
  nomenclatura_filtro: string | null;
  created_at: string;
};

// Un "punto de captación" es una landing/formulario específico que alimenta a un
// dashboard de tipo Lanzamiento. Cada punto trae, además de su propio endpoint
// de captación, un set fijo de endpoints hermanos para el resto del embudo —
// todos enmascarados vía /api/hooks (nunca se ve n8n), autenticados por su
// propio `token`, sin sesión.
export type V3EndpointTipo = "encuesta" | "gracias" | "grupos" | "mensaje_recibido";

export type V3PuntoEndpoint = {
  tipo: V3EndpointTipo;
  token: string;
};

export type V3CaptacionPunto = {
  id: number;
  nombre: string;
  etiqueta_ghl: string;
  token_captacion: string;
  endpoints: V3PuntoEndpoint[];
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
