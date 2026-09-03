"use client";

import { ClientConfig } from "@/lib/clients";

export default function ClientSelector({
  clients,
  selectedId,
  onSelect,
}: {
  clients: ClientConfig[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-outline bg-surface p-1">
      {clients.map((c) => {
        const active = c.id === selectedId;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition ${
              active ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
