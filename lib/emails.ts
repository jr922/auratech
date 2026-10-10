import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");
const senderEmail = process.env.EMAIL_FROM || "Aura Tech <no-reply@auratech.pe>";

// Simula el envío si no hay API key en desarrollo
const isDev = process.env.NODE_ENV === "development" && (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes("mock"));

export async function sendOrderConfirmationEmail(email: string, orderId: string, total: number) {
  if (isDev) {
    console.log(`[MOCK EMAIL] Enviar confirmación a ${email} para orden ${orderId}`);
    return { success: true };
  }
  try {
    const data = await resend.emails.send({
      from: senderEmail,
      to: email,
      subject: `¡Orden confirmada! #${orderId}`,
      html: `
        <div>
          <h1>¡Gracias por tu compra en Aura Tech!</h1>
          <p>Hemos recibido tu pedido <strong>#${orderId}</strong> por un total de S/ ${total.toFixed(2)}.</p>
          <p>Pronto te enviaremos una actualización sobre el envío.</p>
        </div>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Error enviando email:", error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;
  
  if (isDev) {
    console.log(`[MOCK EMAIL] Reset link para ${email}: ${resetLink}`);
    return { success: true };
  }
  try {
    const data = await resend.emails.send({
      from: senderEmail,
      to: email,
      subject: "Recuperar contraseña - Aura Tech",
      html: `
        <div>
          <h1>Recuperar Contraseña</h1>
          <p>Has solicitado cambiar tu contraseña. Haz clic en el enlace para continuar:</p>
          <a href="${resetLink}">Cambiar mi contraseña</a>
          <p>Si no fuiste tú, puedes ignorar este correo.</p>
        </div>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Error enviando email:", error);
    return { success: false, error };
  }
}

export async function sendRestockNotificationEmail(email: string, productName: string, url: string) {
  if (isDev) {
    console.log(`[MOCK EMAIL] Restock alert para ${email}: ${productName}`);
    return { success: true };
  }
  try {
    const data = await resend.emails.send({
      from: senderEmail,
      to: email,
      subject: `¡Volvió a stock! ${productName}`,
      html: `
        <div>
          <h1>¡Buenas noticias!</h1>
          <p>El producto <strong>${productName}</strong> por el que preguntaste ya está disponible nuevamente.</p>
          <a href="${url}">Ver producto ahora</a>
        </div>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Error enviando email:", error);
    return { success: false, error };
  }
}
