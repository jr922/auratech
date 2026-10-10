"use client";

import { useEffect, useState } from "react";
import { useRecentlyViewedStore } from "@/store/recentlyViewedStore";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import ProductCard from "@/components/ui/ProductCard";

export default function RecentlyViewedCarousel() {
  const { items, isHydrated } = useRecentlyViewedStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted || !isHydrated || items.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 w-full py-12 border-t border-slate-200 mt-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <span className="text-slate-400 font-bold tracking-widest text-xs uppercase">Tu Historial</span>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-1 tracking-tight">Vistos Recientemente.</h2>
        </div>
      </div>
      
      <Carousel opts={{ align: "start", dragFree: true }} className="w-full relative">
        <CarouselContent className="-ml-4">
          {items.map((product) => (
            <CarouselItem key={product.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
              <ProductCard product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>
        {/* Flechas ocultas en móvil para fomentar swipe */}
        <div className="hidden md:flex absolute -top-12 right-12 gap-2">
          <CarouselPrevious className="relative left-0 top-0 translate-y-0 w-10 h-10 border-slate-200 bg-white" />
          <CarouselNext className="relative right-0 top-0 translate-y-0 w-10 h-10 border-slate-200 bg-white" />
        </div>
      </Carousel>
    </section>
  );
}
