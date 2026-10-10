"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { limitByIp } from "@/lib/rate-limit";

export async function submitReview(data: {
  productId: string;
  rating: number;
  comment: string;
  authorName: string;
}) {
  try {
    const rateRes = await limitByIp("review", { limit: 5, windowSeconds: 86400 }); // 5 reviews per day
    if (!rateRes.ok) return { success: false, error: rateRes.error };

    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as { id?: string }).id) {
      return { success: false, error: "Debes iniciar sesión para valorar un producto." };
    }

    const userId = (session.user as { id?: string }).id;

    if (!data.rating || data.rating < 1 || data.rating > 5) {
      return { success: false, error: "Por favor, selecciona una calificación válida (1-5)." };
    }
    if (!data.comment || data.comment.trim().length < 5) {
      return { success: false, error: "El comentario debe tener al menos 5 caracteres." };
    }
    if (!data.authorName || data.authorName.trim().length < 2) {
      return { success: false, error: "Por favor ingresa un nombre válido." };
    }

    // Verificar si el usuario realmente compró el producto
    const hasPurchased = await prisma.order.findFirst({
      where: {
        userId: userId,
        status: { not: "CANCELLED" }, // Solo cuenta si la orden no está cancelada
        items: {
          some: {
            productId: data.productId
          }
        }
      }
    });

    if (!hasPurchased) {
      return { success: false, error: "Solo puedes valorar productos que hayas comprado." };
    }

    // Opcional: Evitar múltiples reviews del mismo usuario para el mismo producto
    // const existingReview = await prisma.review.findFirst({ ... })

    const review = await prisma.review.create({
      data: {
        productId: data.productId,
        rating: data.rating,
        comment: data.comment.trim(),
        authorName: data.authorName.trim(), // idealmente deberíamos usar el nombre del usuario logueado
      }
    });

    // Forzar actualización de la caché para que se vea reflejado instantáneamente
    revalidatePath(`/producto/${data.productId}`);
    
    return { success: true, review };
  } catch (error) {
    console.error("Error submitting review:", error);
    return { success: false, error: "Ocurrió un error al enviar tu valoración." };
  }
}
