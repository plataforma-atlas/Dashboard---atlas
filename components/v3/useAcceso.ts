"use client";

import { useEffect, useState } from "react";

export type NivelAcceso = "dueno" | "operador" | "solo_lectura";

export type AccesoCliente = {
  nivel: NivelAcceso;
  dashboards: number[] | null;
  esDueno: boolean;
  puedeEscribir: boolean;
  soloLectura: boolean;
  accesoCompleto: boolean;
  cargando: boolean;
};

// Mientras carga asume lo más restrictivo para no mostrar acciones que después
// serían rechazadas. El servidor igual valida cada acción.
const CARGANDO: AccesoCliente = {
  nivel: "solo_lectura",
  dashboards: null,
  esDueno: false,
  puedeEscribir: false,
  soloLectura: true,
  accesoCompleto: false,
  cargando: true,
};

export function useAcceso(clienteId: string | undefined): AccesoCliente {
  const [estado, setEstado] = useState<AccesoCliente>(CARGANDO);

  useEffect(() => {
    if (!clienteId) return;
    let cancelado = false;
    fetch(`/api/v3/acceso?cliente_id=${encodeURIComponent(clienteId)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { nivel: NivelAcceso; dashboards: number[] | null } | null) => {
        if (cancelado) return;
        if (!data) {
          setEstado({ ...CARGANDO, cargando: false });
          return;
        }
        const esDueno = data.nivel === "dueno";
        setEstado({
          nivel: data.nivel,
          dashboards: data.dashboards,
          esDueno,
          puedeEscribir: data.nivel !== "solo_lectura",
          soloLectura: data.nivel === "solo_lectura",
          accesoCompleto: data.dashboards === null,
          cargando: false,
        });
      })
      .catch(() => {
        if (!cancelado) setEstado({ ...CARGANDO, cargando: false });
      });
    return () => {
      cancelado = true;
    };
  }, [clienteId]);

  return estado;
}
