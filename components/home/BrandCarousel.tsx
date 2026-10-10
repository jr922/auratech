import Link from "next/link";
import { getCachedBrands } from "@/lib/api/brands";
import BrandImageFallback from "@/components/ui/BrandImageFallback";
export default async function BrandCarousel() {
  const brands = await getCachedBrands();

  if (!brands || brands.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 w-full py-8 border-y border-slate-100 my-8 overflow-hidden">
      <h2 className="text-xl font-bold text-slate-800 mb-8 text-center">Marcas con las que trabajamos</h2>
      <div className="flex gap-8 overflow-x-auto hide-scrollbar snap-x snap-mandatory items-center justify-start md:justify-center">
        {brands.map((brand) => (
          <Link 
            key={brand.id} 
            href={`/tienda?marca=${brand.slug}`}
            className="min-w-[120px] h-16 flex flex-col items-center justify-center grayscale hover:grayscale-0 opacity-50 hover:opacity-100 transition-all duration-300 cursor-pointer snap-center"
          >
            <BrandImageFallback brand={brand} isSidebar={false} />
          </Link>
        ))}
      </div>
    </section>
  );
}
