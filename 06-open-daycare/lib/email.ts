// Envío de emails de invitación (SPEC 11) con Resend. Se usa desde server
// actions; RESEND_API_KEY nunca viaja al cliente. From con el dominio por
// defecto de Resend (onboarding@resend.dev) hasta verificar dominio propio.

import { Resend } from "resend";

const FROM = "OpenDayCare <onboarding@resend.dev>";

export type InvitationEmailInput = {
  /** Email del padre invitado. */
  email: string;
  /** Nombre completo del niño. */
  childName: string;
  /** Nombre del staff que invita. */
  inviterName: string;
  /** Código de invitación (5 caracteres). */
  code: string;
};

/** URL de activación: NEXT_PUBLIC_APP_URL + /activate-account?code=... */
export function buildActivationUrl(code: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${baseUrl.replace(/\/+$/, "")}/activate-account?code=${encodeURIComponent(code)}`;
}

/** Escapa HTML mínimo para nombres/códigos que vienen de input de usuario. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(input: InvitationEmailInput, activationUrl: string): string {
  const childName = escapeHtml(input.childName);
  const inviterName = escapeHtml(input.inviterName);
  const code = escapeHtml(input.code);
  const url = escapeHtml(activationUrl);

  return `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background:#F7F6F3;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:520px;margin:32px auto;padding:0 16px;">
      <div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(155deg,#F8C3A8,#F2937A);line-height:48px;text-align:center;font-size:24px;">&#9728;</div>
      <h1 style="margin:20px 0 8px;font-size:24px;color:#2B2A28;">Bienvenida a OpenDayCare</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#6F6C66;">
        <strong>${inviterName}</strong> te invitó a seguir el día de
        <strong>${childName}</strong>. Creá tu contraseña para activar la cuenta
        y ver las novedades.
      </p>
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${url}"
           style="display:inline-block;padding:12px 28px;border-radius:12px;background:#F2937A;color:#FFFFFF;font-size:15px;font-weight:bold;text-decoration:none;">
          Activar mi cuenta
        </a>
      </div>
      <div style="text-align:center;margin:0 0 24px;padding:14px;border-radius:12px;border:1.5px dashed #E4E2DC;background:#FFFFFF;">
        <div style="font-size:12px;color:#6F6C66;margin-bottom:6px;">O ingresá este código en la pantalla de activación</div>
        <div style="font-size:26px;font-weight:bold;letter-spacing:6px;color:#2B2A28;">${code}</div>
      </div>
      <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#6F6C66;">
        Si el botón no funciona, copiá y pegá este link en tu navegador:
      </p>
      <p style="margin:0;font-size:13px;word-break:break-all;">
        <a href="${url}" style="color:#F2937A;">${url}</a>
      </p>
      <p style="margin:24px 0 0;font-size:12px;color:#9C9890;">
        Este enlace vence en 7 días. Si no esperabas esta invitación, ignorá este email.
      </p>
    </div>
  </body>
</html>`;
}

/** Envía el email de invitación. Lanza Error si falta la API key o si
 *  Resend devuelve error (el caller lo muestra en el modal). */
export async function sendInvitationEmail(
  input: InvitationEmailInput,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Falta la variable RESEND_API_KEY: no se puede enviar el email de invitación.",
    );
  }

  const resend = new Resend(apiKey);
  const activationUrl = buildActivationUrl(input.code);

  const { error } = await resend.emails.send({
    from: FROM,
    to: [input.email],
    subject: `Te invitaron a seguir a ${input.childName} en OpenDayCare`,
    html: buildHtml(input, activationUrl),
  });

  if (error) {
    throw new Error(`No se pudo enviar el email de invitación: ${error.message}`);
  }
}
