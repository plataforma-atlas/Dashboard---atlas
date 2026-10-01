"use client";

import { useEffect, useState } from "react";
import { X, UserPlus, ClipboardList, PartyPopper, Users, MessageCircle, ShoppingCart } from "lucide-react";
import { V3LeadHistorialRow } from "@/lib/v3/types";
import { formatMoneyEnMoneda } from "@/lib/v3/format";
import VermetricasLoader from "@/components/VermetricasLoader";

type EventoTipo = "registro" | "encuesta" | "gracias" | "grupo" | "mensaje" | "compra";

type Evento = {
  tipo: EventoTipo;
  fecha: string;
  dashboardNombre: string | null;
  detalle?: string;
};

const ICONO: Record<EventoTipo, React.ElementType> = {
  registro: UserPlus,
  encuesta: ClipboardList,
  gracias: PartyPopper,
  grupo: Users,
  mensaje: MessageCircle,
  compra: ShoppingCart,
};

const ETIQUETA: Record<EventoTipo, string> = {
  registro: "Se registró",
  encuesta: "Completó la encuesta",
  gracias: "Vio la página de gracias",
  grupo: "Ingresó al grupo",
  mensaje: "Recibió el mensaje 1 a 1",
  compra: "Compró",
};

function aFechaTexto(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Cada fila de client_leads es UN registro a UN dashboard/lanzamiento — pero
// esa misma fila ya trae, mezclados en extra, los sub-eventos de todo su
// embudo (encuesta/gracias/grupo/mensaje) con su propio timestamp. Acá se
// "aplanan" todas las filas de la persona (ya ordenadas por created_at desde
// el backend) en una sola línea de tiempo con un evento por cada cosa que
// pasó, sin importar en qué lanzamiento haya sido.
function aplanarEventos(filas: V3LeadHistorialRow[]): Evento[] {
  const eventos: Evento[] = [];
  for (const fila of filas) {
    const dashboardNombre = fila.dashboard_nombre;
    eventos.push({ tipo: "registro", fecha: fila.created_at, dashboardNombre });

    const encuestaAt = fila.extra?.encuesta_at;
    if (typeof encuestaAt === "string") eventos.push({ tipo: "encuesta", fecha: encuestaAt, dashboardNombre });

    const graciasAt = fila.extra?.gracias_visto_at;
    if (typeof graciasAt === "string") eventos.push({ tipo: "gracias", fecha: graciasAt, dashboardNombre });

    const grupoAt = fila.extra?.grupo_ingresado_at;
    if (typeof grupoAt === "string") eventos.push({ tipo: "grupo", fecha: grupoAt, dashboardNombre });

    const mensajeAt = fila.extra?.mensaje_1a1_recibido_at;
    if (typeof mensajeAt === "string") eventos.push({ tipo: "mensaje", fecha: mensajeAt, dashboardNombre });

    if (fila.status === "comprado") {
      const monto = typeof fila.extra?.monto === "number" ? fila.extra.monto : null;
      const moneda = typeof fila.extra?.moneda === "string" ? fila.extra.moneda : "USD";
      const producto = typeof fila.extra?.producto === "string" ? fila.extra.producto : null;
      const ventaAt = typeof fila.extra?.venta_at === "string" ? fila.extra.venta_at : fila.created_at;
      const detalle = [producto, monto !== null ? formatMoneyEnMoneda(monto, moneda) : null].filter(Boolean).join(" · ");
      eventos.push({ tipo: "compra", fecha: ventaAt, dashboardNombre, detalle: detalle || undefined });
    }
  }
  return eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export default function LeadHistorialPanel({
  clienteId,
  correo,
  telefono,
  onClose,
}: {
  clienteId: string;
  correo: string | null;
  telefono: string | null;
  onClose: () => void;
}) {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);
    const qs = new URLSearchParams({ cliente_id: clienteId });
    if (correo) qs.set("correo", correo);
    if (telefono) qs.set("telefono", telefono);
    fetch(`/api/v3/leads/historial?${qs.toString()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((body: { historial?: V3LeadHistorialRow[]; error?: string }) => {
        if (cancelado) return;
        if (body.error) {
          setError(body.error);
          return;
        }
        setEventos(aplanarEventos(body.historial ?? []));
      })
      .catch(() => {
        if (!cancelado) setError("No se pudo conectar al servidor");
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [clienteId, correo, telefono]);

  const indiceCompra = eventos.findIndex((e) => e.tipo === "compra");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="animate-fade-in-up relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-surface border border-outline rounded-2xl shadow-lg p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[15px] font-semibold text-on-surface">Historial de contacto</h3>
            <p className="text-[13px] text-on-surface-variant">{correo || telefono}</p>
          </div>
          <button type="button" onClick={onClose} className="press text-on-surface-faint hover:text-on-surface shrink-0">
            <X size={18} />
          </button>
        </div>

        {cargando ? (
          <div className="py-10 flex items-center justify-center">
            <VermetricasLoader />
          </div>
        ) : error ? (
          <p className="text-sm text-error">{error}</p>
        ) : eventos.length === 0 ? (
          <p className="text-sm text-on-surface-faint">No se encontró historial para este contacto.</p>
        ) : (
          <>
            <p className="text-[13px] text-on-surface-variant">
              {eventos.length} {eventos.length === 1 ? "interacción registrada" : "interacciones registradas"}
              {indiceCompra >= 0 && ` · compró en la interacción Nº ${indiceCompra + 1}`}
            </p>

            <ol className="flex flex-col gap-0">
              {eventos.map((evento, i) => {
                const Icono = ICONO[evento.tipo];
                const esCompra = evento.tipo === "compra";
                return (
                  <li key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center ${
                          esCompra ? "bg-success/15 border-success text-success" : "bg-surface-high border-outline text-on-surface-variant"
                        }`}
                      >
                        <Icono size={14} />
                      </div>
                      {i < eventos.length - 1 && <div className="w-px flex-1 bg-outline my-1" />}
                    </div>
                    <div className="pb-5">
                      <p className={`text-[13px] font-medium ${esCompra ? "text-success" : "text-on-surface"}`}>{ETIQUETA[evento.tipo]}</p>
                      {evento.detalle && <p className="text-[12px] text-on-surface-variant">{evento.detalle}</p>}
                      <p className="text-[12px] text-on-surface-faint">
                        {evento.dashboardNombre ? `${evento.dashboardNombre} · ` : ""}
                        {aFechaTexto(evento.fecha)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}
