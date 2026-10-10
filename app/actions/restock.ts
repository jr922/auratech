"use server";

import { prisma } from "@/lib/prisma";
import { limitByIp } from "@/lib/rate-limit";

export async function submitRestockRequest(data: {
  email: string;
  productId: string;
  variantId?: string;
}) {
  try {
    const rateRes = await limitByIp("restock", { limit: 5, windowSeconds: 3600 }); // 5 requests per hour
    if (!rateRes.ok) return { success: false, error: rateRes.error };

    // Basic validation
    if (!data.email || !data.email.includes("@")) {
      return { success: false, error: "Correo inválido" };
    }

    // Check if user already requested this exact product/variant
    const existing = await prisma.restockRequest.findFirst({
      where: {
        email: data.email,
        productId: data.productId,
        variantId: data.variantId || null
      }
    });

    if (existing) {
      return { success: false, error: "Ya estás suscrito a notificaciones para este producto" };
    }

    await prisma.restockRequest.create({
      data: {
        email: data.email,
        productId: data.productId,
        variantId: data.variantId || null
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating restock request:", error);
    return { success: false, error: "Ocurrió un error al procesar tu solicitud" };
  }
}
