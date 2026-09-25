import { Clock } from "lucide-react";

const NOMBRE_ESTRATEGIA: Record<string, string> = {
  lanzamiento: "lanzamiento",
  vsl: "VSL",
  webinar_automatizado: "webinar automático",
};

export default function V3ComingSoon({ strategyType }: { strategyType?: string | null }) {
  const nombre = strategyType ? NOMBRE_ESTRATEGIA[strategyType] : null;

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center gap-3 px-6 py-16">
      <div className="w-12 h-12 rounded-2xl bg-surface-high grid place-items-center text-primary">
        <Clock size={20} strokeWidth={2} />
      </div>
      <h2 className="text-lg font-semibold text-on-surface">Próximamente</h2>
      <p className="text-sm text-on-surface-variant max-w-sm">
        {nombre
          ? `El nuevo dashboard todavía no está disponible para campañas de tipo ${nombre}. Por ahora podés ver esta información en la versión clásica.`
          : "Este cliente no tiene una campaña activa todavía, o el nuevo dashboard todavía no está disponible para su tipo de estrategia."}
      </p>
      <a href="/" className="text-sm text-primary hover:underline">
        Ir a la versión clásica →
      </a>
    </div>
  );
}
