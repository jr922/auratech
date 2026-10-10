import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { cancelOrderAndRestock } from "@/lib/orders";
import { ORDER_PAYMENT_TTL_MINUTES } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * Cancela los pedidos pendientes cuyo plazo de pago venció y devuelve su stock/cupón.
 * Lo invoca un cron (vercel.json) con `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now = Date.now();
  const cardCutoff = new Date(now - ORDER_PAYMENT_TTL_MINUTES.card * 60_000);
  const otherCutoff = new Date(now - ORDER_PAYMENT_TTL_MINUTES.default * 60_000);
  // No tocar una orden con un intento de pago reciente (el cliente puede estar pagando ahora mismo)
  const recentAttempt = new Date(now - 10 * 60_000);

  const expired = await prisma.order.findMany({
    where: {
      status: "PENDING",
      paymentAttempts: { none: { updatedAt: { gt: recentAttempt } } },
      OR: [
        { paymentMethod: "card", createdAt: { lt: cardCutoff } },
        { paymentMethod: { not: "card" }, createdAt: { lt: otherCutoff } },
      ],
    },
    select: { id: true },
    take: 100, // lotes acotados: el siguiente ciclo continúa
  });

  let cancelled = 0;
  let failed = 0;
  for (const { id } of expired) {
    const res = await cancelOrderAndRestock(id, {
      reason: "Expirado por falta de pago",
      actor: "SYSTEM",
      allowedFrom: ["PENDING"],
    });
    if (res.success && !res.alreadyCancelled) cancelled++;
    else if (!res.success) failed++;
  }

  if (cancelled > 0) {
    revalidatePath("/");
    revalidatePath("/tienda");
  }

  return NextResponse.json({ checked: expired.length, cancelled, failed });
}
