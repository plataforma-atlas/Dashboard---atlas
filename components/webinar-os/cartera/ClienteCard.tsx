import Link from "next/link";
import { CarteraCliente, estadoBadgeClass } from "@/lib/webinar-os/cartera";
import { formatMoney, formatDecimal, formatPercent } from "@/lib/webinar-os/aggregate";

export default function ClienteCard({ cliente }: { cliente: CarteraCliente }) {
  return (
    <Link
      href={`/webinar-os/control-center/${cliente.cliente_id}`}
      className="rounded-xl border border-[var(--wos-border)] bg-[var(--wos-surface)] shadow-[var(--wos-shadow)] p-5 flex flex-col gap-4 hover:border-[var(--wos-primary)] transition"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg text-[var(--wos-ink)] font-semibold">{cliente.cliente_name}</h3>
        <span className={`shrink-0 text-[11px] font-semibold uppercase tracking-[0.06em] rounded-full px-2.5 py-1 border whitespace-nowrap ${estadoBadgeClass(cliente.estado)}`}>
          {cliente.estado}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--wos-ink-muted)] mb-1">Facturación bruta</div>
          <div className="text-base font-semibold text-[var(--wos-ink)] tabular-nums">{formatMoney(cliente.facturacion_bruta)}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--wos-ink-muted)] mb-1">ROAS neto</div>
          <div className="text-base font-semibold text-[var(--wos-ink)] tabular-nums">
            {cliente.roas_neto !== null ? `${formatDecimal(cliente.roas_neto)}x` : "—"}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--wos-ink-muted)] mb-1">Ventas</div>
          <div className="text-sm text-[var(--wos-ink-muted)] tabular-nums">{cliente.ventas}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--wos-ink-muted)] mb-1">Asistencia</div>
          <div className="text-sm text-[var(--wos-ink-muted)] tabular-nums">
            {cliente.asistentes !== null ? formatPercent(cliente.asistentes) : "—"}
          </div>
        </div>
      </div>

      <div className="text-[11px] text-[var(--wos-primary)] font-semibold mt-auto pt-1">Ver Control Center →</div>
    </Link>
  );
}
