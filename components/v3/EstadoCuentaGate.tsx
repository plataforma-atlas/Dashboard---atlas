"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

type Estado = { bloqueado?: boolean; pago_pendiente?: boolean };

export default function EstadoCuentaGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>({});

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: Estado) => setEstado(data))
      .catch(() => setEstado({}));
  }, []);

  async function salir() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (!estado.bloqueado && !estado.pago_pendiente) return <>{children}</>;

  const bloqueado = estado.bloqueado === true;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-outline bg-surface p-6 flex flex-col gap-4">
        <span className="text-xs uppercase tracking-[0.14em] text-primary font-mono">Vermetricas</span>
        <h1 className="font-display text-xl text-on-surface font-semibold">
          {bloqueado ? "Tu acceso no está vigente" : "Tenés un pago pendiente"}
        </h1>
        <p className="text-sm text-on-surface-variant">
          {bloqueado
            ? "Tu cuenta está suspendida o tu período de prueba venció. Tus datos se conservan: al regularizar tu suscripción el acceso se reactiva."
            : "Para seguir usando el sistema tenés que regularizar tu suscripción. Tus datos se conservan."}
        </p>
        <button
          type="button"
          onClick={salir}
          className="press flex items-center justify-center gap-1.5 rounded-md border border-outline hover:border-primary text-on-surface text-[14px] font-medium px-4 py-2.5 transition-colors duration-150"
        >
          <LogOut size={14} /> Salir
        </button>
      </div>
    </div>
  );
}
