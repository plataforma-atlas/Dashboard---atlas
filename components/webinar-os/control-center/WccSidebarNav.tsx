"use client";

import { useEffect, useRef, useState } from "react";

const SECTIONS = [
  { id: "resumen", label: "Resumen", icon: "⌂" },
  { id: "comercial", label: "Comercial", icon: "$" },
  { id: "chat", label: "Chat 1 a 1", icon: "◌" },
  { id: "trafico", label: "Tráfico Meta", icon: "↗" },
  { id: "embudo", label: "Embudo", icon: "⌄" },
  { id: "detalle", label: "Detalle", icon: "◉" },
];

export default function WccSidebarNav() {
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
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] whitespace-nowrap transition ${
            active === s.id ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <span className="w-6 h-6 rounded-lg bg-white/10 grid place-items-center text-[11px]">{s.icon}</span>
          <span>{s.label}</span>
        </a>
      ))}
    </nav>
  );
}
