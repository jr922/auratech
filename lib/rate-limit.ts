import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export type RateLimitResult = { ok: true; remaining: number } | { ok: false; retryAfterSeconds: number };

/**
 * Limitador de peticiones por ventana fija, respaldado en la BD
 * (funciona en serverless/multi-instancia sin Redis).
 *
 * Si la BD falla, "falla abierto" (deja pasar) para no tumbar la tienda por el limitador.
 */
export async function rateLimit(key: string, opts: { limit: number; windowSeconds: number }): Promise<RateLimitResult> {
  const { limit, windowSeconds } = opts;
  const now = new Date();
  try {
    // 1) Ventana vigente con cupo: incremento atómico
    const inc = await prisma.rateLimit.updateMany({
      where: { key, resetAt: { gt: now }, count: { lt: limit } },
      data: { count: { increment: 1 } },
    });
    if (inc.count === 1) {
      const row = await prisma.rateLimit.findUnique({ where: { key } });
      return { ok: true, remaining: Math.max(0, limit - (row?.count ?? limit)) };
    }

    // 2) Sin fila o ventana vencida: abrir una nueva
    const row = await prisma.rateLimit.findUnique({ where: { key } });
    if (!row || row.resetAt <= now) {
      const resetAt = new Date(now.getTime() + windowSeconds * 1000);
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt },
      });
      return { ok: true, remaining: limit - 1 };
    }

    // 3) Ventana vigente y sin cupo
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((row.resetAt.getTime() - now.getTime()) / 1000)) };
  } catch (error) {
    console.error("rateLimit falló (se permite la petición):", error);
    return { ok: true, remaining: limit };
  }
}

/** IP del cliente (detrás de proxy/CDN). Solo para claves de limitación y antifraude. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

/** Atajo: limita por IP + acción. Devuelve un mensaje listo para mostrar si se excede. */
export async function limitByIp(
  action: string,
  opts: { limit: number; windowSeconds: number }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ip = await getClientIp();
  const res = await rateLimit(`${action}:ip:${ip}`, opts);
  if (res.ok) return { ok: true };
  const minutes = Math.ceil(res.retryAfterSeconds / 60);
  return {
    ok: false,
    error: `Demasiados intentos. Inténtalo de nuevo en ${minutes <= 1 ? "1 minuto" : `${minutes} minutos`}.`,
  };
}
