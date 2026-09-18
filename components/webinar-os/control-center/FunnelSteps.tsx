export type FunnelStepData = {
  title: string;
  sub: string;
  value: string;
  rate: string;
};

export default function FunnelSteps({ steps }: { steps: FunnelStepData[] }) {
  return (
    <div className="flex flex-col gap-2">
      {steps.map((step, i) => (
        <div
          key={step.title}
          className="flex items-center justify-between gap-3.5 p-3 rounded-xl border border-[var(--wos-border)]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--wos-surface-alt)] grid place-items-center text-xs font-bold text-[var(--wos-ink)] shrink-0">
              {i + 1}
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-[var(--wos-ink)] truncate">{step.title}</div>
              <div className="text-xs text-[var(--wos-ink-muted)] mt-0.5 truncate">{step.sub}</div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-base font-bold text-[var(--wos-ink)] tabular-nums">{step.value}</div>
            <div className="text-xs text-[var(--wos-ink-muted)] tabular-nums">{step.rate}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
