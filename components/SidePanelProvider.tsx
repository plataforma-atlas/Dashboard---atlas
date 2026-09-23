"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type PanelKey = "configuracion" | "embudos" | "leads";

type SidePanelContextValue = {
  open: PanelKey | null;
  leadsCampaign: string | null;
  openConfiguracion: () => void;
  openEmbudos: () => void;
  openLeads: (campaign?: string) => void;
  close: () => void;
};

const SidePanelContext = createContext<SidePanelContextValue | null>(null);

export function useSidePanel() {
  const ctx = useContext(SidePanelContext);
  if (!ctx) throw new Error("useSidePanel debe usarse dentro de SidePanelProvider");
  return ctx;
}

// Estado puro, sin UI propia: cada pantalla con sidebar (Control Center,
// dashboard clasico, AppSidebar) decide como mostrar "open" — reemplazando
// su propio contenido principal, no como un overlay flotante encima.
export default function SidePanelProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<PanelKey | null>(null);
  const [leadsCampaign, setLeadsCampaign] = useState<string | null>(null);
  const pathname = usePathname();
  const close = useCallback(() => setOpen(null), []);

  // Al navegar de verdad a otra ruta, el panel abierto ya no aplica ahi.
  useEffect(() => {
    setOpen(null);
  }, [pathname]);

  return (
    <SidePanelContext.Provider
      value={{
        open,
        leadsCampaign,
        openConfiguracion: () => setOpen("configuracion"),
        openEmbudos: () => setOpen("embudos"),
        openLeads: (campaign) => {
          setLeadsCampaign(campaign ?? null);
          setOpen("leads");
        },
        close,
      }}
    >
      {children}
    </SidePanelContext.Provider>
  );
}
