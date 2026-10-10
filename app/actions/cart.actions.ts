"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

/**
 * Sincroniza el carrito de Zustand (Frontend) con la Base de Datos (Prisma)
 * Permite detectar carritos abandonados (lastActiveAt)
 */
export async function syncCartToDb(sessionId: string, items: { productId?: string; id?: string; quantity: number; variantId?: string }[]) {
  try {
    const session = await getServerSession(authOptions);
    let userId = null;

    // Si el usuario está logueado, obtenemos su ID real
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      if (user) userId = user.id;
    }

    // Buscamos si ya existe el carrito (por User ID o Session ID de invitado)
    const existingCart = await prisma.cart.findFirst({
      where: userId ? { userId } : { sessionId },
    });

    let cart;
    if (existingCart) {
      // Actualizamos la fecha de actividad (Vital para tracking de abandono)
      cart = await prisma.cart.update({
        where: { id: existingCart.id },
        data: { lastActiveAt: new Date(), sessionId, userId },
      });
    } else {
      // Creamos un nuevo carrito
      cart = await prisma.cart.create({
        data: { sessionId, userId, lastActiveAt: new Date() },
      });
    }

    // Borramos los items viejos y guardamos los nuevos para mantener el estado exacto de Zustand
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    if (items.length > 0) {
      // Filtramos para asegurarnos de guardar solo items que tengan un productId real
      const validItems = items.filter(item => item.productId || item.id);
      
      await prisma.cartItem.createMany({
        data: validItems.map((item) => ({
          cartId: cart.id,
          productId: (item.productId || item.id) as string,
          quantity: item.quantity,
          variantId: item.variantId || null,
        })),
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error sincronizando carrito:", error);
    return { success: false, error: "Error interno" };
  }
}

/**
 * Recupera el carrito guardado en la Base de Datos para un usuario logueado
 */
export async function getDbCart() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return null;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) return null;

    const cart = await prisma.cart.findFirst({
      where: { userId: user.id },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    if (!cart) return null;

    // Formatear items para que coincidan con la estructura de Zustand
    return cart.items.map(item => ({
      id: item.productId, // Usamos productId como ID para que el frontend lo procese igual
      productId: item.productId,
      variantId: item.variantId || undefined,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      maxStock: item.product.stock,
      image: (item.product.images ? JSON.parse(item.product.images)[0] : "/placeholder.webp")
    }));

  } catch (error) {
    console.error("Error obteniendo el carrito de DB:", error);
    return null;
  }
}
