import { CarteraCliente, clienteConMayorFacturacion, clienteConMayorOportunidad, ordenPrioridad } from "@/lib/webinar-os/cartera";
import { formatMoney } from "@/lib/webinar-os/aggregate";
import ClienteCard from "./ClienteCard";

export default function CarteraGrid({ cartera }: { cartera: CarteraCliente[] }) {
  if (cartera.length === 0) {
    return <p className="text-sm text-[var(--wos-ink-faint)]">No hay clientes de webinar automático todavía.</p>;
  }

  const ordenados = ordenPrioridad(cartera);
  const prioridadAlta = ordenados[0];
  const mayorOportunidad = clienteConMayorOportunidad(cartera);
  const mayorFacturacion = clienteConMayorFacturacion(cartera);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-[var(--wos-border)] bg-[var(--wos-surface-alt)] px-4 py-3.5">
          <div className="text-xs uppercase tracking-[0.08em] text-[var(--wos-ink-muted)] mb-1">Prioridad alta</div>
          <div className="text-base font-semibold text-[var(--wos-ink)]">{prioridadAlta?.cliente_name ?? "—"}</div>
        </div>
        <div className="rounded-lg border border-[var(--wos-border)] bg-[var(--wos-surface-alt)] px-4 py-3.5">
          <div className="text-xs uppercase tracking-[0.08em] text-[var(--wos-ink-muted)] mb-1">Mayor oportunidad</div>
          <div className="text-base font-semibold text-[var(--wos-ink)]">{mayorOportunidad?.cliente_name ?? "—"}</div>
        </div>
        <div className="rounded-lg border border-[var(--wos-border)] bg-[var(--wos-surface-alt)] px-4 py-3.5">
          <div className="text-xs uppercase tracking-[0.08em] text-[var(--wos-ink-muted)] mb-1">Mayor facturación</div>
          <div className="text-base font-semibold text-[var(--wos-ink)]">
            {mayorFacturacion ? `${mayorFacturacion.cliente_name} · ${formatMoney(mayorFacturacion.facturacion_bruta)}` : "—"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ordenados.map((cliente, i) => (
          <div key={cliente.cliente_id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
            <ClienteCard cliente={cliente} />
          </div>
        ))}
      </div>
    </div>
  );
}
