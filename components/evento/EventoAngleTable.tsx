import { EventoAngleStat } from "@/lib/evento/types";
import { formatPercent } from "@/lib/webinar-os/aggregate";

export default function EventoAngleTable({ stats }: { stats: EventoAngleStat[] }) {
  if (stats.length === 0) {
    return <p className="text-sm text-[var(--wos-ink-faint)]">Sin registros todavía.</p>;
  }

  const max = Math.max(1, ...stats.map((s) => s.registros));
  const lider = stats[0];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-separate border-spacing-y-1.5 min-w-[640px]">
        <thead>
          <tr className="text-[10px] uppercase tracking-[0.06em] text-[var(--wos-ink-faint)]">
            <th className="text-left px-2 pb-1">Ángulo</th>
            <th className="text-left px-2 pb-1">Registros</th>
            <th className="text-right px-2 pb-1">Se unió a WP</th>
            <th className="text-right px-2 pb-1">Check-in</th>
            <th className="text-right px-2 pb-1">Confirmados</th>
            <th className="text-right px-2 pb-1">Conv. registro → confirmado</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => {
            const widthPct = Math.max(4, (s.registros / max) * 100);
            const esLider = lider.registros > 0 && s.campaignId === lider.campaignId;
            return (
              <tr key={s.campaignId} className="bg-[var(--wos-surface)] border border-[var(--wos-border)]">
                <td className="px-3 py-2.5 rounded-l-lg text-[var(--wos-ink)] font-medium">
                  <div className="flex items-center gap-2">
                    {esLider && <span title="Mejor conversión" className="text-[var(--wos-primary)]">★</span>}
                    <span className="truncate">{s.campaignName}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 min-w-[160px]">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--wos-ink)] tabular-nums w-8">{s.registros}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--wos-surface-alt)] overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--wos-primary)]" style={{ width: `${widthPct}%` }} />
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right text-[var(--wos-ink)] tabular-nums">{s.llegaronWp}</td>
                <td className="px-3 py-2.5 text-right text-[var(--wos-ink)] tabular-nums">{s.checkins}</td>
                <td className="px-3 py-2.5 text-right text-[var(--wos-ink)] tabular-nums font-semibold">{s.confirmados}</td>
                <td className="px-3 py-2.5 rounded-r-lg text-right text-[var(--wos-ink-muted)] tabular-nums">
                  {formatPercent(s.conversionConfirmado ?? undefined)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
