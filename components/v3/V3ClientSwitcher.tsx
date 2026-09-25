"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

export default function V3ClientSwitcher({
  clients,
  currentId,
}: {
  clients: { id: string; name: string }[];
  currentId?: string;
}) {
  const [query, setQuery] = useState("");

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, query]);

  return (
    <div className="absolute left-0 right-0 top-full mt-2 z-20 bg-surface-high border border-outline rounded-xl shadow-lg animate-pop-in flex flex-col overflow-hidden">
      <div className="p-2 border-b border-outline shrink-0">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-faint pointer-events-none" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente…"
            className="w-full bg-surface border border-outline rounded-lg pl-8 pr-2.5 py-1.5 text-[13px] text-on-surface placeholder:text-on-surface-faint outline-none focus:border-primary transition-colors duration-150"
          />
        </div>
      </div>

      <div className="p-1.5 max-h-60 overflow-y-auto flex flex-col gap-0.5">
        {filtrados.length === 0 && <p className="px-3 py-2 text-[13px] text-on-surface-faint">Sin resultados.</p>}
        {filtrados.map((c) => (
          <a
            key={c.id}
            href={`/v3/${c.id}`}
            className={`press block px-3 py-2 rounded-lg text-sm truncate transition-colors duration-150 ${
              c.id === currentId ? "bg-surface text-on-surface font-medium" : "text-on-surface-variant hover:text-on-surface hover:bg-surface"
            }`}
          >
            {c.name}
          </a>
        ))}
      </div>

      <div className="border-t border-outline p-1.5 shrink-0">
        <a
          href="/admin/clientes"
          className="press flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-primary hover:bg-surface transition-colors duration-150"
        >
          <Plus size={14} /> Crear cliente nuevo
        </a>
      </div>
    </div>
  );
}
