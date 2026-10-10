import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getCachedBrands = cache(async () => {
  return await prisma.brand.findMany({
    where: { isActive: true, deletedAt: null },
    include: {
      _count: { select: { products: true } }
    },
    orderBy: { name: 'asc' }
  });
});
