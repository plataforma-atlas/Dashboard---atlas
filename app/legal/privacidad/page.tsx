export const metadata = {
  title: "Política de privacidad — Vermetricas",
};

export default function PoliticaPrivacidadPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 flex flex-col gap-8">
        <header className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.14em] text-primary font-mono">Vermetricas</span>
          <h1 className="font-display text-2xl md:text-3xl font-semibold">Política de privacidad</h1>
          <p className="text-sm text-on-surface-variant">Última actualización: 1 de octubre de 2026</p>
        </header>

        <section className="flex flex-col gap-3 text-[15px] leading-relaxed text-on-surface-variant">
          <p>
            Vermetricas es un panel de reportes de marketing: conecta las cuentas publicitarias, el CRM y las plataformas de
            venta de una agencia y de sus clientes para mostrar sus métricas en un solo lugar (inversión, impresiones, clics,
            leads, ventas, ROAS). Esta política explica qué datos recibimos, de dónde, para qué los usamos y cómo los
            protegemos.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-on-surface">Qué datos recibimos</h2>
          <ul className="list-disc pl-5 flex flex-col gap-2 text-[15px] leading-relaxed text-on-surface-variant">
            <li>
              <span className="font-medium text-on-surface">De Meta (Facebook/Instagram Ads):</span> cuando un usuario conecta
              su cuenta publicitaria, recibimos — a través de la Marketing API de Meta y con los permisos que el usuario
              autoriza explícitamente — datos agregados de campañas y anuncios: nombre, estado, inversión, impresiones,
              clics, y el creativo (imagen/miniatura) del anuncio. No recibimos ni solicitamos datos personales de las
              personas que ven esos anuncios.
            </li>
            <li>
              <span className="font-medium text-on-surface">De GoHighLevel, Hotmart, WebinarKit y formularios propios:</span>{" "}
              datos de contacto que el usuario final entrega voluntariamente al registrarse en una landing o comprar un
              producto (nombre, correo, teléfono, origen de la visita) y el resultado de esa compra (producto, monto).
            </li>
            <li>
              <span className="font-medium text-on-surface">De uso de la plataforma:</span> credenciales de inicio de
              sesión (correo y contraseña cifrada) de cada usuario que administra el panel.
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-on-surface">Para qué usamos estos datos</h2>
          <p className="text-[15px] leading-relaxed text-on-surface-variant">
            Únicamente para mostrarle a cada agencia y a sus clientes sus propias métricas dentro del panel (dashboards,
            tablas, gráficos) y para calcular indicadores derivados (conversión, ROAS, costo por lead). No vendemos,
            alquilamos ni compartimos estos datos con terceros ajenos al funcionamiento del servicio, y no los usamos para
            publicidad propia ni de terceros.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-on-surface">Dónde se almacenan y por cuánto tiempo</h2>
          <p className="text-[15px] leading-relaxed text-on-surface-variant">
            Los datos se almacenan en una base de datos propia, con acceso restringido a los usuarios autorizados de cada
            cuenta. Los tokens de acceso a servicios externos (como Meta) se guardan cifrados y solo se usan para traer los
            datos que el usuario autorizó. Se conservan mientras la cuenta esté activa; si un usuario desconecta una
            integración o solicita la eliminación de sus datos, los eliminamos de forma permanente.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-on-surface">Datos de la Plataforma de Meta</h2>
          <p className="text-[15px] leading-relaxed text-on-surface-variant">
            El uso que hacemos de los datos obtenidos a través de las APIs de Meta cumple con la{" "}
            <a
              href="https://developers.facebook.com/policy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Política de la Plataforma de Meta
            </a>
            . Estos datos se usan exclusivamente para mostrar métricas de rendimiento publicitario al usuario que conectó la
            cuenta, nunca se comparten con terceros, y se eliminan cuando el usuario desconecta su cuenta de Meta o solicita
            la eliminación de sus datos.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-on-surface">Tus derechos</h2>
          <p className="text-[15px] leading-relaxed text-on-surface-variant">
            Podés pedirnos en cualquier momento acceder a tus datos, corregirlos, o eliminarlos por completo (incluyendo
            desconectar cualquier integración, como Meta Ads), escribiendo a{" "}
            <a href="mailto:soporte@vermetricas.com" className="text-primary hover:underline">
              soporte@vermetricas.com
            </a>
            . Respondemos estas solicitudes en un plazo máximo de 30 días.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-on-surface">Contacto</h2>
          <p className="text-[15px] leading-relaxed text-on-surface-variant">
            Si tenés preguntas sobre esta política o sobre el tratamiento de tus datos, escribinos a{" "}
            <a href="mailto:soporte@vermetricas.com" className="text-primary hover:underline">
              soporte@vermetricas.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
