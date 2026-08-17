import { MODULE_ORDER } from "@/lib/webinar-os/moduleConfigs";
import { WebinarMetrics } from "@/lib/webinar-os/types";

export type NavSection = "resumen" | keyof WebinarMetrics;

const MODULE_ICON: Record<keyof WebinarMetrics, string> = {
  publicidad: "📣",
  landing: "🖥️",
  gracias: "🙏",
  nivelatorios: "🎓",
  webinar: "🎥",
  oferta: "🛒",
  gestion_comercial: "📞",
  ventas: "💳",
  downsell: "🔻",
  recuperacion: "♻️",
  resultados: "🏁",
};

const MODULE_LABEL: Record<keyof WebinarMetrics, string> = {
  publicidad: "Publicidad",
  landing: "Landing",
  gracias: "Página de gracias",
  nivelatorios: "Nivelatorios",
  webinar: "Webinar",
  oferta: "Oferta",
  gestion_comercial: "Gestión comercial",
  ventas: "Ventas",
  downsell: "Downsell",
  recuperacion: "Recuperación",
  resultados: "Resultados",
};

export default function WebinarNavSidebar({ active, onSelect }: { active: NavSection; onSelect: (s: NavSection) => void }) {
  const item = (key: NavSection, icon: string, label: string, index?: number) => {
    const isActive = active === key;
    return (
      <button
        key={key}
        onClick={() => onSelect(key)}
        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${
          isActive
            ? "bg-[var(--wos-primary-soft)] text-[var(--wos-primary)] font-medium"
            : "text-[var(--wos-ink-muted)] hover:bg-[var(--wos-surface-alt)]"
        }`}
      >
        {index !== undefined && <span className="text-[11px] font-mono w-4 text-[var(--wos-ink-faint)]">{index}.</span>}
        <span className="leading-none">{icon}</span>
        <span className="truncate">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="text-[11px] uppercase tracking-[0.1em] text-[var(--wos-ink-faint)] font-medium mb-1 px-1">Navegación</div>
      {item("resumen", "🏆", "Resumen ejecutivo")}
      {MODULE_ORDER.map((key, i) => item(key, MODULE_ICON[key], MODULE_LABEL[key], i + 1))}
    </div>
  );
}
