import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Obtiene todas las categorías de la base de datos de forma memoizada.
 * Si varios componentes del servidor piden esta información durante el mismo renderizado,
 * React interceptará la llamada y solo consultará la base de datos 1 vez, 
 * devolviendo el resultado en caché a los demás.
 */
export const getCachedCategories = cache(async () => {
  return await prisma.category.findMany({
    where: {
      parentId: null, // Solo traer las categorías principales (abuelos/padres)
      isActive: true,
      deletedAt: null // No traer categorías eliminadas
    },
    include: {
      _count: {
        select: { products: true }
      },
      children: {
        where: { isActive: true, deletedAt: null },
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { products: true }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  });
});
