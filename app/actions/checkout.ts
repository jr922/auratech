"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { sendPendingPaymentEmail } from "@/lib/mail";
import { rememberCheckoutAddress, type CheckoutAddressDetail } from "@/lib/address-book";
import { MAIN_WAREHOUSE_ID } from "@/lib/constants";

export async function processCheckout(data: {
  name: string;
  email: string;
  document: string;
  address: string;
  addressDetail?: CheckoutAddressDetail;
  phone?: string;
  paymentMethod: string;
  items: { id: string; productId: string; variantId?: string; quantity: number }[];
  shippingOption?: 'lima' | 'provincia' | 'tienda';
  couponCode?: string | null;
  expectedTotal: number;
}) {
  try {
    if (!["yape", "plin", "card", "transfer"].includes(data.paymentMethod)) {
      return { success: false, error: "Método de pago no válido." };
    }
    if (!Array.isArray(data.items) || data.items.length === 0) {
      return { success: false, error: "Tu carrito está vacío." };
    }

    const session = await getServerSession(authOptions);
    let userId: string | null = null;
    let canUpdateUserData = false;

    if (session?.user && (session.user as { id?: string }).id) {
      userId = (session.user as { id?: string }).id as string;
      canUpdateUserData = true;
    } else {
      // ESTILO NIKE: Si es invitado, verificamos si existe su correo, si existe lo enlazamos,
      // pero si NO existe, NO creamos un usuario. Lo dejamos como userId = null.
      const existingUser = await prisma.user.findUnique({ where: { email: data.email.trim().toLowerCase() } });
      if (existingUser) {
        userId = existingUser.id;
        canUpdateUserData = false; // No actualizar documento de usuario existente desde invitado
      } else {
        userId = null; // Invitado puro, no creamos cuenta
      }
    }

    if (userId && canUpdateUserData) {
      await prisma.user.update({
        where: { id: userId },
        data: { document: data.document }
      });
    }

    const order = await prisma.$transaction(async (tx) => {
      let calculatedSubtotal = 0;
      const orderItemsToCreate = [];

      // 1. Verificar stock y obtener precios reales
      for (const item of data.items) {
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          throw new Error("Cantidad de producto inválida.");
        }

        let realPrice = 0;
        let finalProductName = "Producto desconocido";
        let finalProductImage = "/placeholder.webp";

        // Siempre obtenemos el producto base para guardar su nombre e imagen de forma inmutable
        const baseProduct = await tx.product.findUnique({ where: { id: item.productId } });
        if (!baseProduct) throw new Error("Producto no encontrado en la base de datos.");
        if (baseProduct.status !== "PUBLISHED" || baseProduct.deletedAt) {
          throw new Error(`"${baseProduct.name}" ya no está disponible. Retíralo de tu carrito para continuar.`);
        }
        
        let parsedImages = ['/placeholder.webp'];
        try {
          const parsed = JSON.parse(baseProduct.images);
          if (Array.isArray(parsed) && parsed.length > 0) parsedImages = parsed;
        } catch {}
        finalProductImage = parsedImages[0] || "/placeholder.webp";

        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
          if (!variant || variant.stock < item.quantity) {
            throw new Error(`Stock insuficiente para la variante seleccionada.`);
          }
          realPrice = variant.price;
          finalProductName = `${baseProduct.name} (${variant.name})`;
          
          // Decremento atómico: solo descuenta si todavía hay stock suficiente
          const variantUpdate = await tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } }
          });
          if (variantUpdate.count === 0) {
            throw new Error(`Stock insuficiente para la variante seleccionada.`);
          }
          
          const variantWarehouseStock = await tx.warehouseStock.findFirst({
            where: { productId: item.productId, warehouseId: MAIN_WAREHOUSE_ID, variantId: item.variantId }
          });
          if (variantWarehouseStock) {
            await tx.warehouseStock.update({
              where: { id: variantWarehouseStock.id },
              data: { quantity: { decrement: item.quantity } }
            });
          }
        } else {
          if (baseProduct.stock < item.quantity) {
            throw new Error(`Stock insuficiente para el producto seleccionado.`);
          }
          realPrice = baseProduct.price;
          finalProductName = baseProduct.name;
          
          // Decremento atómico: solo descuenta si todavía hay stock suficiente
          const productUpdate = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } }
          });
          if (productUpdate.count === 0) {
            throw new Error(`Stock insuficiente para el producto seleccionado.`);
          }
          
          // Actualizar WarehouseStock
          const warehouseStock = await tx.warehouseStock.findFirst({
            where: { productId: item.productId, warehouseId: MAIN_WAREHOUSE_ID, variantId: null }
          });
          if (warehouseStock) {
            await tx.warehouseStock.update({
              where: { id: warehouseStock.id },
              data: { quantity: { decrement: item.quantity } }
            });
          }
        }

        calculatedSubtotal += realPrice * item.quantity;
        
        orderItemsToCreate.push({
          productId: item.productId,
          productName: finalProductName,
          productImage: finalProductImage,
          variantId: item.variantId || null,
          quantity: item.quantity,
          price: realPrice
        });
      }

      // 2. Calcular descuentos (Cupón y Bundle)
      let discountAmount = 0;
      let isFreeShipping = false;
      
      if (data.couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: data.couponCode } });
        if (!coupon || !coupon.isActive) {
          throw new Error("El cupón ingresado ya no es válido o ha expirado.");
        }
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          throw new Error("Este cupón ha superado su límite de usos.");
        }

        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = calculatedSubtotal * (coupon.discountValue / 100);
        } else if (coupon.discountType === 'FIXED') {
          discountAmount = coupon.discountValue;
        } else if (coupon.discountType === 'FREE_SHIPPING') {
          isFreeShipping = true;
          discountAmount = 0;
        }
        
        // El descuento nunca puede superar el subtotal
        discountAmount = Math.min(discountAmount, calculatedSubtotal);

        // Incremento atómico: respeta el límite de usos aun con compras simultáneas
        const couponUpdate = await tx.coupon.updateMany({
          where: {
            id: coupon.id,
            isActive: true,
            ...(coupon.usageLimit ? { usedCount: { lt: coupon.usageLimit } } : {}),
          },
          data: { usedCount: { increment: 1 } }
        });
        if (couponUpdate.count === 0) {
          throw new Error("Este cupón ha superado su límite de usos.");
        }
      }

      // 3. Calcular envío
      let shippingCost = 0;
      if (data.shippingOption === 'tienda' || isFreeShipping) {
        shippingCost = 0;
      } else if (data.shippingOption === 'lima') {
        shippingCost = 10;
      } else if (data.shippingOption === 'provincia') {
        shippingCost = 25;
      }

      const finalTotal = Math.max(0, calculatedSubtotal - discountAmount) + shippingCost;

      // 4. PRICE HANDSHAKE (Candado Financiero)
      if (Math.abs(finalTotal - data.expectedTotal) > 0.01) {
        throw new Error("El precio de algunos productos o el cupón han sido actualizados en tiempo real. Por favor, revisa el nuevo total en tu carrito antes de pagar.");
      }

      // 4. Crear la orden con el total validado y los DATOS DE ENVÍO
      const newOrder = await tx.order.create({
        data: {
          userId,
          customerEmail: data.email.trim().toLowerCase(),
          customerName: data.name,
          customerPhone: data.phone || null,
          total: finalTotal,
          // Toda orden nace PENDING: solo pasa a PAID cuando el pago se confirma
          // (autorización de Niubiz o verificación manual de Yape/Plin/transferencia).
          status: "PENDING",
          paymentMethod: data.paymentMethod,
          couponCode: data.couponCode || null,
          discountAmount,
          shippingCost,
          shippingAddress: data.address,
          billingDocument: data.document,
          shippingOption: data.shippingOption,
          items: {
            create: orderItemsToCreate
          },
          history: {
            create: [
              { 
                status: "PENDING", 
                notes: data.paymentMethod === 'card'
                  ? "Orden generada a través de la web. Pendiente de pago con tarjeta."
                  : "Orden generada a través de la web. Pendiente de confirmación de pago.", 
                createdBy: userId || "GUEST" 
              }
            ]
          }
        },
          include: { items: true }
      });

      // 5. Crear el registro en el Kardex (InventoryLog)
      for (const item of data.items) {
        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            variantId: item.variantId || null,
            warehouseId: MAIN_WAREHOUSE_ID, // Ajusta si usas múltiples almacenes
            reason: "SALE",
            quantity: -item.quantity,
            notes: `Venta web. Orden: ${newOrder.id}`
          }
        });
      }

      return newOrder;
    });

    // Guardar la dirección en la libreta del cliente (best-effort, no afecta la compra).
    // Solo con sesión iniciada: un invitado no debe escribir en la libreta de una cuenta existente.
    if (data.addressDetail && session?.user && userId) {
      try {
        await rememberCheckoutAddress(userId, data.addressDetail, data.phone);
      } catch (e) {
        console.error("No se pudo guardar la dirección del checkout:", e);
      }
    }

    if (data.paymentMethod !== "card") {
      sendPendingPaymentEmail(order, data.email, data.name).catch((e) => {
        console.error("Error enviando correo de pago pendiente:", e);
      });
    }

    try {
      revalidatePath("/");
      revalidatePath("/tienda");
      data.items.forEach(item => {
        revalidatePath(`/producto/${item.productId}`);
      });
    } catch (e) {
      console.error("Error revalidating cache:", e);
    }

    return { success: true, orderId: order.id, requiresPayment: data.paymentMethod === "card" };
  } catch (error: unknown) {
    console.error("Error procesando checkout:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error al procesar el pedido" };
  }
}
