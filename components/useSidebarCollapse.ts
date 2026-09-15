"use client";

import { useCallback, useEffect, useState } from "react";

export const SIDEBAR_WIDTH_EXPANDED = "240px";
export const SIDEBAR_WIDTH_COLLAPSED = "84px";

// El menú lateral siempre arranca expandido en cada carga/navegación — el
// colapso es solo para la sesión de vista actual, no se persiste.
export function useSidebarCollapse() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-w",
      collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED
    );
  }, [collapsed]);

  const toggleCollapsed = useCallback(() => setCollapsed((v) => !v), []);

  return { collapsed, toggleCollapsed };
}
