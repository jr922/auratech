"use server";

import { prisma } from "@/lib/prisma";

export async function liveSearchProducts(query: string) {
  if (!query || query.length < 2) return [];

  const products = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { category: { name: { contains: query, mode: 'insensitive' } } },
        { brand: { name: { contains: query, mode: 'insensitive' } } }
      ]
    },
    take: 5,
    include: {
      category: true
    }
  });

  return products.map(p => {
    let images = ['/placeholder.webp'];
    try {
      const parsed = JSON.parse(p.images);
      if (Array.isArray(parsed) && parsed.length > 0) images = parsed;
    } catch {}

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      originalPrice: p.originalPrice,
      image: images[0],
      category: p.category?.name || "General"
    };
  });
}
