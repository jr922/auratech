import { prisma } from "@/lib/prisma";
const BASE_WHERE = { status: 'PUBLISHED', deletedAt: null };

import type { Product } from "@/lib/data";

// Helper centralizado para limpiar y estandarizar la data que va al Frontend
type DbProductInput = { id: string; name: string; description: string; category?: { name: string }; price: number; originalPrice?: number | null; images?: string | null; reviews?: { rating: number }[]; variants?: unknown; stock?: number; };
function mapToProduct(dbProduct: DbProductInput): Product {
  let parsedImages = ['/placeholder.webp'];
  try {
    const p = JSON.parse(dbProduct.images || "[]");
    if (Array.isArray(p) && p.length > 0) parsedImages = p;
  } catch {}

  let avgRating = 0;
  let reviewCount = 0;
  if (dbProduct.reviews && Array.isArray(dbProduct.reviews)) {
    reviewCount = dbProduct.reviews.length;
    if (reviewCount > 0) {
      const sum = dbProduct.reviews.reduce((acc: number, rev: { rating: number }) => acc + rev.rating, 0);
      avgRating = Number((sum / reviewCount).toFixed(1));
    }
  }

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description,
    category: dbProduct.category?.name || "Sin Categoría",
    price: dbProduct.price,
    originalPrice: dbProduct.originalPrice || undefined,
    discountBadge: dbProduct.originalPrice ? `-${Math.round((1 - dbProduct.price / dbProduct.originalPrice) * 100)}%` : undefined,
    isNew: true, // Esto podría ser calculado basado en createdAt
    images: parsedImages,
    rating: avgRating,
    reviews: reviewCount,
    variants: (Array.isArray(dbProduct.variants) ? dbProduct.variants : []),
    stock: dbProduct.stock || 0
  };
}

export async function getProducts(params?: {
  categorySlug?: string;
  brandSlug?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  query?: string;
  take?: number;
}): Promise<Product[]> {
  const { categorySlug, brandSlug, sort, minPrice, maxPrice, query, take } = params || {};

  let orderBy: Record<string, unknown> = { createdAt: 'desc' }; // Por defecto: más recientes
  if (sort === 'price-asc') orderBy = { price: 'asc' };
  if (sort === 'price-desc') orderBy = { price: 'desc' };
  if (sort === 'name-asc') orderBy = { name: 'asc' };

  const products = await prisma.product.findMany({
    where: { ...BASE_WHERE,
    ...(brandSlug && { brand: { slug: brandSlug } }),
      ...(categorySlug && { 
        category: { 
          OR: [
            { slug: categorySlug },
            { parent: { slug: categorySlug } }
          ]
        } 
      }),
      ...(query && { 
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { brand: { name: { contains: query, mode: 'insensitive' } } },
          { category: { name: { contains: query, mode: 'insensitive' } } }
        ]
      }),
      ...((minPrice !== undefined || maxPrice !== undefined) && {
        price: {
          ...(minPrice !== undefined && { gte: minPrice }),
          ...(maxPrice !== undefined && { lte: maxPrice }),
        }
      })
    },
    include: { category: { select: { name: true } }, reviews: { select: { rating: true } }, variants: true },
    ...(take && { take }),
    orderBy
  });

  return products.map(mapToProduct);
}

export async function getProductBySlug(slugOrId: string) {
  const product = await prisma.product.findFirst({
    where: { ...BASE_WHERE,
      OR: [
        { slug: slugOrId },
        { id: slugOrId }
      ]
    },
    include: { category: { select: { name: true } }, reviews: { select: { rating: true } }, variants: true }
  });

  if (!product) return null;
  
  // Para el detalle del producto, devolvemos el objeto crudo con el parser seguro para mantener compatibilidad
  // con campos extra como description, stock, etc.
  let parsedImages = ['/placeholder.webp'];
  try {
    const p = JSON.parse(product.images);
    if (Array.isArray(p) && p.length > 0) parsedImages = p;
  } catch {}

  return { ...product, parsedImages };
}

export async function getRelatedProducts(categoryId: string, excludeId: string, take: number = 4): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: { ...BASE_WHERE, 
      categoryId,
      id: { not: excludeId }
    },
    take,
    include: { category: { select: { name: true } }, reviews: { select: { rating: true } }, variants: true }
  });
  return products.map(mapToProduct);
}

export async function searchProducts(query: string): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: { ...BASE_WHERE,
      OR: [
        { name: { contains: query } },
        { description: { contains: query } },
        { category: { name: { contains: query } } }
      ]
    },
    include: { category: { select: { name: true } }, reviews: { select: { rating: true } }, variants: true }
  });
  return products.map(mapToProduct);
}

export async function getPaginatedProducts(params: {
  categorySlug?: string;
  brandSlug?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  query?: string;
  inStock?: boolean;
  hasDiscount?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const { categorySlug, brandSlug, sort, minPrice, maxPrice, query, inStock, hasDiscount, page = 1, pageSize = 12 } = params;

  let orderBy: Record<string, unknown> = { createdAt: 'desc' };
  if (sort === 'price-asc') orderBy = { price: 'asc' };
  if (sort === 'price-desc') orderBy = { price: 'desc' };
  if (sort === 'name-asc') orderBy = { name: 'asc' };

  const where: Record<string, unknown> = {
    ...BASE_WHERE,
    ...(brandSlug && { 
      brand: { 
        slug: brandSlug.includes(',') ? { in: brandSlug.split(',') } : brandSlug 
      } 
    }),
    ...(categorySlug && { 
      category: { 
        OR: [
          { slug: categorySlug },
          { parent: { slug: categorySlug } }
        ]
      } 
    }),
    ...(query && {
      AND: query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(' ').filter(Boolean).map(term => ({
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { brand: { name: { contains: term, mode: 'insensitive' } } },
          { category: { name: { contains: term, mode: 'insensitive' } } }
        ]
      }))
    }),
    ...((minPrice !== undefined || maxPrice !== undefined) && {
      price: {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      }
    }),
    ...(inStock && { stock: { gt: 0 } }),
    ...(hasDiscount && { originalPrice: { not: null } })
  };

  // Conteo total para paginación
  const totalCount = await prisma.product.count({ where });

  // Paginación y búsqueda nativa en BD
  const dbProducts = await prisma.product.findMany({
    where,
    orderBy,
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: { category: { select: { name: true } }, reviews: { select: { rating: true } }, variants: true }
  });

  const paginatedProducts = dbProducts;

  return {
    products: paginatedProducts.map(mapToProduct),
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize) || 1,
    currentPage: page
  };
}
