"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function getUserProfile(userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { id?: string }).id !== userId) {
      throw new Error("No autorizado");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        document: true,
        phone: true,
        address: true,
        addresses: true,
      }
    });
    return user;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function updateUserProfile(userId: string, data: {
  name?: string;
  document?: string;
  phone?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { id?: string }).id !== userId) {
      return { success: false, error: "No autorizado para modificar este perfil." };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        document: data.document,
        phone: data.phone,
        // La dirección se gestiona en el modelo Address (app/actions/address.ts)
      }
    });
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error: "No se pudo actualizar el perfil." };
  }
}
