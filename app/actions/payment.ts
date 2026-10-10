"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { createSessionToken, isNiubizConfigured, toPurchaseNumber } from "@/lib/niubiz";
import { cancelOrderAndRestock } from "@/lib/orders";
import { ORDER_PAYMENT_TTL_MINUTES } from "@/lib/constants";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export type StartPaymentResult =
  | {
      success: true;
      sessionToken: string;
      merchantId: string;
      scriptUrl: string;
      purchaseNumber: string;
      amount: number;
      /** Ruta (relativa) a la que Niubiz enviará el resultado del formulario */
      actionUrl: string;
    }
  | { success: false; error: string; code?: "EXPIRED" | "ALREADY_PAID" | "NOT_AVAILABLE" };

const MAX_ATTEMPTS_PER_ORDER = 5;

/**
 * Inicia un intento de pago con Niubiz para una orden pendiente.
 * El monto sale SIEMPRE de la base de datos, nunca del cliente.
 */
export async function startNiubizPayment(orderId: string): Promise<StartPaymentResult> {
  try {
    if (!isNiubizConfigured()) {
      return { success: false, error: "El pago con tarjeta no está disponible por el momento.", code: "NOT_AVAILABLE" };
    }

    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as { id?: string; role?: string })?.id as string | undefined;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { id: true, email: true, createdAt: true } }, paymentAttempts: { select: { id: true } } },
    });
    if (!order || order.paymentMethod !== "card") {
      return { success: false, error: "Pedido no encontrado." };
    }
    // Si hay sesión, el pedido debe ser suyo (un invitado accede con el id del pedido, que no es adivinable)
    if (sessionUserId && sessionUserId !== order.userId && (session?.user as { id?: string; role?: string })?.role !== "ADMIN") {
      return { success: false, error: "Pedido no encontrado." };
    }
    if (order.status === "PAID") return { success: false, error: "Este pedido ya fue pagado.", code: "ALREADY_PAID" };
    if (order.status !== "PENDING") return { success: false, error: "Este pedido ya no admite pago.", code: "EXPIRED" };

    // Expiración "perezosa": si ya venció su reserva, se cancela y se devuelve el stock
    const ageMinutes = (Date.now() - order.createdAt.getTime()) / 60000;
    if (ageMinutes > ORDER_PAYMENT_TTL_MINUTES.card) {
      await cancelOrderAndRestock(order.id, { reason: "Expirado por falta de pago con tarjeta", allowedFrom: ["PENDING"] });
      return { success: false, error: "El tiempo para pagar este pedido venció. Realiza tu compra nuevamente.", code: "EXPIRED" };
    }

    if (order.paymentAttempts.length >= MAX_ATTEMPTS_PER_ORDER) {
      return { success: false, error: "Superaste el máximo de intentos de pago para este pedido." };
    }
    const ip = await getClientIp();
    const limited = await rateLimit(`pay:ip:${ip}`, { limit: 20, windowSeconds: 3600 });
    if (!limited.ok) return { success: false, error: "Demasiados intentos de pago. Inténtalo más tarde." };

    const attempt = await prisma.paymentAttempt.create({ data: { orderId: order.id, amount: order.total } });
    const purchaseNumber = toPurchaseNumber(attempt.id);

    try {
      const niubiz = await createSessionToken({
        amount: order.total,
        email: order.user.email,
        customerId: order.user.id,
        isRegistered: Boolean(sessionUserId),
        daysSinceRegistered: (Date.now() - order.user.createdAt.getTime()) / 86400000,
        clientIp: ip,
      });

      return {
        success: true,
        sessionToken: niubiz.sessionToken,
        merchantId: niubiz.merchantId,
        scriptUrl: niubiz.scriptUrl,
        purchaseNumber,
        amount: Number(order.total.toFixed(2)),
        actionUrl: `/api/niubiz/callback?orderId=${encodeURIComponent(order.id)}&attempt=${attempt.id}`,
      };
    } catch (error) {
      await prisma.paymentAttempt.update({
        where: { id: attempt.id },
        data: { status: "ERROR", rawResponse: JSON.stringify({ error: String((error as Error)?.message) }) },
      });
      console.error("Niubiz: error creando sesión:", error);
      return { success: false, error: "No pudimos iniciar el pago. Inténtalo nuevamente en unos minutos." };
    }
  } catch (error) {
    console.error("startNiubizPayment:", error);
    return { success: false, error: "Ocurrió un error al iniciar el pago." };
  }
}
