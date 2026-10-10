"use server";

import { prisma } from "@/lib/prisma";

export async function trackOrder(shortOrderId: string, email: string) {
  try {
    const cleanId = shortOrderId.replace('#', '').trim().toLowerCase();
    
    if (cleanId.length < 5 || !email) {
      return { success: false, error: "Datos de búsqueda inválidos." };
    }

    const order = await prisma.order.findFirst({
      where: {
        id: { endsWith: cleanId },
        user: { email: email.toLowerCase().trim() }
      }
    });

    if (!order) {
      return { success: false, error: "No se encontró ningún pedido con esos datos." };
    }

    return { success: true, fullOrderId: order.id };
  } catch (error) {
    console.error("Error tracking order:", error);
    return { success: false, error: "Ocurrió un error al buscar el pedido." };
  }
}
