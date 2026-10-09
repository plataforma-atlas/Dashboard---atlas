import { Building2, KeyRound, Hash, Link2, Lightbulb, CircleCheck, Clock } from "lucide-react";

export const metadata = {
  title: "Cómo conectar Go High Level — Soporte Vermetricas",
};

type Paso = { texto: React.ReactNode };

function SeccionGuia({
  numero,
  icono: Icono,
  titulo,
  descripcion,
  pasos,
}: {
  numero: number;
  icono: React.ElementType;
  titulo: string;
  descripcion?: string;
  pasos: Paso[];
}) {
  return (
    <section className="rounded-xl border border-outline bg-surface p-5 md:p-6 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-9 h-9 rounded-full bg-primary text-on-primary font-display font-semibold grid place-items-center text-[15px]">
          {numero}
        </span>
        <div className="flex flex-col gap-0.5 pt-1">
          <div className="flex items-center gap-2">
            <Icono size={16} className="text-primary" strokeWidth={2} />
            <h2 className="text-[16px] font-semibold text-on-surface">{titulo}</h2>
          </div>
          {descripcion && <p className="text-[13px] text-on-surface-variant">{descripcion}</p>}
        </div>
      </div>

      <ol className="flex flex-col gap-3 pl-12">
        {pasos.map((p, i) => (
          <li key={i} className="flex gap-2.5 text-[14px] text-on-surface-variant leading-relaxed">
            <span className="shrink-0 font-mono text-[12px] text-on-surface-faint pt-0.5">{i + 1}.</span>
            <span>{p.texto}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Codigo({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[13px] bg-surface-high text-on-surface px-1.5 py-0.5 rounded">{children}</span>;
}

function Boton({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-on-surface">&quot;{children}&quot;</span>;
}

export default function ConectarGhlGuiaPage() {
  return (
    <div className="px-4 md:px-10 py-8 md:py-12">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <nav className="flex items-center gap-1.5 text-[13px] text-on-surface-faint">
          <a href="/soporte" className="hover:text-on-surface-variant transition-colors duration-150">
            Soporte
          </a>
          <span>/</span>
          <span className="text-on-surface-variant">Conectar Go High Level</span>
        </nav>

        <header className="flex flex-col gap-2">
          <h1 className="font-display text-2xl md:text-3xl font-semibold">Cómo conectar tu cuenta de Go High Level</h1>
          <span className="flex items-center gap-1.5 text-[13px] text-on-surface-faint">
            <Clock size={13} strokeWidth={2} />3 min de lectura
          </span>
          <p className="text-[15px] text-on-surface-variant leading-relaxed">
            Esta conexión necesita dos cosas: el <Codigo>Location ID</Codigo> de tu sub-cuenta y un{" "}
            <span className="font-medium text-on-surface">token de Integración Privada</span> (Private Integration Token). Se
            genera dentro de la configuración de tu propia sub-cuenta de GHL — no hace falta crear ninguna app ni pedirle nada
            a soporte de GHL. Son 2-3 minutos.
          </p>
        </header>

        <SeccionGuia
          numero={1}
          icono={Building2}
          titulo="Crear el token de Integración Privada"
          descripcion="Se hace desde la sub-cuenta (location) que querés conectar, no desde la agencia."
          pasos={[
            { texto: <>Entrá a tu sub-cuenta de GHL y andá a <Boton>Settings</Boton> (el engranaje, al final del menú de la izquierda).</> },
            { texto: <>Buscá <Boton>Private Integrations</Boton> en el menú de Settings (a veces aparece dentro de un bloque &quot;Integrations&quot;).</> },
            { texto: <>Hacé clic en <Boton>Create New Integration</Boton>.</> },
            { texto: <>Ponele un nombre a elección (ej. <Codigo>Vermetricas</Codigo>) para reconocerlo después en la lista.</> },
            {
              texto: (
                <>
                  Te va a aparecer una lista larga de permisos (&quot;Scopes&quot;) para marcar, agrupados por sección. Marcá{" "}
                  <span className="font-medium text-on-surface">solo de lectura (Read Only / View)</span> en estos — nunca hace
                  falta marcar escritura:
                </>
              ),
            },
          ]}
        />

        <section className="rounded-xl border border-outline bg-surface-high px-5 py-4 flex flex-col gap-2 -mt-4">
          <p className="text-[13px] text-on-surface-variant">Permisos a marcar al crear el token:</p>
          <ul className="text-[13px] text-on-surface-variant list-disc list-inside pl-1 flex flex-col gap-1">
            <li>
              <span className="font-medium text-on-surface">Surveys</span> — ya lo usamos hoy, para traer las preguntas y
              respuestas reales de tu encuesta.
            </li>
            <li>
              <span className="font-medium text-on-surface">Contacts, Conversations, Conversation Messages, Opportunities,
              Users</span> — todavía no los usamos, pero los vamos a necesitar pronto para medir el tiempo de respuesta de tus
              closers. Marcalos ahora para no tener que generar un token nuevo más adelante.
            </li>
          </ul>
        </section>

        <SeccionGuia
          numero={2}
          icono={KeyRound}
          titulo="Generar y copiar el token"
          pasos={[
            { texto: <>Con los permisos marcados, hacé clic en <Boton>Create</Boton> (o <Boton>Generate</Boton>, según la versión).</> },
            {
              texto: (
                <>
                  Te va a mostrar un texto largo que empieza con <Codigo>pit-...</Codigo> —{" "}
                  <span className="font-medium text-on-surface">copialo y guardalo en un lugar seguro ya mismo</span>. GHL solo
                  lo muestra esta vez; si cerrás la ventana sin copiarlo, hay que generar uno nuevo (no afecta a nada de lo que
                  ya tengas andando, simplemente repetís este paso).
                </>
              ),
            },
          ]}
        />

        <SeccionGuia
          numero={3}
          icono={Hash}
          titulo="Conseguir el Location ID de tu sub-cuenta"
          pasos={[
            { texto: <>Seguís en la misma sub-cuenta → <Boton>Settings</Boton> → <Boton>Business Profile</Boton> (o &quot;Company&quot;).</> },
            { texto: <>Ahí aparece el <Codigo>Location ID</Codigo> listo para copiar (un código, ej. <Codigo>inP4J6Az84JrpelPM1ZE</Codigo>).</> },
            {
              texto: (
                <>
                  Si no lo encontrás ahí, también aparece en la barra de direcciones del navegador cuando estás dentro de la
                  sub-cuenta: la parte después de <Codigo>/location/</Codigo> en la URL.
                </>
              ),
            },
          ]}
        />

        <SeccionGuia
          numero={4}
          icono={Link2}
          titulo="Conectar en Vermetricas"
          pasos={[
            { texto: <>Entrá a tu panel de Vermetricas → <Boton>Conexiones</Boton>.</> },
            { texto: <>En la tarjeta &quot;Go High Level&quot;, hacé clic en <Boton>Conectar</Boton>.</> },
            { texto: "Pegá el Location ID en el primer campo." },
            { texto: <>Pegá el token (el que empieza con <Codigo>pit-...</Codigo>) en el campo &quot;Token de Integración Privada&quot;.</> },
            { texto: <>Hacé clic en <Boton>Guardar conexión</Boton>.</> },
          ]}
        />

        <div className="rounded-xl border border-outline-success bg-success-container px-5 py-4 flex items-start gap-3">
          <CircleCheck size={18} className="text-success shrink-0 mt-0.5" />
          <p className="text-[14px] text-on-surface">
            Listo — en unos segundos el panel debería mostrar <span className="font-medium">&quot;Conectado&quot;</span>. Si
            tenés una encuesta de GHL, ya podés sincronizarla desde Webhooks sin volver a tocar esta pantalla.
          </p>
        </div>

        <div className="rounded-xl border border-outline bg-surface-high px-5 py-4 flex items-start gap-3">
          <Lightbulb size={18} className="text-primary shrink-0 mt-0.5" />
          <p className="text-[13px] text-on-surface-variant leading-relaxed">
            Vermetricas solo lee datos de tu cuenta de GHL — nunca envía ni modifica nada ahí. Por eso todos los permisos de
            arriba se marcan en su variante de solo lectura.
          </p>
        </div>
      </div>
    </div>
  );
}
