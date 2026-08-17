import { WebinarSummary } from "@/lib/webinar-os/types";
import { countryFlagEmoji } from "@/lib/webinar-os/countryFlag";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

export default function WebinarCountrySelector({
  webinars,
  selectedCountry,
  selectedWebinarId,
  onSelectCountry,
  onSelectWebinar,
}: {
  webinars: WebinarSummary[];
  selectedCountry: string | null;
  selectedWebinarId: number | null;
  onSelectCountry: (country: string) => void;
  onSelectWebinar: (id: number) => void;
}) {
  const countries = Array.from(new Set(webinars.map((w) => w.country))).sort();
  const editions = webinars
    .filter((w) => w.country === selectedCountry)
    .sort((a, b) => a.sort_order - b.sort_order || a.webinar_date.localeCompare(b.webinar_date));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-[11px] uppercase tracking-[0.1em] text-[var(--wos-ink-faint)] font-medium mb-2 px-1">
          Selecciona país
        </div>
        <div className="flex flex-col gap-1.5">
          {countries.map((country) => {
            const active = country === selectedCountry;
            const count = webinars.filter((w) => w.country === country).length;
            return (
              <button
                key={country}
                onClick={() => onSelectCountry(country)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition ${
                  active
                    ? "bg-[var(--wos-primary)] text-white"
                    : "bg-[var(--wos-surface)] border border-[var(--wos-border)] text-[var(--wos-ink)] hover:border-[var(--wos-primary)]"
                }`}
              >
                <span className="text-lg leading-none">{countryFlagEmoji(country)}</span>
                <span className="flex-1 text-sm font-medium">{country}</span>
                <span className={`text-[11px] font-mono ${active ? "text-white/80" : "text-[var(--wos-ink-faint)]"}`}>
                  {count} ed.
                </span>
              </button>
            );
          })}
          {countries.length === 0 && (
            <p className="text-xs text-[var(--wos-ink-faint)] px-1">Sin webinars registrados todavía.</p>
          )}
        </div>
      </div>

      {selectedCountry && editions.length > 0 && (
        <div>
          <label className="text-[11px] uppercase tracking-[0.1em] text-[var(--wos-ink-faint)] font-medium mb-2 px-1 block">
            Edición
          </label>
          <select
            value={selectedWebinarId ?? ""}
            onChange={(e) => onSelectWebinar(Number(e.target.value))}
            className="w-full bg-[var(--wos-surface)] border border-[var(--wos-border)] rounded-md px-2.5 py-2 text-sm text-[var(--wos-ink)] focus:border-[var(--wos-primary)] outline-none"
          >
            {editions.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label} — {formatDate(w.webinar_date)}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
