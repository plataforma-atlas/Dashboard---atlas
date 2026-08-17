// Convierte un código ISO-3166 alpha-2 (ej. "CO") en su emoji de bandera, vía regional indicator symbols.
export function countryFlagEmoji(iso2: string): string {
  if (!iso2 || iso2.length !== 2) return "🏳️";
  const codePoints = iso2
    .toUpperCase()
    .split("")
    .map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
