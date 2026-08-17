import { formatByType } from "@/lib/webinar-os/aggregate";
import { KPI_MODULE_CONFIGS } from "@/lib/webinar-os/moduleConfigs";
import { WebinarMetrics } from "@/lib/webinar-os/types";
import ModuleShell from "./ModuleShell";
import KpiCard from "./KpiCard";
import RadialGauge from "./RadialGauge";

export default function KpiModuleSection({ moduleKey, data }: { moduleKey: keyof WebinarMetrics; data: Record<string, number | undefined> }) {
  const config = KPI_MODULE_CONFIGS[moduleKey];
  if (!config) return null;

  return (
    <ModuleShell icon={config.icon} title={config.title}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {config.fields.map((field) => {
          const value = data?.[field.key];
          if (field.variant === "gauge") {
            return (
              <RadialGauge
                key={field.key}
                label={field.label}
                value={value ?? 0}
                max={field.gaugeMax ?? 100}
                formatted={formatByType(value, field.format)}
              />
            );
          }
          return <KpiCard key={field.key} label={field.label} value={formatByType(value, field.format)} />;
        })}
      </div>
    </ModuleShell>
  );
}
