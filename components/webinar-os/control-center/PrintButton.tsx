export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="border border-[var(--wos-border)] bg-[var(--wos-surface)] text-[var(--wos-ink)] rounded-lg px-3 py-2 text-[13px] hover:bg-[var(--wos-surface-alt)]"
    >
      Imprimir / Guardar PDF
    </button>
  );
}
