import { CampanaCartera } from "@/lib/webinar-os/control-center/types";
import { estadoBadgeClass, ordenPrioridad } from "@/lib/webinar-os/control-center/insights";
import { formatMoney, formatDecimal, formatNumber } from "@/lib/webinar-os/aggregate";

export default function RankingTable({ campanas }: { campanas: CampanaCartera[] }) {
  if (campanas.length === 0) {
    return <p className="text-sm text-[var(--wos-ink-faint)]">No hay campañas de webinar automático todavía.</p>;
  }

  const ordenadas = [...ordenPrioridad(campanas)].sort((a, b) => {
    const roasA = a.roas_neto ?? -Infinity;
    const roasB = b.roas_neto ?? -Infinity;
    return roasB - roasA;
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[14px]">
        <thead>
          <tr>
            <th className="text-left text-xs uppercase tracking-[0.05em] text-[var(--wos-ink-muted)] font-normal py-2.5 px-2">Campaña</th>
            <th className="text-right text-xs uppercase tracking-[0.05em] text-[var(--wos-ink-muted)] font-normal py-2.5 px-2">Ventas</th>
            <th className="text-right text-xs uppercase tracking-[0.05em] text-[var(--wos-ink-muted)] font-normal py-2.5 px-2">Facturación</th>
            <th className="text-right text-xs uppercase tracking-[0.05em] text-[var(--wos-ink-muted)] font-normal py-2.5 px-2">ROAS</th>
            <th className="text-right text-xs uppercase tracking-[0.05em] text-[var(--wos-ink-muted)] font-normal py-2.5 px-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((c) => (
            <tr key={c.campaign_id} className="border-t border-[var(--wos-border)]">
              <td className="py-3.5 px-2">
                <div className="font-semibold text-[var(--wos-ink)]">{c.campaign_name}</div>
                <div className="text-xs text-[var(--wos-ink-muted)] mt-0.5">{formatNumber(c.registros)} registros</div>
              </td>
              <td className="py-3.5 px-2 text-right tabular-nums text-[var(--wos-ink)]">{formatNumber(c.ventas)}</td>
              <td className="py-3.5 px-2 text-right tabular-nums text-[var(--wos-ink)]">{formatMoney(c.facturacion_bruta)}</td>
              <td className="py-3.5 px-2 text-right tabular-nums text-[var(--wos-ink)]">
                {c.roas_neto !== null ? `${formatDecimal(c.roas_neto)}x` : "—"}
              </td>
              <td className="py-3.5 px-2 text-right">
                <span className={`inline-block text-xs font-semibold uppercase tracking-[0.04em] rounded-full px-2.5 py-1 border whitespace-nowrap ${estadoBadgeClass(c.estado)}`}>
                  {c.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
