import { Building2, Users, KeyRound, Hash, Link2, Lightbulb, CircleCheck, Clock, UserCog } from "lucide-react";

export const metadata = {
  title: "Cómo conectar Meta Ads — Soporte Vermetricas",
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

export default function ConectarMetaAdsGuiaPage() {
  return (
    <div className="px-4 md:px-10 py-8 md:py-12">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <nav className="flex items-center gap-1.5 text-[13px] text-on-surface-faint">
          <a href="/soporte" className="hover:text-on-surface-variant transition-colors duration-150">
            Soporte
          </a>
          <span>/</span>
          <span className="text-on-surface-variant">Conectar Meta Ads</span>
        </nav>

        <header className="flex flex-col gap-2">
          <h1 className="font-display text-2xl md:text-3xl font-semibold">Cómo conectar tu cuenta de Meta Ads</h1>
          <span className="flex items-center gap-1.5 text-[13px] text-on-surface-faint">
            <Clock size={13} strokeWidth={2} />5 min de lectura
          </span>
          <p className="text-[15px] text-on-surface-variant leading-relaxed">
            Esta conexión necesita dos cosas: el <Codigo>ID</Codigo> de tu cuenta publicitaria y un{" "}
            <span className="font-medium text-on-surface">token de acceso</span> con permisos de lectura y gestión de
            anuncios. Te recomendamos generarlo como <span className="font-medium text-on-surface">Usuario del sistema</span>{" "}
            dentro de tu Business Manager, porque <span className="font-medium text-on-surface">no caduca</span> — a
            diferencia de un token normal, que expira en 1-2 horas o como máximo 60 días. Son unos 10-15 minutos la primera
            vez.
          </p>
        </header>

        <SeccionGuia
          numero={1}
          icono={Building2}
          titulo="Crear una app de Meta (una sola vez)"
          descripcion="El token se genera a través de una app de Meta — no hay que programar nada, es solo un paso de configuración."
          pasos={[
            { texto: <>Entrá a <Codigo>developers.facebook.com</Codigo> con tu cuenta de Facebook (la misma con la que administrás tus anuncios).</> },
            { texto: "Si es tu primera vez ahí, te va a pedir registrarte como desarrollador — aceptá los términos, es gratis e inmediato." },
            { texto: <>Arriba a la derecha, hacé clic en <Boton>Mis apps</Boton> → <Boton>Crear app</Boton>.</> },
            { texto: <>En <Boton>Detalles de la app</Boton>, ponele un nombre cualquiera (ej. <Codigo>Conexión Vermetricas</Codigo>) y un correo de contacto.</> },
            {
              texto: (
                <>
                  En <Boton>Casos de uso</Boton>, marcá estas dos opciones (son las únicas que necesitás): <span className="font-medium text-on-surface">&quot;Crear y administrar anuncios con la API de marketing&quot;</span> y{" "}
                  <span className="font-medium text-on-surface">&quot;Medir datos de rendimiento de los anuncios con la API de marketing&quot;</span>. El resto de la lista (Threads, Instagram, WhatsApp, juegos, etc.) no hace falta.
                </>
              ),
            },
            { texto: <>En <Boton>Negocio</Boton>, elegí el portfolio comercial al que pertenece la cuenta publicitaria que vas a conectar.</> },
            { texto: <>En <Boton>Requisitos</Boton> lo normal es que diga &quot;No se identificaron requisitos&quot; — seguí sin hacer nada ahí.</> },
            { texto: <>En <Boton>Resumen</Boton>, revisá y hacé clic en <Boton>Crear app</Boton> (te puede pedir que vuelvas a escribir tu contraseña de Facebook, por seguridad).</> },
            {
              texto: (
                <>
                  Con la app ya creada vas a ver un panel con una checklist (&quot;Personalizar casos de uso&quot;, &quot;Probar casos de uso&quot;, &quot;Publicar&quot;) y un cuadro de
                  &quot;Conviértete en proveedor de tecnología&quot;.{" "}
                  <span className="font-medium text-on-surface">No hace falta completar nada de eso ni publicar la app</span> — esa parte es solo para cuando una app necesita acceder a
                  cuentas de otros negocios (eso pasa por revisión de Meta). Para generar tu propio token sobre tu propia cuenta no se necesita revisión: seguí directo a la Parte 2.
                </>
              ),
            },
          ]}
        />

        <SeccionGuia
          numero={2}
          icono={Users}
          titulo="Crear un Usuario del Sistema y darle acceso a tu cuenta"
          pasos={[
            { texto: <>Andá a <Codigo>business.facebook.com/settings</Codigo> (Configuración del negocio de tu Business Manager).</> },
            { texto: <>En el menú de la izquierda, bajo <Boton>Usuarios</Boton>, hacé clic en <Boton>Usuarios del sistema</Boton>.</> },
            { texto: <>Hacé clic en <Boton>Agregar</Boton>.</> },
            { texto: <>Ponele un nombre (ej. &quot;Vermetricas API&quot;) y elegí el rol <Boton>Administrador</Boton>. Confirmá.</> },
            { texto: <>Con el usuario del sistema ya creado, seleccionalo de la lista y hacé clic en <Boton>Agregar activos</Boton>.</> },
            { texto: <>En la ventana que se abre, elegí la pestaña <Boton>Cuentas publicitarias</Boton>, buscá y seleccioná la cuenta (o cuentas) que querés conectar.</> },
            { texto: <>A la derecha, activá el permiso de <Boton>Control total</Boton> (o como mínimo &quot;Gestionar la cuenta&quot;) para esa cuenta.</> },
            { texto: "Guardá los cambios." },
          ]}
        />

        <SeccionGuia
          numero={3}
          icono={UserCog}
          titulo="Darle al Usuario del Sistema un rol en la app"
          descripcion="Esto se hace en la pantalla de la app (la misma de la Parte 1), no en Business Settings — por eso es un paso aparte."
          pasos={[
            {
              texto: (
                <>
                  Volvé a <Codigo>developers.facebook.com</Codigo> → tu app (&quot;Conexión Vermetricas&quot;) — vas a terminar en el mismo Panel donde quedaste al crearla en la Parte 1.
                </>
              ),
            },
            { texto: <>En el menú de la izquierda, abrí <Boton>Roles de la app</Boton> → <Boton>Roles</Boton>.</> },
            {
              texto: (
                <>
                  Agregá ahí al Usuario del Sistema que creaste en el paso anterior (ej. &quot;Vermetricas API&quot;) con rol <Boton>Administrador</Boton>. Esto es distinto de los activos
                  (cuentas publicitarias) que ya le diste en Business Settings — sin este rol en la app, al generar el token te va a decir &quot;No hay permisos disponibles&quot;.
                </>
              ),
            },
          ]}
        />

        <SeccionGuia
          numero={4}
          icono={KeyRound}
          titulo="Generar el token de acceso"
          pasos={[
            { texto: "Seguís en la página de ese Usuario del sistema (Business Settings → Usuarios del sistema → el que creaste)." },
            { texto: <>Hacé clic en <Boton>Generar nuevo token</Boton>.</> },
            { texto: <>Te va a pedir elegir una app: seleccioná la que creaste en la Parte 1 (&quot;Conexión Vermetricas&quot;).</> },
            {
              texto: (
                <>
                  Te va a mostrar una lista de permisos para marcar. Buscá y marcá estos dos (podés escribir en el buscador):{" "}
                  <Codigo>ads_read</Codigo> y <Codigo>ads_management</Codigo>.
                </>
              ),
            },
            { texto: <>Hacé clic en <Boton>Generar token</Boton>.</> },
            {
              texto: (
                <>
                  Te va a aparecer un texto largo que empieza con <Codigo>EAAG...</Codigo> —{" "}
                  <span className="font-medium text-on-surface">copialo y guardalo en un lugar seguro ya mismo</span> (un
                  bloc de notas, por ejemplo). Meta solo lo muestra esta vez; si cerrás la ventana sin copiarlo, hay que
                  generar uno nuevo.
                </>
              ),
            },
          ]}
        />

        <SeccionGuia
          numero={5}
          icono={Hash}
          titulo="Conseguir el ID de tu cuenta publicitaria"
          pasos={[
            { texto: <>En el mismo Business Manager, andá a <Boton>Configuración del negocio</Boton> → <Boton>Cuentas</Boton> → <Boton>Cuentas publicitarias</Boton>.</> },
            { texto: "Hacé clic en la cuenta que conectaste." },
            {
              texto: (
                <>
                  El ID de la cuenta aparece ahí mismo (un número largo, ej. <Codigo>1335449911466240</Codigo>) — copialo.
                  Si lo ves con el prefijo <Codigo>act_</Codigo>, usá solo los números, sin el <Codigo>act_</Codigo>.
                </>
              ),
            },
          ]}
        />

        <SeccionGuia
          numero={6}
          icono={Link2}
          titulo="Conectar en Vermetricas"
          pasos={[
            { texto: <>Entrá a tu panel de Vermetricas → <Boton>Conexiones</Boton>.</> },
            { texto: <>En la tarjeta &quot;Meta Ads&quot;, hacé clic en <Boton>Conectar</Boton>.</> },
            { texto: "Pegá el ID de la cuenta en el primer campo, y ponele un nombre a elección en el segundo (ej. \"Cuenta principal\")." },
            { texto: <>Si tenés más de una cuenta publicitaria, hacé clic en <Boton>Agregar otra cuenta</Boton> y repetí el paso anterior para cada una.</> },
            { texto: <>Pegá el token (el que empieza con <Codigo>EAAG...</Codigo>) en el campo &quot;Token de acceso&quot;.</> },
            { texto: <>Hacé clic en <Boton>Guardar conexión</Boton>.</> },
          ]}
        />

        <div className="rounded-xl border border-outline-success bg-success-container px-5 py-4 flex items-start gap-3">
          <CircleCheck size={18} className="text-success shrink-0 mt-0.5" />
          <p className="text-[14px] text-on-surface">
            Listo — en unos segundos el panel debería mostrar <span className="font-medium">&quot;Conectado&quot;</span> y
            empezar a traer los datos reales de inversión, impresiones y clics.
          </p>
        </div>

        <div className="rounded-xl border border-outline bg-surface-high px-5 py-4 flex items-start gap-3">
          <Lightbulb size={18} className="text-primary shrink-0 mt-0.5" />
          <p className="text-[13px] text-on-surface-variant leading-relaxed">
            El permiso <Codigo>ads_management</Codigo> (además de <Codigo>ads_read</Codigo>) es el que te permite más
            adelante pausar o activar anuncios directo desde el panel — si por ahora solo querés ver las métricas, también
            funciona con solo <Codigo>ads_read</Codigo>, pero recomendamos marcar los dos de una vez para no tener que
            repetir el proceso después.
          </p>
        </div>
      </div>
    </div>
  );
}
