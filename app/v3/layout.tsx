"use client";

import { Suspense, useState } from "react";
import V3Sidebar from "@/components/v3/V3Sidebar";
import V3Topbar from "@/components/v3/V3Topbar";

// Shell de la V3: solo chrome (sidebar + topbar + main). Cada página hija
// resuelve su propia sesión/datos — ver plan en purrfect-humming-backus.md.
// No tocar los layouts/paginas existentes fuera de /v3.
//
// El estado de "menú mobile abierto" vive acá (no en el sidebar ni en el
// topbar) porque son hermanos, no padre-hijo — el botón que lo abre vive en
// el topbar, el panel que se abre/cierra vive en el sidebar.
export default function V3Layout({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Suspense fallback={null}>
        <V3Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      </Suspense>
      <main className="min-h-screen flex-1 md:ml-[var(--sidebar-w,240px)] transition-[margin] duration-200">
        <Suspense fallback={null}>
          <V3Topbar onOpenMobileMenu={() => setMobileNavOpen(true)} />
        </Suspense>
        {children}
      </main>
    </div>
  );
}
