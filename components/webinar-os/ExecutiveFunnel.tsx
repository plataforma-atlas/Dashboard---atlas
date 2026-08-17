import { toExecutiveFunnelStages } from "@/lib/webinar-os/aggregate";
import { WebinarMetrics } from "@/lib/webinar-os/types";
import ModuleShell from "./ModuleShell";
import FunnelBars from "./FunnelBars";

export default function ExecutiveFunnel({
  metrics,
  real,
}: {
  metrics: WebinarMetrics;
  real?: { totalLeads: number; totalCompras: number };
}) {
  const stages = toExecutiveFunnelStages(metrics, real);
  return (
    <ModuleShell icon="🎯" title="Funnel Ejecutivo">
      <FunnelBars stages={stages} />
    </ModuleShell>
  );
}
