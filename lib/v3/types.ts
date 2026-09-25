// Un "dashboard" (proyecto) por cliente en la V3 — agrupa datos por una
// nomenclatura de campaña (ver Administrador de Anúncios). A futuro puede
// extenderse a otras partes de la V3; hoy solo Anúncios lo usa.
export type V3Dashboard = {
  id: number;
  nombre: string;
  nomenclatura_filtro: string | null;
  created_at: string;
};
