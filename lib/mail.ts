import { Resend } from "resend";
import { Order, OrderItem, User } from "@prisma/client";

// Solo se inicializa si existe la llave
const getResend = () => {
  if (!process.env.RESEND_API_KEY) {
    console.log("⚠️ No se encontró RESEND_API_KEY en las variables de entorno.");
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
};
const FROM_EMAIL = "Ventas Aura Tech <ventas@auratech.pe>";

// Helper para formatear moneda
const formatPrice = (price: number) => "S/ " + price.toFixed(2);

// Plantilla Base (HTML) con diseño corporativo
const baseEmailTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #334155; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .header { background-color: #0f172a; padding: 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
    .content { padding: 32px 24px; }
    .footer { background-color: #f1f5f9; padding: 24px; text-align: center; font-size: 13px; color: #64748b; }
    .button { display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; margin: 24px 0; }
    .order-table { width: 100%; border-collapse: collapse; margin-top: 24px; margin-bottom: 24px; }
    .order-table th { text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; color: #0f172a; font-size: 14px; }
    .order-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .summary-row td { border-bottom: none; padding: 6px 12px; }
    .total-row td { font-weight: 900; font-size: 16px; border-top: 2px solid #e2e8f0; padding-top: 16px; }
    .alert-box { background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
    .alert-title { color: #1e3a8a; font-weight: bold; margin-top: 0; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AURA TECH</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Aura Tech Perú - Todos los derechos reservados.</p>
      <p>Este correo se generó de forma automática, por favor no lo respondas directamente.</p>
    </div>
  </div>
</body>
</html>
`;

function buildOrderTable(order: Order, items: OrderItem[]) {
  const itemsHtml = items.map(item => `
    <tr>
      <td>${item.quantity}x ${item.productName}</td>
      <td style="text-align: right;">${formatPrice(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  return `
    <table class="order-table">
      <thead>
        <tr>
          <th>Producto</th>
          <th style="text-align: right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        ${order.discountAmount > 0 ? `<tr class="summary-row"><td>Descuento</td><td style="text-align: right; color: #ef4444;">-${formatPrice(order.discountAmount)}</td></tr>` : ''}
        <tr class="summary-row">
          <td>Costo de Envío</td>
          <td style="text-align: right;">${formatPrice(order.shippingCost)}</td>
        </tr>
        <tr class="total-row">
          <td>Total a Pagar</td>
          <td style="text-align: right;">${formatPrice(order.total)}</td>
        </tr>
      </tbody>
    </table>
  `;
}

type FullOrder = Order & { items: OrderItem[] };

/**
 * Correo 1: Pago Pendiente (Yape/Transferencia)
 */
export async function sendPendingPaymentEmail(order: FullOrder, userEmail: string, userName: string) {
  const resend = getResend();
  if (!resend) return;
  const trackingUrl = `${process.env.NEXTAUTH_URL || 'https://auratech.pe'}/pedido/${order.id}`;

  let paymentInstructions = '';
  if (order.paymentMethod === 'yape' || order.paymentMethod === 'plin') {
    paymentInstructions = `
      <div class="alert-box">
        <p class="alert-title">¡Último paso!</p>
        <p style="margin: 0; color: #1e40af;">Por favor transfiere el total de <strong>${formatPrice(order.total)}</strong> al número <strong>992 279 632</strong> (Luis Enrique) mediante Yape o Plin. Luego envía la captura a nuestro WhatsApp.</p>
      </div>
    `;
  } else if (order.paymentMethod === 'transfer') {
    paymentInstructions = `
      <div class="alert-box">
        <p class="alert-title">¡Último paso!</p>
        <p style="margin: 0; color: #1e40af;">Realiza la transferencia de <strong>${formatPrice(order.total)}</strong> a cualquiera de nuestras cuentas (BCP, Interbank o BBVA) y envíanos el comprobante por WhatsApp para liberar tu pedido. <br/><br/>Entra a tu enlace de rastreo abajo para ver los números de cuenta.</p>
      </div>
    `;
  }

  const content = `
    <h2 style="margin-top: 0;">¡Hola, ${userName.split(' ')[0]}!</h2>
    <p>Hemos recibido tu solicitud de pedido <strong>#${order.id.slice(-6).toUpperCase()}</strong>.</p>
    ${paymentInstructions}
    <h3>Resumen de tu pedido</h3>
    ${buildOrderTable(order, order.items)}
    <p><strong>Dirección de Envío:</strong><br/>${order.shippingAddress || 'Recojo en tienda'}</p>
    <div style="text-align: center;">
      <a href="${trackingUrl}" class="button">Rastrear mi pedido / Subir comprobante</a>
    </div>
  `;

  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `Aura Tech - Tu pedido #${order.id.slice(-6).toUpperCase()} está en espera de pago`,
      html: baseEmailTemplate(content),
    });
    if (response.error) {
      console.error("Resend API Error details:", response.error);
    } else {
      console.log("Correo enviado exitosamente:", response.data?.id);
    }
  } catch (error) {
    console.error("Error enviando correo de pago pendiente:", error);
  }
}

/**
 * Correo 2: Pago Confirmado (Recibo / Boleta Digital)
 */
export async function sendPaymentConfirmedEmail(order: FullOrder, userEmail: string, userName: string) {
  const resend = getResend();
  if (!resend) return;
  const trackingUrl = `${process.env.NEXTAUTH_URL || 'https://auratech.pe'}/pedido/${order.id}`;

  const dateStr = (order.paidAt || order.createdAt).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const docInfo = order.billingDocument ? `<p style="margin: 4px 0;"><strong>Documento:</strong> ${order.billingDocument}</p>` : '';
  const methodMap: Record<string, string> = { 'card': 'Tarjeta de Crédito/Débito', 'yape': 'Yape', 'plin': 'Plin', 'transfer': 'Transferencia Bancaria' };
  const methodStr = methodMap[order.paymentMethod] || order.paymentMethod;

  const content = `
    <h2 style="margin-top: 0; color: #10b981;">¡Pago Confirmado! 🎉</h2>
    <p>Hola <strong>${userName.split(' ')[0]}</strong>, hemos recibido y verificado tu pago exitosamente. A continuación, te adjuntamos el recibo digital de tu compra.</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <h3 style="margin-top: 0; margin-bottom: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; color: #0f172a;">RECIBO DIGITAL / COMPROBANTE</h3>
      
      <div style="font-size: 13px; color: #475569; margin-bottom: 20px;">
        <p style="margin: 4px 0;"><strong>N° de Pedido:</strong> #${order.id.slice(-6).toUpperCase()}</p>
        <p style="margin: 4px 0;"><strong>Fecha de emisión:</strong> ${dateStr}</p>
        <p style="margin: 4px 0;"><strong>Cliente:</strong> ${userName}</p>
        ${docInfo}
        <p style="margin: 4px 0;"><strong>Método de Pago:</strong> ${methodStr}</p>
        <p style="margin: 4px 0;"><strong>Estado:</strong> <span style="color: #10b981; font-weight: bold;">PAGADO</span></p>
      </div>

      ${buildOrderTable(order, order.items)}
      
      <div style="font-size: 13px; color: #475569; margin-top: 20px; border-top: 2px solid #e2e8f0; padding-top: 16px;">
        <p style="margin: 4px 0;"><strong>Dirección de entrega:</strong><br/>${order.shippingAddress || 'Recojo en tienda física'}</p>
      </div>
    </div>

    <p style="text-align: center; color: #64748b; font-size: 14px;">Nuestro equipo de logística ya está empacando tu pedido. Te enviaremos un correo con tu código de rastreo cuando sea despachado.</p>

    <div style="text-align: center;">
      <a href="${trackingUrl}" class="button">Seguir el estado de mi envío</a>
    </div>
  `;

  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `Comprobante de Pago - Pedido #${order.id.slice(-6).toUpperCase()} - Aura Tech`,
      html: baseEmailTemplate(content),
    });
    if (response.error) {
      console.error("Resend API Error details:", response.error);
    } else {
      console.log("Correo enviado exitosamente:", response.data?.id);
    }
  } catch (error) {
    console.error("Error enviando correo de pago confirmado:", error);
  }
}

/**
 * Correo 3: Pedido Enviado (Con Tracking)
 */
export async function sendOrderShippedEmail(order: FullOrder, userEmail: string, userName: string, courier: string, trackingNumber: string) {
  const resend = getResend();
  if (!resend) return;
  const trackingUrl = `${process.env.NEXTAUTH_URL || 'https://auratech.pe'}/pedido/${order.id}`;

  const content = `
    <h2 style="margin-top: 0;">¡Tu pedido está en camino, ${userName.split(' ')[0]}! 🚚</h2>
    <p>Excelentes noticias. Tu pedido <strong>#${order.id.slice(-6).toUpperCase()}</strong> ha sido despachado a través de <strong>${courier}</strong> y está en camino hacia ti.</p>
    
    <div class="alert-box">
      <p class="alert-title">Datos de Rastreo</p>
      <p style="margin: 0; color: #1e40af;">Agencia: <strong>${courier}</strong></p>
      <p style="margin: 0; color: #1e40af;">Código de seguimiento: <strong>${trackingNumber}</strong></p>
    </div>

    <h3>Resumen de tu compra</h3>
    ${buildOrderTable(order, order.items)}
    <p><strong>Dirección de Envío:</strong><br/>${order.shippingAddress || 'Recojo en tienda'}</p>
    <div style="text-align: center;">
      <a href="${trackingUrl}" class="button">Rastrear mi pedido</a>
    </div>
  `;

  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `¡Tu pedido #${order.id.slice(-6).toUpperCase()} ha sido enviado! 🚚`,
      html: baseEmailTemplate(content),
    });
    if (response.error) {
      console.error("Resend API Error details:", response.error);
    } else {
      console.log("Correo enviado exitosamente:", response.data?.id);
    }
  } catch (error) {
    console.error("Error enviando correo de pedido enviado:", error);
  }
}

