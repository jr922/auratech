"use client";

import { useEffect, useState } from "react";
import { useRecentlyViewedStore } from "@/store/recentlyViewedStore";
import ProductCard from "@/components/ui/ProductCard";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Clock } from "lucide-react";

export default function RecentlyViewed({ currentProductId }: { currentProductId?: string }) {
  const { items, isHydrated } = useRecentlyViewedStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted || !isHydrated) return null;

  // Filtrar el producto actual para no mostrarlo a sí mismo en su propia página
  const displayItems = items.filter(item => item.id !== currentProductId);

  if (displayItems.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 w-full mt-16 pt-12 border-t border-slate-100">
      <div className="flex items-center gap-3 mb-8">
        <Clock className="w-6 h-6 text-slate-400" />
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Vistos recientemente
        </h2>
      </div>
      
      <Carousel opts={{ align: "start" }} className="w-full relative">
        <CarouselContent className="-ml-4">
          {displayItems.map((prod) => (
            <CarouselItem key={prod.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
              <ProductCard product={prod} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden md:flex absolute -top-14 right-12 gap-2">
          <CarouselPrevious className="relative left-0 top-0 translate-y-0 w-10 h-10 border-slate-200 bg-white" />
          <CarouselNext className="relative right-0 top-0 translate-y-0 w-10 h-10 border-slate-200 bg-white" />
        </div>
      </Carousel>
    </section>
  );
}
