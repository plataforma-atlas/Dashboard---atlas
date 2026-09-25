import { Megaphone } from "lucide-react";
import { useParams } from "next/navigation";

export default function MetaNoConectado() {
  const params = useParams<{ clienteId: string }>();
  const clienteId = params.clienteId;

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center gap-3 px-6 py-16">
      <div className="w-12 h-12 rounded-2xl bg-surface-high grid place-items-center text-primary">
        <Megaphone size={20} strokeWidth={2} />
      </div>
      <h2 className="text-lg font-semibold text-on-surface">Conectá Meta Ads para este cliente</h2>
      <p className="text-sm text-on-surface-variant max-w-sm">
        Todavía no hay una cuenta de Meta Ads conectada. Andá a Conexiones y pegá el ID de la cuenta publicitaria y un
        token de acceso con permiso de lectura de anuncios.
      </p>
      <a href={`/v3/${clienteId}/conexoes`} className="text-sm text-primary hover:underline">
        Ir a Conexiones →
      </a>
    </div>
  );
}
