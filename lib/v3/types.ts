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
// dashboard de tipo Lanzamiento — cada uno tiene su propio endpoint público
// (autenticado por `token`, no por sesión) y su propia etiqueta de GHL.
export type V3CaptacionPunto = {
  id: number;
  nombre: string;
  etiqueta_ghl: string;
  token: string;
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
  status: V3LeadStatus;
  created_at: string;
};
