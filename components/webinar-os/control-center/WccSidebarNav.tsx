"use client";

import { useEffect, useRef, useState } from "react";
import { Home, DollarSign, MessageCircle, TrendingUp, Filter, LayoutList } from "lucide-react";
import { useSidePanel } from "@/components/SidePanelProvider";

const SECTIONS = [
  { id: "resumen", label: "Resumen", Icon: Home },
  { id: "comercial", label: "Comercial", Icon: DollarSign },
  { id: "chat", label: "Chat 1 a 1", Icon: MessageCircle },
  { id: "trafico", label: "Tráfico Meta", Icon: TrendingUp },
  { id: "embudo", label: "Embudo", Icon: Filter },
  { id: "detalle", label: "Detalle", Icon: LayoutList },
];

export default function WccSidebarNav({ collapsed = false }: { collapsed?: boolean }) {
  const [active, setActive] = useState("resumen");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const { open, close } = useSidePanel();

  useEffect(() => {
    const sections = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-25% 0px -60% 0px" }
    );
    sections.forEach((s) => observerRef.current?.observe(s));
    return () => observerRef.current?.disconnect();
  }, [open]);

  return (
    <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible">
      {SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          title={s.label}
          onClick={(e) => {
            if (!open) return;
            // El panel de Configuracion/Embudos reemplaza este contenido -
            // hay que cerrarlo primero y recien despues saltar a la seccion,
            // una vez que vuelva a existir en el DOM.
            e.preventDefault();
            close();
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                document.getElementById(s.id)?.scrollIntoView();
              });
            });
          }}
          className={`press flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm whitespace-nowrap transition-colors duration-150 ${
            collapsed ? "justify-center" : ""
          } ${!open && active === s.id ? "bg-surface-high text-on-surface" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high"}`}
        >
          <span className="w-6 h-6 rounded-lg bg-surface-high grid place-items-center shrink-0">
            <s.Icon size={13} strokeWidth={2} />
          </span>
          {!collapsed && <span>{s.label}</span>}
        </a>
      ))}
    </nav>
  );
}
