import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");

// Se genera en cada petición para reflejar el catálogo vigente (y no fallar el build sin BD)
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/tienda", "/contacto", "/preguntas-frecuentes", "/politicas-de-privacidad", "/reclamaciones", "/rastreo"].map(
    (path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.6,
    })
  );

  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    select: { slug: true, id: true, updatedAt: true },
  });

  const productRoutes = products.map((p) => ({
    url: `${SITE_URL}/producto/${p.slug || p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...productRoutes];
}