/**
 * Correo 4: Bienvenida Newsletter
 */
export async function sendWelcomeNewsletterEmail(userEmail: string) {
  const resend = getResend();
  if (!resend) return;

  const content = `
    <h2 style="margin-top: 0; color: #1e40af;">¡Bienvenido a Aura Tech! 🚀</h2>
    <p>Hola, muchas gracias por suscribirte a nuestra comunidad exclusiva.</p>
    <p>Nos emociona tenerte con nosotros. A partir de ahora, serás el primero en enterarte de nuestros lanzamientos, promociones especiales como Cyber Days y ofertas exclusivas de tecnología antes que nadie.</p>
    
    <p style="text-align: center; color: #475569; margin-top: 24px;">Prepara tu carrito, porque muy pronto te enviaremos sorpresas.</p>
    
    <div style="text-align: center; margin-top: 32px;">
      <a href="${process.env.NEXTAUTH_URL || 'https://auratech.pe'}/tienda" class="button">Ir a la tienda</a>
    </div>
  `;

  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: '¡Tu regalo de bienvenida a Aura Tech! 🎁',
      html: baseEmailTemplate(content),
    });
    if (response.error) {
      console.error("Resend API Error details:", response.error);
    } else {
      console.log("Correo enviado exitosamente:", response.data?.id);
    }
  } catch (error) {
    console.error("Error enviando correo de bienvenida:", error);
  }
}
