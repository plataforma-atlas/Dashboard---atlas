const FROM = "Vermetricas <noreply@vermetricas.com>";

// Gmail (y otros clientes) bloquean imagenes embebidas como data: URI en el HTML
// del correo, asi que el logo tiene que servirse desde una URL publica real.
// TODO: una vez desplegado en Vercel, cambiar a la URL de brand/ del dominio de produccion.
const LOGO_URL = "https://raw.githubusercontent.com/plataforma-atlas/Dashboard---atlas/main/public/brand/vermetricas-horizontal-light.png";

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY no está configurada");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend respondió ${res.status}: ${detail}`);
  }
}

export async function sendPasswordResetEmail({ to, resetUrl }: { to: string; resetUrl: string }) {
  const html = `
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0; padding:0; background-color:#F1F1F8; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1F1F8; padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(91,91,247,0.08);">
            <tr>
              <td style="padding:36px 40px 8px 40px;" align="center">
                <img src="${LOGO_URL}" alt="Vermetricas" width="220" style="display:block; max-width:220px; height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 0 40px;">
                <h1 style="margin:0; font-size:20px; line-height:1.3; color:#14151A; font-weight:600;">Restablece tu contraseña</h1>
                <p style="margin:16px 0 0 0; font-size:14px; line-height:1.6; color:#54566B;">
                  Recibimos una solicitud para restablecer la contraseña de tu cuenta en el Panel de Clientes de Vermetricas. Haz clic en el botón de abajo para crear una nueva.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 40px 0 40px;" align="center">
                <a href="${resetUrl}" style="display:inline-block; background-color:#00A7B9; color:#FFFFFF; text-decoration:none; font-size:14px; font-weight:600; padding:12px 32px; border-radius:8px;">
                  Crear nueva contraseña
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 0 40px;">
                <p style="margin:0; font-size:12px; line-height:1.6; color:#9294A6;">
                  Este enlace expira en 1 hora. Si no solicitaste este cambio, puedes ignorar este correo — tu contraseña seguirá siendo la misma.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 40px 32px 40px;">
                <hr style="border:none; border-top:1px solid #ECECF3; margin:0 0 16px 0;" />
                <p style="margin:0; font-size:11px; letter-spacing:0.04em; text-transform:uppercase; color:#B7B8C7;">Vermetricas · Datos que te llevan más lejos</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  await sendEmail({ to, subject: "Restablece tu contraseña — Vermetricas", html });
}

export async function sendTeamInviteEmail({
  to,
  inviteUrl,
  clienteNombre,
}: {
  to: string;
  inviteUrl: string;
  clienteNombre: string;
}) {
  const html = `
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0; padding:0; background-color:#F1F1F8; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1F1F8; padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(91,91,247,0.08);">
            <tr>
              <td style="padding:36px 40px 8px 40px;" align="center">
                <img src="${LOGO_URL}" alt="Vermetricas" width="220" style="display:block; max-width:220px; height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 0 40px;">
                <h1 style="margin:0; font-size:20px; line-height:1.3; color:#14151A; font-weight:600;">Te invitaron a un equipo</h1>
                <p style="margin:16px 0 0 0; font-size:14px; line-height:1.6; color:#54566B;">
                  Te invitaron a sumarte al dashboard de <strong>${clienteNombre}</strong> en Vermetricas, con el mismo acceso que el resto del equipo. Hacé clic abajo para crear tu cuenta.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 40px 0 40px;" align="center">
                <a href="${inviteUrl}" style="display:inline-block; background-color:#00A7B9; color:#FFFFFF; text-decoration:none; font-size:14px; font-weight:600; padding:12px 32px; border-radius:8px;">
                  Crear mi cuenta
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 0 40px;">
                <p style="margin:0; font-size:12px; line-height:1.6; color:#9294A6;">
                  Este enlace expira en 7 días. Si no esperabas esta invitación, podés ignorar este correo.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 40px 32px 40px;">
                <hr style="border:none; border-top:1px solid #ECECF3; margin:0 0 16px 0;" />
                <p style="margin:0; font-size:11px; letter-spacing:0.04em; text-transform:uppercase; color:#B7B8C7;">Vermetricas · Datos que te llevan más lejos</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  await sendEmail({ to, subject: `Te invitaron al equipo de ${clienteNombre} — Vermetricas`, html });
}

export async function sendTemporaryPasswordEmail({
  to,
  name,
  password,
  loginUrl,
}: {
  to: string;
  name: string;
  password: string;
  loginUrl: string;
}) {
  const html = `
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0; padding:0; background-color:#F1F1F8; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1F1F8; padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(91,91,247,0.08);">
            <tr>
              <td style="padding:36px 40px 8px 40px;" align="center">
                <img src="${LOGO_URL}" alt="Vermetricas" width="220" style="display:block; max-width:220px; height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 0 40px;">
                <h1 style="margin:0; font-size:20px; line-height:1.3; color:#14151A; font-weight:600;">Tu cuenta está lista, ${name}</h1>
                <p style="margin:16px 0 0 0; font-size:14px; line-height:1.6; color:#54566B;">
                  Ya podés entrar al Panel de Clientes de Vermetricas. Tu contraseña temporal es:
                </p>
                <p style="margin:12px 0 0 0; font-family:Menlo,Consolas,monospace; font-size:16px; color:#14151A; background:#F1F1F8; padding:12px 16px; border-radius:8px; text-align:center;">${password}</p>
                <p style="margin:12px 0 0 0; font-size:13px; line-height:1.6; color:#54566B;">
                  Te recomendamos cambiarla desde tu perfil apenas entres.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 40px 0 40px;" align="center">
                <a href="${loginUrl}" style="display:inline-block; background-color:#00A7B9; color:#FFFFFF; text-decoration:none; font-size:14px; font-weight:600; padding:12px 32px; border-radius:8px;">
                  Entrar a Vermetricas
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 40px 32px 40px;">
                <hr style="border:none; border-top:1px solid #ECECF3; margin:0 0 16px 0;" />
                <p style="margin:0; font-size:11px; letter-spacing:0.04em; text-transform:uppercase; color:#B7B8C7;">Vermetricas · Datos que te llevan más lejos</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  await sendEmail({ to, subject: "Tu acceso a Vermetricas", html });
}
