import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Rutas privadas / transaccionales: no deben indexarse
        disallow: ["/admin", "/api", "/checkout", "/mi-cuenta", "/pedido", "/order-received", "/carrito"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
