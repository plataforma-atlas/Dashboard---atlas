"use client";

import { createContext, Suspense, useCallback, useContext, useEffect, useState } from "react";
import { X } from "lucide-react";
import ConexionesBody from "@/components/panel/ConexionesBody";
import EmbudosBody from "@/components/panel/EmbudosBody";

type PanelKey = "configuracion" | "embudos";

type SidePanelContextValue = {
  open: PanelKey | null;
  openConfiguracion: () => void;
  openEmbudos: () => void;
  close: () => void;
};

const SidePanelContext = createContext<SidePanelContextValue | null>(null);

export function useSidePanel() {
  const ctx = useContext(SidePanelContext);
  if (!ctx) throw new Error("useSidePanel debe usarse dentro de SidePanelProvider");
  return ctx;
}

const TITLES: Record<PanelKey, string> = {
  configuracion: "Configuración",
  embudos: "Embudos",
};

export default function SidePanelProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<PanelKey | null>(null);
  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  return (
    <SidePanelContext.Provider
      value={{ open, openConfiguracion: () => setOpen("configuracion"), openEmbudos: () => setOpen("embudos"), close }}
    >
      {children}

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={close}
            className="animate-fade-in-up absolute inset-0 bg-black/50"
            style={{ animationDuration: "200ms" }}
          />
          <div
            className="animate-pop-in relative ml-auto md:ml-[var(--sidebar-w,240px)] w-full md:w-[calc(100%-var(--sidebar-w,240px))] h-full bg-background border-l border-outline overflow-y-auto"
            style={{ animationDuration: "220ms" }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-4 py-3 md:px-8 bg-background/95 backdrop-blur border-b border-outline">
              <span className="text-sm font-medium text-on-surface">{TITLES[open]}</span>
              <button
                onClick={close}
                aria-label="Cerrar"
                title="Cerrar"
                className="press w-8 h-8 rounded-lg bg-surface-high hover:bg-outline grid place-items-center text-on-surface-variant hover:text-on-surface transition-colors duration-150 shrink-0"
              >
                <X size={15} strokeWidth={2} />
              </button>
            </div>
            <div className="px-4 py-6 md:px-8">
              <Suspense fallback={null}>{open === "configuracion" ? <ConexionesBody /> : <EmbudosBody />}</Suspense>
            </div>
          </div>
        </div>
      )}
    </SidePanelContext.Provider>
  );
}
