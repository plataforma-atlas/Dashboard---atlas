export type WccAccordionItem = {
  index: string;
  title: string;
  metric?: string;
  body: React.ReactNode;
  defaultOpen?: boolean;
};

export default function WccAccordion({ items }: { items: WccAccordionItem[] }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <details
          key={item.index}
          open={item.defaultOpen}
          className="group rounded-xl border border-[var(--wos-border)] bg-[var(--wos-surface)] overflow-hidden"
        >
          <summary className="list-none grid grid-cols-[auto_1fr_auto_auto] items-center gap-2.5 min-h-[46px] px-3 py-2.5 cursor-pointer text-[var(--wos-ink)] [&::-webkit-details-marker]:hidden">
            <span className="w-[26px] h-[26px] rounded-lg grid place-items-center bg-[var(--wos-primary-soft)] text-[var(--wos-primary)] text-[10px] font-bold shrink-0">
              {item.index}
            </span>
            <span className="min-w-0 text-xs font-bold leading-tight">{item.title}</span>
            {item.metric && (
              <span className="text-[9px] font-bold rounded-full px-1.5 py-1 whitespace-nowrap bg-[var(--wos-surface-alt)] text-[var(--wos-ink-muted)]">
                {item.metric}
              </span>
            )}
            <span className="text-[var(--wos-ink-faint)] text-sm select-none">
              <span className="group-open:hidden">＋</span>
              <span className="hidden group-open:inline">−</span>
            </span>
          </summary>
          <div className="px-3 pb-3 pl-[47px] text-[11px] leading-relaxed text-[var(--wos-ink-muted)]">{item.body}</div>
        </details>
      ))}
    </div>
  );
}
