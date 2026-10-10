import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeTransaction, toPurchaseNumber } from "@/lib/niubiz";
import { markOrderPaid } from "@/lib/orders";
import { sendPaymentConfirmedEmail } from "@/lib/mail";

export const dynamic = "force-dynamic";

function redirectTo(req: NextRequest, path: string) {
  const base = process.env.NEXTAUTH_URL || req.nextUrl.origin;
  // 303: convierte el POST de Niubiz en un GET hacia nuestra página
  return NextResponse.redirect(new URL(path, base), 303);
}

/**
 * Niubiz envía aquí (POST) el resultado del formulario de pago con `transactionToken`.
 * Este endpoint NO confía en nada del cliente salvo ese token de un solo uso:
 * el monto y la orden salen de nuestra base de datos y la autorización la hacemos
 * server-to-server con Niubiz.
 */
export async function POST(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId") ?? "";
  const attemptId = Number(req.nextUrl.searchParams.get("attempt"));

  try {
    const form = await req.formData();
    const transactionToken = String(form.get("transactionToken") ?? "");

    if (!orderId || !Number.isInteger(attemptId) || !transactionToken) {
      return redirectTo(req, `/pago/${encodeURIComponent(orderId)}?error=invalid`);
    }

    const attempt = await prisma.paymentAttempt.findUnique({
      where: { id: attemptId },
      include: { order: true },
    });
    if (!attempt || attempt.orderId !== orderId) {
      return redirectTo(req, `/pago/${encodeURIComponent(orderId)}?error=invalid`);
    }

    // Idempotencia: este intento ya fue procesado (recarga/doble envío del navegador)
    if (attempt.status !== "CREATED") {
      return attempt.status === "APPROVED"
        ? redirectTo(req, `/order-received?orderId=${orderId}&method=card`)
        : redirectTo(req, `/pago/${orderId}?error=denied`);
    }

    // La orden debe seguir pendiente: si venció/canceló NO autorizamos (no cobramos algo sin stock reservado)
    if (attempt.order.status !== "PENDING") {
      await prisma.paymentAttempt.update({
        where: { id: attempt.id },
        data: { status: "ERROR", rawResponse: JSON.stringify({ reason: `order_${attempt.order.status}` }) },
      });
      return attempt.order.status === "PAID"
        ? redirectTo(req, `/order-received?orderId=${orderId}&method=card`)
        : redirectTo(req, `/pago/${orderId}?error=expired`);
    }

    // Marcamos el intento antes de llamar a Niubiz para que un doble envío no cobre dos veces
    const claimed = await prisma.paymentAttempt.updateMany({
      where: { id: attempt.id, status: "CREATED" },
      data: { status: "PROCESSING" },
    });
    if (claimed.count === 0) {
      return redirectTo(req, `/pago/${orderId}?error=processing`);
    }

    let result;
    try {
      result = await authorizeTransaction({
        transactionToken,
        purchaseNumber: toPurchaseNumber(attempt.id),
        amount: attempt.amount, // monto de la BD, no del cliente
      });
    } catch (error) {
      console.error("Niubiz: error en autorización:", error);
      await prisma.paymentAttempt.update({
        where: { id: attempt.id },
        data: { status: "ERROR", rawResponse: JSON.stringify({ error: String((error as Error)?.message) }) },
      });
      return redirectTo(req, `/pago/${orderId}?error=gateway`);
    }

    await prisma.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: result.approved ? "APPROVED" : "DENIED",
        actionCode: result.actionCode,
        transactionId: result.transactionId,
        rawResponse: JSON.stringify(result.audit),
      },
    });

    if (!result.approved) {
      return redirectTo(req, `/pago/${orderId}?error=denied`);
    }

    const marked = await markOrderPaid(orderId, `Pago con tarjeta aprobado (Niubiz, transacción ${result.transactionId ?? "s/n"}).`);
    if (!marked) {
      // Caso límite: Niubiz cobró pero la orden se canceló en el medio. Requiere reembolso manual.
      console.error(`ALERTA: pago aprobado (${result.transactionId}) sobre la orden ${orderId} que ya no estaba pendiente. Requiere reembolso.`);
      await prisma.orderHistory.create({
        data: {
          orderId,
          status: attempt.order.status,
          notes: `⚠️ Pago aprobado en Niubiz (transacción ${result.transactionId}) sobre una orden no pendiente. REQUIERE REEMBOLSO MANUAL.`,
          createdBy: "SYSTEM",
        },
      });
    }


    if (marked) {
      const fullOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true, user: true }
      });
      if (fullOrder && (fullOrder.user?.email || fullOrder.customerEmail)) {
        const emailTo = fullOrder.user?.email || fullOrder.customerEmail || "";
        sendPaymentConfirmedEmail(fullOrder, emailTo, fullOrder.user?.name || fullOrder.customerName || "Cliente").catch(e => console.error("Error correo Niubiz:", e));
      }
    }
    return redirectTo(req, `/order-received?orderId=${orderId}&method=card`);
  } catch (error) {
    console.error("Niubiz callback:", error);
    return redirectTo(req, `/pago/${encodeURIComponent(orderId)}?error=gateway`);
  }
}
