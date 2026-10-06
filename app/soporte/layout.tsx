"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Link2, Users, ShoppingCart, Radio } from "lucide-react";

type ItemGuia = { href: string; label: string; icono: React.ElementType; disponible: boolean };
type Categoria = { titulo: string; items: ItemGuia[] };

const SOPORTE_NAV: Categoria[] = [
  {
    titulo: "Conectar fuentes de datos",
    items: [
      { href: "/soporte/conectar-meta-ads", label: "Meta Ads", icono: Link2, disponible: true },
      { href: "/soporte/conectar-ghl", label: "Go High Level", icono: Users, disponible: false },
      { href: "/soporte/conectar-hotmart", label: "Hotmart", icono: ShoppingCart, disponible: false },
      { href: "/soporte/conectar-clasespecial", label: "ClaseEspecial", icono: Radio, disponible: false },
    ],
  },
];

function SidebarContenido({ pathname, onNavegar }: { pathname: string; onNavegar?: () => void }) {
  return (
    <>
      <div className="pb-4 border-b border-outline flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/vermetricas-icon.png" alt="" className="w-9 h-9 rounded-xl shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-on-surface truncate">Vermetricas</div>
          <div className="text-[11px] text-on-surface-faint truncate">Centro de soporte</div>
        </div>
      </div>

      <nav className="flex flex-col gap-4">
        {SOPORTE_NAV.map((cat) => (
          <div key={cat.titulo} className="flex flex-col gap-1">
            <span className="px-3 text-[11px] uppercase tracking-[0.08em] text-on-surface-faint font-medium">{cat.titulo}</span>
            {cat.items.map((item) => {
              const Icono = item.icono;
              const activo = pathname === item.href;
              if (!item.disponible) {
                return (
                  <span
                    key={item.href}
                    title="Próximamente"
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm min-w-0 text-on-surface-faint/60 cursor-default"
                  >
                    <span className="w-6 h-6 rounded-lg bg-surface-high text-on-surface-faint grid place-items-center shrink-0">
                      <Icono size={13} strokeWidth={2} />
                    </span>
                    <span className="truncate">{item.label}</span>
                    <span className="ml-auto text-[10px] shrink-0">Pronto</span>
                  </span>
                );
              }
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={onNavegar}
                  className={`press flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm min-w-0 transition-colors duration-150 ${
                    activo ? "bg-surface-high text-on-surface" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high"
                  }`}
                >
                  <span className="w-6 h-6 rounded-lg bg-primary/20 text-primary grid place-items-center shrink-0">
                    <Icono size={13} strokeWidth={2} />
                  </span>
                  <span className="truncate">{item.label}</span>
                </a>
              );
            })}
          </div>
        ))}
      </nav>
    </>
  );
}

export default function SoporteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="min-h-screen bg-background text-on-surface md:flex">
      <aside className="hidden md:flex md:w-[240px] md:fixed md:inset-y-0 md:left-0 md:h-screen bg-surface border-r border-outline p-5 flex-col gap-4 overflow-y-auto">
        <SidebarContenido pathname={pathname} />
      </aside>

      <div className="md:hidden sticky top-0 z-20 bg-surface border-b border-outline px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/vermetricas-icon.png" alt="" className="w-7 h-7 rounded-lg" />
          <span className="text-sm font-semibold text-on-surface">Soporte</span>
        </div>
        <button onClick={() => setMenuAbierto(true)} className="press text-on-surface-variant" aria-label="Abrir menú">
          <Menu size={20} />
        </button>
      </div>

      {menuAbierto && (
        <div className="md:hidden fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuAbierto(false)} />
          <div className="animate-fade-in-up absolute left-0 top-0 bottom-0 w-[280px] bg-surface border-r border-outline p-5 flex flex-col gap-4 overflow-y-auto">
            <button onClick={() => setMenuAbierto(false)} className="press self-end text-on-surface-variant" aria-label="Cerrar menú">
              <X size={18} />
            </button>
            <SidebarContenido pathname={pathname} onNavegar={() => setMenuAbierto(false)} />
          </div>
        </div>
      )}

      <main className="flex-1 md:ml-[240px] min-w-0">{children}</main>
    </div>
  );
}
