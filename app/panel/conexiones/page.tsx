"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useThemeMode } from "@/components/ThemeModeProvider";
import AppSidebar from "@/components/AppSidebar";
import ConexionesBody from "@/components/panel/ConexionesBody";

export default function PanelConexionesPage() {
  const router = useRouter();
  const { mode, toggleMode } = useThemeMode();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
      const me = meRes && meRes.ok ? await meRes.json().catch(() => null) : null;
      setIsAdmin(me?.role === "admin");
    })();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <AppSidebar active="conexiones" isAdmin={isAdmin} mode={mode} onToggleMode={toggleMode} onLogout={handleLogout} />
      <main className="min-h-screen px-4 py-8 md:px-8 md:ml-[var(--sidebar-w,240px)] bg-background transition-[margin] duration-200">
        <Suspense fallback={null}>
          <ConexionesBody />
        </Suspense>
      </main>
    </div>
  );
}
