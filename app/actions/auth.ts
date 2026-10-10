"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { limitByIp } from "@/lib/rate-limit";

export async function registerUser(formData: FormData) {
  const limit = await limitByIp("registerUser", { limit: 5, windowSeconds: 3600 });
  if (!limit.ok) return { error: limit.error };

  const rateRes = await limitByIp("register", { limit: 3, windowSeconds: 3600 }); // 3 registrations per hour per IP
  if (!rateRes.ok) return { error: rateRes.error };

  const name = (formData.get("name") as string | null)?.trim();
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  const password = formData.get("password") as string | null;

  if (!name || !email || !password) {
    return { error: "Faltan datos requeridos" };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Correo electrónico inválido" };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return { error: "El usuario ya existe" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "USER",
    }
  });

  return { success: true };
}

export async function getUserOrders(userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { id?: string }).id !== userId) {
      throw new Error("No autorizado para ver estos pedidos");
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        history: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return orders;
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    return [];
  }
}
