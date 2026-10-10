"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { limitByIp } from "@/lib/rate-limit";

export async function changeUserPassword(oldPassword: string, newPassword: string) {
  try {
    const rateRes = await limitByIp("change_password", { limit: 5, windowSeconds: 3600 }); // 5 attempts per hour
    if (!rateRes.ok) return { success: false, error: rateRes.error };

    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as { id?: string }).id) {
      return { success: false, error: "No autorizado" };
    }

    const userId = (session.user as { id?: string }).id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.password) {
      return { success: false, error: "Usuario inválido o no usa contraseña." };
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return { success: false, error: "La contraseña actual es incorrecta." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Error cambiando contraseña:", error);
    return { success: false, error: "Error interno del servidor." };
  }
}

import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/emails";

export async function requestPasswordReset(email: string) {
  const limit = await limitByIp("requestPasswordReset", { limit: 3, windowSeconds: 3600 });
  if (!limit.ok) return { error: limit.error };

  try {
    const rateRes = await limitByIp("request_password_reset", { limit: 3, windowSeconds: 3600 });
    if (!rateRes.ok) return { success: false, error: rateRes.error };

    const user = await prisma.user.findUnique({ where: { email } });
    // Por seguridad, no revelamos si el usuario existe o no, siempre retornamos success: true
    if (!user) return { success: true };

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    
    // El token expira en 1 hora
    const expiresAt = new Date(Date.now() + 3600000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      }
    });

    await sendPasswordResetEmail(email, token);
    return { success: true };
  } catch (error: unknown) {
    console.error("Error solicitando reseteo:", error);
    return { success: false, error: "Error interno" };
  }
}

export async function resetPassword(token: string, newPassword: string) {
  const limit = await limitByIp("resetPassword", { limit: 5, windowSeconds: 3600 });
  if (!limit.ok) return { error: limit.error };

  try {
    const rateRes = await limitByIp("reset_password", { limit: 5, windowSeconds: 3600 });
    if (!rateRes.ok) return { success: false, error: rateRes.error };

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash }
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      return { success: false, error: "El enlace es inválido o ha expirado." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Transacción: actualiza contraseña y marca token como usado
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword }
      }),
      prisma.passwordResetToken.update({
        where: { tokenHash },
        data: { usedAt: new Date() }
      })
    ]);

    return { success: true };
  } catch (error: unknown) {
    console.error("Error reseteando contraseña:", error);
    return { success: false, error: "Error interno" };
  }
}
