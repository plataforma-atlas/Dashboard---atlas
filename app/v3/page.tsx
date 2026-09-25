"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import VermetricasLoader from "@/components/VermetricasLoader";

type Session = { authenticated: boolean; role?: "admin" | "client"; clientes?: string[] };

// /v3 nunca se queda renderizada — solo resuelve a qué cliente mandar al usuario
// (el propio si es "client", el primero de la lista si es "admin") y redirige a
// /v3/[clienteId]. La página real vive ahí.
export default function V3Root() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [sinClientes, setSinClientes] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : { authenticated: false }))
      .then((data: Session) => setSession(data))
      .catch(() => setSession({ authenticated: false }));
  }, []);

  useEffect(() => {
    if (!session) return;
    if (!session.authenticated) {
      window.location.href = "/login";
      return;
    }

    if (session.role === "client") {
      if (session.clientes && session.clientes.length > 0) {
        router.replace(`/v3/${session.clientes[0]}`);
      } else {
        setSinClientes(true);
      }
      return;
    }

    // admin: cae en el primer cliente de la lista, igual que la versión clásica.
    fetch("/api/clientes", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const list: { id: string; name: string }[] = data.clientes ?? [];
        if (list.length > 0) router.replace(`/v3/${list[0].id}`);
        else setSinClientes(true);
      })
      .catch(() => setSinClientes(true));
  }, [session, router]);

  if (sinClientes) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h1 className="font-display text-xl text-on-surface mb-2">Sin clientes disponibles</h1>
          <p className="text-sm text-on-surface-variant">
            Tu cuenta no tiene ningún cliente vinculado todavía. Contacta a un administrador de la agencia.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <VermetricasLoader />
    </div>
  );
}
