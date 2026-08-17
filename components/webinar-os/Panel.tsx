export default function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-[var(--wos-border)] bg-[var(--wos-surface)] shadow-[var(--wos-shadow)] p-5 md:p-6 ${className}`}
    >
      {children}
    </div>
  );
}
