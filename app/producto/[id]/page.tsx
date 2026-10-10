import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/api/products";
import SingleProductClient from "./SingleProductClient";

// 1. SEO Dinámico
export async function generateMetadata(
  props: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const product = await getProductBySlug(params.id);

  if (!product) {
    return {
      title: "Producto no encontrado | Aura Tech"
    };
  }

  return {
    title: `${product.name} | Aura Tech`,
    description: product.description.length > 160 ? product.description.substring(0, 160) + '...' : product.description,
    openGraph: {
      title: `${product.name} | Aura Tech`,
      description: product.description.length > 160 ? product.description.substring(0, 160) + '...' : product.description,
      images: [product.parsedImages[0]],
    },
  };
}

// 2. Componente de Servidor Principal
export default async function SingleProductPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  
  // Consultar a la base de datos real usando el API handler
  const dbProduct = await getProductBySlug(params.id);

  // Si alguien ingresa un ID que no existe, mostramos página 404
  if (!dbProduct) {
    notFound();
  }

  // Mapear datos para el cliente
  let avgRating = 0;
  if (dbProduct.reviews && dbProduct.reviews.length > 0) {
    const sum = dbProduct.reviews.reduce((acc, rev) => acc + rev.rating, 0);
    avgRating = Number((sum / dbProduct.reviews.length).toFixed(1));
  }

  const productData = {
    id: dbProduct.id,
    name: dbProduct.name,
    category: dbProduct.category.name,
    categorySlug: (dbProduct.category as any).slug,
    price: dbProduct.price,
    originalPrice: dbProduct.originalPrice || undefined,
    discount: dbProduct.originalPrice 
      ? `${Math.round((1 - dbProduct.price / dbProduct.originalPrice) * 100)}%` 
      : null,
    rating: avgRating, 
    reviewsCount: dbProduct.reviews?.length || 0,
    reviewsData: (dbProduct.reviews as any[]) || [],
    description: dbProduct.description,
    colors: [{ name: "Standard", hex: "#000000" }], // Mantener por retrocompatibilidad
    images: dbProduct.parsedImages,
    stock: dbProduct.stock,
    sku: `SKU-${dbProduct.id.substring(dbProduct.id.length - 6).toUpperCase()}`,
    variantsData: dbProduct.variants || []
  };

  // Obtener productos relacionados de la misma categoría
  const relatedProducts = await getRelatedProducts(dbProduct.categoryId, dbProduct.id, 4);

  const relatedMapped = relatedProducts;

  // JSON-LD for rich snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: dbProduct.name,
    image: dbProduct.parsedImages,
    description: dbProduct.description,
    sku: productData.sku,
    offers: {
      "@type": "Offer",
      url: `https://auratech.pe/producto/${dbProduct.slug}`,
      priceCurrency: "PEN",
      price: dbProduct.price,
      itemCondition: "https://schema.org/NewCondition",
      availability: dbProduct.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    aggregateRating: avgRating > 0 ? {
      "@type": "AggregateRating",
      ratingValue: avgRating,
      reviewCount: productData.reviewsCount,
    } : undefined,
  };

  // Renderizar el componente de cliente pasándole los datos reales
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SingleProductClient 
        product={productData} 
        relatedProducts={relatedMapped} 
      />
    </>
  );
}
