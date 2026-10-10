"use server";

import { prisma } from "@/lib/prisma";
import { limitByIp } from "@/lib/rate-limit";
import { sendWelcomeNewsletterEmail } from "@/lib/mail";

export async function submitContact(data: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}) {
  try {
    const rateRes = await limitByIp("contact", { limit: 3, windowSeconds: 3600 }); // 3 per hour
    if (!rateRes.ok) return { success: false, error: rateRes.error };

    await prisma.contactMessage.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject || null,
        message: data.message
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Error en contacto:", error);
    return { success: false, error: "Error al enviar el mensaje." };
  }
}

export async function submitClaim(data: {
  name: string;
  docType: string;
  docNumber: string;
  address: string;
  phone: string;
  email: string;
  claimType: string;
  goodsType: string;
  amount: number;
  description: string;
  claimDetail: string;
  customerOrder: string;
}) {
  const limit = await limitByIp("submitClaim", { limit: 3, windowSeconds: 3600 });
  if (!limit.ok) return { error: limit.error };

  try {
    const rateRes = await limitByIp("claim", { limit: 2, windowSeconds: 86400 }); // 2 per day
    if (!rateRes.ok) return { success: false, error: rateRes.error };

    const claim = await prisma.claim.create({
      data: {
        name: data.name,
        docType: data.docType,
        docNumber: data.docNumber,
        address: data.address,
        phone: data.phone,
        email: data.email,
        claimType: data.claimType,
        goodsType: data.goodsType,
        amount: data.amount,
        description: data.description,
        claimDetail: data.claimDetail,
        customerOrder: data.customerOrder
      }
    });
    return { success: true, claimId: claim.id };
  } catch (error) {
    console.error("Error en reclamo:", error);
    return { success: false, error: "Error al enviar el reclamo." };
  }
}

export async function subscribeNewsletter(email: string) {
  try {
    const rateRes = await limitByIp("newsletter", { limit: 5, windowSeconds: 3600 }); // 5 per hour
    if (!rateRes.ok) return { success: false, error: rateRes.error };

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (existing) {
      return { success: true, isNew: false, message: 'Ya estabas suscrito. ¡Usa tu código AURA-ENVIO!' };
    }
    await prisma.newsletterSubscriber.create({ data: { email } });
    
    // Disparar el correo de bienvenida sin bloquear la respuesta
    sendWelcomeNewsletterEmail(email).catch(console.error);

    return { success: true, isNew: true, message: 'Suscrito con éxito' };
  } catch {
    return { success: false, error: 'Error al suscribirse' };
  }
}
