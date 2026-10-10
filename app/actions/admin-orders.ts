"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { revalidatePath } from "next/cache";
import { cancelOrderAndRestock } from "@/lib/orders";
import { sendPaymentConfirmedEmail, sendOrderShippedEmail } from "@/lib/mail";

export async function getAdminOrders() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string; id?: string }).role !== "ADMIN") {
      throw new Error("No autorizado");
    }

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    });

    return orders;
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    return [];
  }
}

export async function updateOrderStatus(orderId: string, newStatus: string, notes?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string; id?: string }).role !== "ADMIN") {
      return { success: false, error: "No autorizado" };
    }

    const adminId = (session.user as { role?: string; id?: string }).id;

    if (newStatus === "CANCELLED") {
      const res = await cancelOrderAndRestock(orderId, {
        reason: notes || "Cancelado por Administrador",
        actor: adminId,
      });
      if (!res.success) return { success: false, error: res.error };
      revalidatePath("/admin/pedidos");
      revalidatePath("/tienda");
      revalidatePath(`/pedido/${orderId}`);
      return { success: true };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, items: true }
    });
    if (!order) return { success: false, error: "Orden no encontrada" };

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { 
          status: newStatus,
          ...(newStatus === "PAID" && !order.paidAt ? { paidAt: new Date() } : {})
        },
      });

      await tx.orderHistory.create({
        data: {
          orderId,
          status: newStatus,
          notes: notes || `Estado actualizado a ${newStatus} por Administrador`,
          createdBy: adminId,
        },
      });
    });

    // Send email if marked as PAID and it wasn't paid before
    if (newStatus === "PAID" && order.status !== "PAID") {
      // @ts-expect-error Types are close enough
      sendPaymentConfirmedEmail(order, order.user?.email || "anon", order.user?.name || "Cliente").catch(console.error);
    }

    revalidatePath("/admin/pedidos");
    revalidatePath(`/pedido/${orderId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { success: false, error: "No se pudo actualizar el estado" };
  }
}

export async function dispatchOrder(orderId: string, courier: string, trackingNumber: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string; id?: string }).role !== "ADMIN") {
      return { success: false, error: "No autorizado" };
    }

    const adminId = (session.user as { role?: string; id?: string }).id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, items: true }
    });
    if (!order) return { success: false, error: "Orden no encontrada" };

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { 
          status: "SHIPPED",
          courier,
          trackingNumber
        },
      });

      await tx.orderHistory.create({
        data: {
          orderId,
          status: "SHIPPED",
          notes: `Enviado por ${courier} - Tracking: ${trackingNumber}`,
          createdBy: adminId,
        },
      });
    });

    // Send Email
    // @ts-expect-error Types are close enough
    sendOrderShippedEmail(order, order.user?.email || "anon", order.user?.name || "Cliente", courier, trackingNumber).catch(console.error);

    revalidatePath("/admin/pedidos");
    revalidatePath(`/pedido/${orderId}`);
    return { success: true };
  } catch (error) {
    console.error("Error dispatching order:", error);
    return { success: false, error: "No se pudo despachar la orden" };
  }
}
