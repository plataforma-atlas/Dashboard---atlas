import { Campaign } from "@/lib/types";

export default function VslSelector({
  vslCampaigns,
  selectedId,
  onSelect,
}: {
  vslCampaigns: Campaign[];
  selectedId: number | "all";
  onSelect: (id: number | "all") => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs uppercase tracking-[0.1em] text-[var(--wos-ink-faint)]">VSL</label>
      <select
        value={selectedId}
        onChange={(e) => onSelect(e.target.value === "all" ? "all" : Number(e.target.value))}
        className="bg-[var(--wos-surface)] border border-[var(--wos-border)] rounded-md px-2.5 py-1.5 text-[14px] text-[var(--wos-ink)] focus:border-[var(--wos-primary)] outline-none min-w-[220px] transition-colors duration-150"
      >
        <option value="all">Vista consolidada</option>
        {vslCampaigns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
