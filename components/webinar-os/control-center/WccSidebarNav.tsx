"use client";

import { useEffect, useRef, useState } from "react";
import { Home, DollarSign, MessageCircle, TrendingUp, Filter, LayoutList } from "lucide-react";

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
  }, []);

  return (
    <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible">
      {SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          title={s.label}
          className={`press flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm whitespace-nowrap transition-colors duration-150 ${
            collapsed ? "justify-center" : ""
          } ${active === s.id ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}
        >
          <span className="w-6 h-6 rounded-lg bg-white/10 grid place-items-center shrink-0">
            <s.Icon size={13} strokeWidth={2} />
          </span>
          {!collapsed && <span>{s.label}</span>}
        </a>
      ))}
    </nav>
  );
}
