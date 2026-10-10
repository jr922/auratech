import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatAddress } from "@/lib/address";

export const MAX_ADDRESSES = 10;

/**
 * Mantiene User.address como espejo de la dirección predeterminada
 * (compatibilidad con código legado que aún lee User.address).
 */
export async function syncUserMirror(tx: Prisma.TransactionClient, userId: string) {
  const def = await tx.address.findFirst({ where: { userId, isDefault: true } });
  await tx.user.update({
    where: { id: userId },
    data: { address: def ? formatAddress(def) : null },
  });
}

/** Garantiza que, si existen direcciones, exactamente una sea la predeterminada */
export async function ensureOneDefault(tx: Prisma.TransactionClient, userId: string) {
  const hasDefault = await tx.address.findFirst({ where: { userId, isDefault: true } });
  if (hasDefault) return;
  const first = await tx.address.findFirst({ where: { userId }, orderBy: { id: "asc" } });
  if (first) await tx.address.update({ where: { id: first.id }, data: { isDefault: true } });
}

export type CheckoutAddressDetail = {
  addressLine: string;
  city: string; // distrito
  province: string;
  state: string; // departamento
};

/**
 * Guarda la dirección usada en el checkout en la libreta del usuario,
 * evitando duplicados. La primera dirección queda como predeterminada.
 * No debe romper nunca la compra: el llamador lo envuelve en try/catch.
 */
export async function rememberCheckoutAddress(
  userId: string,
  detail: CheckoutAddressDetail,
  phone?: string | null
) {
  const norm = (s: string) => s.trim().toLowerCase();
  await prisma.$transaction(async (tx) => {
    const existing = await tx.address.findMany({ where: { userId } });
    const duplicate = existing.some(
      (a) =>
        norm(a.addressLine) === norm(detail.addressLine) &&
        norm(a.city) === norm(detail.city) &&
        norm(a.province || "") === norm(detail.province) &&
        norm(a.state) === norm(detail.state)
    );
    if (duplicate || existing.length >= MAX_ADDRESSES) return;

    await tx.address.create({
      data: {
        userId,
        title: existing.length === 0 ? "Principal" : `Dirección ${existing.length + 1}`,
        addressLine: detail.addressLine.trim(),
        city: detail.city.trim(),
        province: detail.province.trim(),
        state: detail.state.trim(),
        phone: phone || null,
        isDefault: existing.length === 0,
      },
    });
    await ensureOneDefault(tx, userId);
    await syncUserMirror(tx, userId);
  });
}
