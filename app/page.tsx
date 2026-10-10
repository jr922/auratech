import HeroCarousel from "@/components/home/HeroCarousel";
import StoreValues from "@/components/home/StoreValues";
import CategoryCarousel from "@/components/home/CategoryCarousel";
import PromoGrid from "@/components/home/PromoGrid";
import Benefits from "@/components/home/Benefits";
import ProductCard from "@/components/ui/ProductCard";
import BrandCarousel from "@/components/home/BrandCarousel";
import PaymentMethods from "@/components/home/PaymentMethods";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { getProducts } from "@/lib/api/products";
import { getCachedCategories } from "@/lib/api/categories";
import type { Product } from "@/lib/data";
import Link from "next/link";
import BannersPromocionales from "@/components/home/BannersPromocionales";
import RecentlyViewedCarousel from "@/components/home/RecentlyViewedCarousel";

export default async function Home() {
  let products: Product[] = [];
  try {
    products = await getProducts({ take: 10 });
  } catch (error) {
    console.error("Error fetching products on home page:", error);
  }

  // Obtenemos las categorías reales
  const dbCategories = await getCachedCategories();

  // Separamos en novedades (primeros 5) y recomendaciones (siguientes 5)
  const newArrivals = products.slice(0, 5);
  const recommended = products.slice(5, 10);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      
      {/* 1. HERO BANNER CARRUSEL */}
      <HeroCarousel />
      
      {/* 2. CARRUSEL DE CATEGORÍAS */}
      <CategoryCarousel dbCategories={dbCategories} />

      {/* 3. GRID DE BANNERS PROMOCIONALES 1 (Según Wireframe) */}
      <BannersPromocionales type={1} />
      
      {/* 4. PRODUCTOS - NOVEDADES */}
      <section className="max-w-7xl mx-auto px-4 w-full py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-blue-600 font-bold tracking-wider text-sm uppercase">Lo más reciente</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mt-2 tracking-tight">Echa un vistazo a las novedades.</h2>
          </div>
          <Link href="/tienda" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition flex items-center gap-1 group">
            Ver todo el catálogo 
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
        
        {newArrivals.length > 0 ? (
          <Carousel opts={{ align: "start" }} className="w-full relative">
            <CarouselContent className="-ml-4">
              {newArrivals.map((product) => (
                <CarouselItem key={product.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <ProductCard product={product} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:flex absolute -top-14 right-12 gap-2">
              <CarouselPrevious className="relative left-0 top-0 translate-y-0 w-10 h-10 border-slate-200 bg-white" />
              <CarouselNext className="relative right-0 top-0 translate-y-0 w-10 h-10 border-slate-200 bg-white" />
            </div>
          </Carousel>
        ) : (
          <p className="text-slate-500 text-center py-10">No hay productos en la base de datos.</p>
        )}
      </section>

      {/* 4. DESTACADOS GRID ASIMÉTRICO (Premium/Apple Showcase) */}
      <PromoGrid />

      {/* 5. PRODUCTOS - RECOMENDADOS */}
      {recommended.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 w-full py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-emerald-500 font-bold tracking-wider text-sm uppercase">Selección Especial</span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mt-2 tracking-tight">Solo para ti.</h2>
            </div>
          </div>
          
          <Carousel opts={{ align: "start" }} className="w-full relative">
            <CarouselContent className="-ml-4">
              {recommended.map((product) => (
                <CarouselItem key={product.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <ProductCard product={product} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:flex absolute -top-14 right-12 gap-2">
              <CarouselPrevious className="relative left-0 top-0 translate-y-0 w-10 h-10 border-slate-200 bg-white" />
              <CarouselNext className="relative right-0 top-0 translate-y-0 w-10 h-10 border-slate-200 bg-white" />
            </div>
          </Carousel>
        </section>
      )}

      {/* 7. GRID DE BANNERS PROMOCIONALES 2 (Según Wireframe) */}
      <BannersPromocionales type={2} />

      {/* 8. HISTORIAL (Vistos Recientemente) */}
      <RecentlyViewedCarousel />

      {/* 9. CARRUSEL DE MARCAS */}
      <BrandCarousel />

      {/* 10. BENEFICIOS */}
      <Benefits />

      {/* 11. VALORES */}
      <StoreValues />

      {/* 12. MÉTODOS DE PAGO */}
      <PaymentMethods />
      
    </div>
  );
}
