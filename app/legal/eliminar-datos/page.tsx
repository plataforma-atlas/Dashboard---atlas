export const metadata = {
  title: "Eliminar mis datos — Vermetricas",
};

export default function EliminarDatosPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.14em] text-primary font-mono">Vermetricas</span>
          <h1 className="font-display text-2xl md:text-3xl font-semibold">Cómo eliminar tus datos</h1>
        </header>

        <p className="text-[15px] leading-relaxed text-on-surface-variant">
          Si conectaste tu cuenta de Meta Ads (u otra integración) a Vermetricas y querés que eliminemos los datos que
          recibimos de ella, hacé lo siguiente:
        </p>

        <ol className="list-decimal pl-5 flex flex-col gap-2 text-[15px] leading-relaxed text-on-surface-variant">
          <li>
            Escribinos a{" "}
            <a href="mailto:plataformas@sebasklinkert.com" className="text-primary hover:underline">
              plataformas@sebasklinkert.com
            </a>{" "}
            desde el correo con el que iniciás sesión en Vermetricas, pidiendo la eliminación de tus datos.
          </li>
          <li>
            Confirmamos la solicitud y eliminamos de forma permanente, en un plazo máximo de 30 días: el token de acceso
            guardado, las métricas de campañas/anuncios ya traídas, y cualquier dato de leads o ventas asociado a tu cuenta.
          </li>
        </ol>

        <p className="text-[15px] leading-relaxed text-on-surface-variant">
          También podés desconectar tu cuenta de Meta en cualquier momento vos mismo desde{" "}
          <span className="font-medium text-on-surface">Conexiones</span> dentro del panel — eso elimina inmediatamente el
          token guardado, aunque las métricas históricas ya calculadas se conservan hasta que pidas la eliminación completa
          por correo.
        </p>
      </div>
    </div>
  );
}
