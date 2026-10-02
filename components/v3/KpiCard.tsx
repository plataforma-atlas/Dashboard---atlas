import { type LucideIcon } from "lucide-react";

const ACCENT_BORDER: Record<"primary" | "success" | "error", string> = {
  primary: "border-t-primary",
  success: "border-t-success",
  error: "border-t-error",
};

export default function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "primary",
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: "primary" | "success" | "error";
}) {
  return (
    <div
      className={`min-w-0 bg-surface border border-outline border-t-[3px] ${ACCENT_BORDER[accent]} rounded-xl p-4 flex flex-col gap-3`}
    >
      <div className="flex items-center gap-2 text-on-surface-variant min-w-0">
        <Icon size={14} strokeWidth={2} className="shrink-0" />
        <span className="text-[11px] uppercase tracking-wide font-medium truncate">{label}</span>
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        {/* Números grandes (facturación en COP, por ejemplo) pueden tener muchos
            dígitos — se achica en mobile y, si igual no entra, pasa a una
            segunda línea en vez de cortarse (nunca se oculta un dígito real). */}
        <div className="text-lg sm:text-xl lg:text-2xl font-semibold text-on-surface tabular break-words">{value}</div>
        {sub && <div className="text-[11px] text-on-surface-faint">{sub}</div>}
      </div>
    </div>
  );
}
