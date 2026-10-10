"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { z } from "zod";
import { MAX_ADDRESSES, syncUserMirror, ensureOneDefault } from "@/lib/address-book";

const addressSchema = z.object({
  title: z.string().trim().min(2, "Ponle un nombre (Casa, Oficina...)").max(30),
  addressLine: z.string().trim().min(5, "Dirección muy corta").max(200),
  state: z.string().trim().min(3, "Selecciona el departamento"),
  province: z.string().trim().min(3, "Selecciona la provincia"),
  city: z.string().trim().min(3, "Indica el distrito"),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;

async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string })?.id as string | undefined;
  if (!id) throw new Error("No autorizado");
  return id;
}

export async function getMyAddresses() {
  try {
    const userId = await requireUserId();
    return await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { title: "asc" }],
    });
  } catch {
    return [];
  }
}

export async function saveAddress(input: AddressInput, addressId?: string) {
  try {
    const userId = await requireUserId();
    const parsed = addressSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Datos inválidos" };
    }
    const { isDefault, phone, ...data } = parsed.data;

    await prisma.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId } });

      if (addressId) {
        const owned = await tx.address.findFirst({ where: { id: addressId, userId } });
        if (!owned) throw new Error("Dirección no encontrada");
      } else if (count >= MAX_ADDRESSES) {
        throw new Error(`Máximo ${MAX_ADDRESSES} direcciones guardadas`);
      }

      // La primera dirección siempre es la predeterminada
      const makeDefault = isDefault || (!addressId && count === 0);
      if (makeDefault) {
        await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      }

      const payload = { ...data, phone: phone || null };
      if (addressId) {
        await tx.address.update({
          where: { id: addressId },
          data: { ...payload, ...(makeDefault && { isDefault: true }) },
        });
      } else {
        await tx.address.create({ data: { ...payload, userId, isDefault: makeDefault } });
      }

      await ensureOneDefault(tx, userId);
      await syncUserMirror(tx, userId);
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Error guardando dirección:", error);
    return { success: false, error: error instanceof Error ? error.message : "No se pudo guardar la dirección" };
  }
}

export async function setDefaultAddress(addressId: string) {
  try {
    const userId = await requireUserId();
    await prisma.$transaction(async (tx) => {
      const owned = await tx.address.findFirst({ where: { id: addressId, userId } });
      if (!owned) throw new Error("Dirección no encontrada");
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      await tx.address.update({ where: { id: addressId }, data: { isDefault: true } });
      await syncUserMirror(tx, userId);
    });
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "No se pudo actualizar" };
  }
}

export async function deleteAddress(addressId: string) {
  try {
    const userId = await requireUserId();
    await prisma.$transaction(async (tx) => {
      const owned = await tx.address.findFirst({ where: { id: addressId, userId } });
      if (!owned) throw new Error("Dirección no encontrada");
      await tx.address.delete({ where: { id: addressId } });
      await ensureOneDefault(tx, userId);
      await syncUserMirror(tx, userId);
    });
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "No se pudo eliminar" };
  }
}
