import Panel from "./Panel";

export default function ModuleShell({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Panel>
      <div className="flex items-center gap-2.5 mb-5">
        <span className="text-xl leading-none">{icon}</span>
        <h2 className="font-display text-base text-[var(--wos-ink)] font-semibold">{title}</h2>
      </div>
      {children}
    </Panel>
  );
}
