"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { revalidatePath } from "next/cache";
import { MAIN_WAREHOUSE_ID } from "@/lib/constants";

export async function getAdminProducts() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string; id?: string }).role !== "ADMIN") {
      throw new Error("No autorizado");
    }

    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
      },
    });

    return products;
  } catch (error) {
    console.error("Error fetching admin products:", error);
    return [];
  }
}

export async function updateProductStock(productId: string, newStock: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string; id?: string }).role !== "ADMIN") {
      return { success: false, error: "No autorizado" };
    }

    const adminId = (session.user as { role?: string; id?: string }).id;

    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error("Producto no encontrado");

      const stockDiff = newStock - product.stock;

      if (stockDiff !== 0) {
        await tx.product.update({
          where: { id: productId },
          data: { stock: newStock },
        });

        // Actualizar WarehouseStock
        const warehouseStock = await tx.warehouseStock.findFirst({
          where: { productId, warehouseId: MAIN_WAREHOUSE_ID, variantId: null }
        });
        if (warehouseStock) {
          await tx.warehouseStock.update({
            where: { id: warehouseStock.id },
            data: { quantity: newStock }
          });
        }

        await tx.inventoryLog.create({
          data: {
            productId,
            warehouseId: MAIN_WAREHOUSE_ID,
            reason: "ADJUSTMENT",
            quantity: stockDiff,
            notes: `Ajuste manual de stock por Administrador`,
            createdBy: adminId,
          },
        });
      }
    });

    revalidatePath("/admin/productos");
    revalidatePath("/tienda");
    revalidatePath(`/producto/${productId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating product stock:", error);
    return { success: false, error: "No se pudo actualizar el stock" };
  }
}

export async function updateProductPrice(productId: string, newPrice: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string; id?: string }).role !== "ADMIN") {
      return { success: false, error: "No autorizado" };
    }

    await prisma.product.update({
      where: { id: productId },
      data: { price: newPrice },
    });

    revalidatePath("/admin/productos");
    revalidatePath("/tienda");
    revalidatePath(`/producto/${productId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating product price:", error);
    return { success: false, error: "No se pudo actualizar el precio" };
  }
}
