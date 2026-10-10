"use server";

import { prisma } from "@/lib/prisma";
import { limitByIp } from "@/lib/rate-limit";

export async function validateCoupon(code: string, subtotal: number) {
  try {
    const rateRes = await limitByIp("coupon", { limit: 10, windowSeconds: 3600 }); // 10 attempts per hour
    if (!rateRes.ok) return { success: false, error: rateRes.error };

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!coupon) {
      return { success: false, error: "El cupón no existe." };
    }

    if (!coupon.isActive) {
      return { success: false, error: "El cupón ya no está activo." };
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return { success: false, error: "El cupón ha superado su límite de usos." };
    }

    // Calcular el descuento a aplicar
    let discountAmount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (subtotal * coupon.discountValue) / 100;
    } else if (coupon.discountType === "FIXED") {
      discountAmount = coupon.discountValue;
      // No permitir que el descuento sea mayor que el subtotal
      if (discountAmount > subtotal) {
        discountAmount = subtotal;
      }
    }

    return { 
      success: true, 
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType as "PERCENTAGE" | "FIXED",
        discountValue: coupon.discountValue
      }
    };
  } catch (error) {
    console.error("Error validating coupon:", error);
    return { success: false, error: "Error interno al validar el cupón." };
  }
}

// trigger reload 2
