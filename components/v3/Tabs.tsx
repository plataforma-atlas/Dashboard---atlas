"use client";

export type TabDef = { id: string; label: string };

export default function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-5 border-b border-outline overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`press pb-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors duration-150 ${
            active === t.id ? "border-primary text-on-surface" : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
