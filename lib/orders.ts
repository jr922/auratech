import { prisma } from "@/lib/prisma";
import { MAIN_WAREHOUSE_ID, CANCELLABLE_STATUSES } from "@/lib/constants";
import { sendOrderConfirmationEmail } from "@/lib/emails";

type CancelOptions = {
  reason: string;
  /** Quién cancela: id del admin/cliente o "SYSTEM" (expiración automática) */
  actor?: string;
  /** Estados permitidos como origen (por defecto, todos los cancelables) */
  allowedFrom?: readonly string[];
};

export type CancelResult =
  | { success: true; alreadyCancelled?: boolean; restoredProductIds: string[] }
  | { success: false; error: string };

/**
 * Cancela una orden y revierte TODO lo que la venta consumió:
 * stock (producto/variante), stock de almacén, kardex y uso del cupón.
 *
 * Es idempotente y segura ante concurrencia: la transición de estado se hace con
 * un UPDATE condicional, de modo que solo una ejecución llega a reponer stock.
 */
export async function cancelOrderAndRestock(orderId: string, opts: CancelOptions): Promise<CancelResult> {
  const { reason, actor = "SYSTEM", allowedFrom = CANCELLABLE_STATUSES } = opts;

  try {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
      if (!order) return { success: false as const, error: "Pedido no encontrado" };
      if (order.status === "CANCELLED") {
        return { success: true as const, alreadyCancelled: true, restoredProductIds: [] };
      }

      // Transición atómica: si otra ejecución ya cambió el estado, count = 0
      const transition = await tx.order.updateMany({
        where: { id: orderId, status: { in: [...allowedFrom] } },
        data: { status: "CANCELLED" },
      });
      if (transition.count === 0) {
        return {
          success: false as const,
          error: `No se puede cancelar un pedido en estado ${order.status}`,
        };
      }

      const restoredProductIds: string[] = [];

      for (const item of order.items) {
        if (!item.productId) continue; // producto ya eliminado físicamente
        const productId = item.productId;

        if (item.variantId) {
          await tx.productVariant.updateMany({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        } else {
          await tx.product.updateMany({
            where: { id: productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        await tx.warehouseStock.updateMany({
          where: { productId, warehouseId: MAIN_WAREHOUSE_ID, variantId: item.variantId ?? null },
          data: { quantity: { increment: item.quantity } },
        });

        await tx.inventoryLog.create({
          data: {
            productId,
            variantId: item.variantId ?? null,
            warehouseId: MAIN_WAREHOUSE_ID,
            reason: "RETURN",
            quantity: item.quantity,
            notes: `Cancelación de orden ${order.id}: ${reason}`,
            createdBy: actor,
          },
        });

        restoredProductIds.push(productId);
      }

      // Devolver el uso del cupón (sin bajar de 0)
      if (order.couponCode) {
        await tx.coupon.updateMany({
          where: { code: order.couponCode, usedCount: { gt: 0 } },
          data: { usedCount: { decrement: 1 } },
        });
      }

      await tx.orderHistory.create({
        data: { orderId, status: "CANCELLED", notes: reason, createdBy: actor },
      });

      return { success: true as const, restoredProductIds };
    });
  } catch (error) {
    console.error("Error cancelando orden:", error);
    return { success: false, error: "No se pudo cancelar el pedido" };
  }
}

/**
 * Marca una orden como pagada. Idempotente: solo transiciona desde PENDING.
 * Devuelve false si la orden ya no estaba pendiente (p. ej. fue cancelada/expiró).
 */
export async function markOrderPaid(orderId: string, notes: string, actor = "SYSTEM"): Promise<boolean> {
  const success = await prisma.$transaction(async (tx) => {
    const res = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: { status: "PAID", paidAt: new Date() },
    });
    if (res.count === 0) return false;
    await tx.orderHistory.create({
      data: { orderId, status: "PAID", notes, createdBy: actor },
    });
    return true;
  });

  if (success) {
    // Buscar datos para el email (fuera de la transacción para no bloquear la BD)
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });
    if (order && order.user?.email) {
      await sendOrderConfirmationEmail(order.user.email, order.id, order.total);
    }
  }

  return success;
}
