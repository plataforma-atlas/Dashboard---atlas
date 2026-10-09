import { Link2, Users, ShoppingCart, Radio, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Centro de soporte — Vermetricas",
};

const GUIAS = [
  {
    href: "/soporte/conectar-meta-ads",
    icono: Link2,
    titulo: "Conectar Meta Ads",
    descripcion: "Generá un token que no caduca y conectá tus cuentas publicitarias.",
    disponible: true,
  },
  {
    href: "/soporte/conectar-ghl",
    icono: Users,
    titulo: "Conectar Go High Level",
    descripcion: "Para que tus leads lleguen y se etiqueten solos en tu CRM.",
    disponible: true,
  },
  {
    href: "/soporte/conectar-hotmart",
    icono: ShoppingCart,
    titulo: "Conectar Hotmart",
    descripcion: "Para que tus ventas se reflejen solas en Base de datos.",
    disponible: false,
  },
  {
    href: "/soporte/conectar-clasespecial",
    icono: Radio,
    titulo: "Conectar ClaseEspecial",
    descripcion: "Para traer asistencia y % de reproducción de tus webinars.",
    disponible: false,
  },
];

export default function SoportePage() {
  return (
    <div className="px-4 md:px-10 py-8 md:py-12">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.14em] text-primary font-mono">Vermetricas</span>
          <h1 className="font-display text-2xl md:text-3xl font-semibold">Centro de soporte</h1>
          <p className="text-[15px] text-on-surface-variant leading-relaxed">Guías paso a paso para conectar tus fuentes de datos.</p>
        </header>

        <div className="grid sm:grid-cols-2 gap-4">
          {GUIAS.map((g) => {
            const Icono = g.icono;
            if (!g.disponible) {
              return (
                <div
                  key={g.href}
                  className="rounded-xl border border-outline bg-surface p-5 flex flex-col gap-3 opacity-50 cursor-default"
                >
                  <span className="w-9 h-9 rounded-lg bg-surface-high text-on-surface-faint grid place-items-center">
                    <Icono size={16} strokeWidth={2} />
                  </span>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-[15px] font-semibold text-on-surface">{g.titulo}</h2>
                      <span className="text-[10px] uppercase tracking-wide text-on-surface-faint border border-outline rounded px-1.5 py-0.5">
                        Pronto
                      </span>
                    </div>
                    <p className="text-[13px] text-on-surface-variant">{g.descripcion}</p>
                  </div>
                </div>
              );
            }
            return (
              <a
                key={g.href}
                href={g.href}
                className="press group rounded-xl border border-outline bg-surface p-5 flex flex-col gap-3 hover:border-primary transition-colors duration-150"
              >
                <span className="w-9 h-9 rounded-lg bg-primary/20 text-primary grid place-items-center">
                  <Icono size={16} strokeWidth={2} />
                </span>
                <div className="flex flex-col gap-1">
                  <h2 className="text-[15px] font-semibold text-on-surface flex items-center gap-1.5">
                    {g.titulo}
                    <ArrowRight size={14} className="text-on-surface-faint group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150" />
                  </h2>
                  <p className="text-[13px] text-on-surface-variant">{g.descripcion}</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
