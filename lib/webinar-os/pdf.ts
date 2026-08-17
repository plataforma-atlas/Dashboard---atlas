import { formatByType, formatDecimal, formatMoney, formatNumber, formatPercent, toExecutiveFunnelStages, toMetaAdsTotals } from "./aggregate";
import { KPI_MODULE_CONFIGS, MODULE_ORDER, ModuleFieldConfig } from "./moduleConfigs";
import { countryFlagEmoji } from "./countryFlag";
import { WebinarDetail } from "./types";

// Módulos con componente bespoke (no están en KPI_MODULE_CONFIGS): se listan aquí solo para el PDF.
const BESPOKE_FIELDS: Partial<Record<string, ModuleFieldConfig[]>> = {
  landing: [
    { key: "visitas", label: "Visitas", format: "number" },
    { key: "leads", label: "Leads", format: "number" },
    { key: "tasa_conversion", label: "Tasa de conversión", format: "percent" },
  ],
  oferta: [
    { key: "clics_oferta", label: "Clics a oferta", format: "number" },
    { key: "checkout_iniciado", label: "Checkout iniciado", format: "number" },
    { key: "tasa_conversion", label: "Tasa de conversión", format: "percent" },
  ],
  webinar: [
    { key: "registrados", label: "Registrados", format: "number" },
    { key: "asistentes_en_vivo", label: "Asistentes en vivo", format: "number" },
    { key: "tiempo_promedio_min", label: "Tiempo promedio (min)", format: "number" },
    { key: "tasa_asistencia", label: "Tasa de asistencia", format: "percent" },
  ],
};

const MODULE_TITLES: Record<string, string> = {
  publicidad: "Publicidad",
  landing: "Landing",
  gracias: "Página de Gracias",
  nivelatorios: "Nivelatorios",
  webinar: "Webinar",
  oferta: "Oferta",
  gestion_comercial: "Gestión Comercial",
  ventas: "Ventas",
  downsell: "Downsell",
  recuperacion: "Recuperación",
  resultados: "Resultados Finales",
};

export async function generateWebinarReport(detail: WebinarDetail): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  addCoverPage(doc, detail);

  doc.addPage();
  addExecutiveSummary(doc, detail, autoTable);

  for (const key of MODULE_ORDER) {
    doc.addPage();
    addModuleTable(doc, key, detail, autoTable);
  }

  doc.addPage();
  addMetaAdsTable(doc, detail, autoTable);

  const filename = `webinar-${detail.webinar.label.replace(/\s+/g, "-").toLowerCase()}.pdf`;
  doc.save(filename);
}

function addCoverPage(doc: any, detail: WebinarDetail) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setTextColor(79, 70, 229);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("ATLAS TEAM", pageWidth / 2, 120, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.text(detail.webinar.label, pageWidth / 2, 200, { align: "center", maxWidth: pageWidth - 120 });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  const flag = countryFlagEmoji(detail.webinar.country);
  const dateStr = new Date(detail.webinar.webinar_date).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
  doc.text(`${flag}  ${detail.webinar.country}  ·  ${dateStr}`, pageWidth / 2, 240, { align: "center" });

  doc.setTextColor(156, 163, 175);
  doc.setFontSize(10);
  doc.text(`Reporte generado el ${new Date().toLocaleDateString("es-CO")}`, pageWidth / 2, pageHeight - 60, { align: "center" });
}

function addExecutiveSummary(doc: any, detail: WebinarDetail, autoTable: any) {
  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Funnel Ejecutivo", 40, 50);

  const stages = toExecutiveFunnelStages(detail.metrics);
  autoTable(doc, {
    startY: 70,
    head: [["Etapa", "Valor", "% vs. anterior"]],
    body: stages.map((s) => [s.label, formatNumber(s.value), s.dropFromPrev === null ? "—" : formatPercent(s.dropFromPrev)]),
    theme: "grid",
    headStyles: { fillColor: [79, 70, 229] },
  });
}

function addModuleTable(doc: any, key: string, detail: WebinarDetail, autoTable: any) {
  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(MODULE_TITLES[key] ?? key, 40, 50);

  const config = KPI_MODULE_CONFIGS[key as keyof typeof KPI_MODULE_CONFIGS];
  const fields = config?.fields ?? BESPOKE_FIELDS[key] ?? [];
  const raw = (detail.metrics as unknown as Record<string, Record<string, number | undefined>>)[key] ?? {};

  const body =
    fields.length > 0
      ? fields.map((f) => [f.label, formatByType(raw[f.key], f.format)])
      : [["Sin datos configurados para este módulo", ""]];

  autoTable(doc, {
    startY: 70,
    head: [["Métrica", "Valor"]],
    body,
    theme: "grid",
    headStyles: { fillColor: [79, 70, 229] },
  });
}

function addMetaAdsTable(doc: any, detail: WebinarDetail, autoTable: any) {
  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Meta Ads", 40, 50);

  const totals = toMetaAdsTotals(detail.meta_ads);
  autoTable(doc, {
    startY: 70,
    head: [["Fecha", "Inversión", "Scroll Stop", "CTR", "CPM", "CPC", "CPL", "Frecuencia"]],
    body: detail.meta_ads.map((e) => [
      new Date(e.entry_date).toLocaleDateString("es-CO"),
      formatMoney(Number(e.spend)),
      e.scroll_stop_rate ? formatPercent(Number(e.scroll_stop_rate)) : "—",
      e.ctr ? formatPercent(Number(e.ctr)) : "—",
      e.cpm ? formatMoney(Number(e.cpm)) : "—",
      e.cpc ? formatMoney(Number(e.cpc)) : "—",
      e.cpl ? formatMoney(Number(e.cpl)) : "—",
      e.frequency ? formatDecimal(Number(e.frequency)) : "—",
    ]),
    theme: "grid",
    headStyles: { fillColor: [79, 70, 229] },
    foot: totals ? [["Totales / Promedios", formatMoney(totals.spend), formatPercent(totals.scroll_stop_rate), formatPercent(totals.ctr), formatMoney(totals.cpm), formatMoney(totals.cpc), formatMoney(totals.cpl), formatDecimal(totals.frequency)]] : undefined,
    footStyles: { fillColor: [243, 244, 247], textColor: [17, 24, 39], fontStyle: "bold" },
  });
}
