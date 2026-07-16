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
    <div className="flex items-center gap-1.5 rounded-full border border-stroke bg-panel p-1">
      {clients.map((c) => {
        const active = c.id === selectedId;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition ${
              active ? "bg-signal text-hull" : "text-mute hover:text-ink"
            }`}
          >
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
