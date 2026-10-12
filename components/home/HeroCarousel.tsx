"use client";

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

export default function HeroCarousel() {
  const plugin = useMemo(() => Autoplay({ delay: 5000, stopOnInteraction: true }), []);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  // Mantiene sincronizados los indicadores (dots) con el slide activo
  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  // Simulamos banners reales. En producción estos podrían venir de Prisma (Banner modelo).
  const banners = [
    {
      id: 1,
      imageDesktop: "/iphone.webp",
      imageMobile: "/placeholder.webp",
      link: "/tienda?categoria=smartphones"
    },
    {
      id: 2,
      imageDesktop: "/iphone.jpg",
      imageMobile: "/placeholder.webp",
      link: "/tienda?categoria=laptops"
    },
    {
      id: 3,
      imageDesktop: "/iphoneee.jpg",
      imageMobile: "/placeholder.webp",
      link: "/tienda?categoria=laptops"
    },
    {
      id: 4,
      imageDesktop: "/iphonee.webp",
      imageMobile: "/placeholder.webp",
      link: "/tienda?categoria=laptops"
    },
    {
      id: 5,
      imageDesktop: "/iphoneee.webp",
      imageMobile: "/placeholder.webp",
      link: "/tienda?categoria=laptops"
    },

  ];

  return (
    <div className="w-full relative group">
      <Carousel 
        opts={{ loop: true }} 
        plugins={[plugin]}
        setApi={setApi}
        className="w-full"
      >
        <CarouselContent>
          {banners.map((banner, index) => (
            <CarouselItem key={banner.id}>
              <Link href={banner.link} className="block relative w-full h-[210px] sm:h-[350px] md:h-[480px] lg:h-[580px] overflow-hidden group cursor-pointer bg-slate-900">
                
                {/* Imagen del Banner */}
                <Image 
                  src={banner.imageDesktop} 
                  alt={`Promoción especial ${index + 1}`}
                  fill
                  sizes="100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority={index === 0}
                />
              
                       {/*
              <div className="absolute bottom-6 right-6 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver promoción
                </div>
                */}
          
                  

              </Link>
            </CarouselItem>
          ))}
        </CarouselContent> 
        
        {/* Flechas Shadcn UI - Visibles on hover */}
        <div className="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <CarouselPrevious className="left-6 bg-white/50 text-slate-900 border-none hover:bg-white w-12 h-12 shadow-lg" />
          <CarouselNext className="right-6 bg-white/50 text-slate-900 border-none hover:bg-white w-12 h-12 shadow-lg" />
        </div>

        {/* Indicadores: dan pista de que hay más slides (sobre todo en móvil) */}
        <div className="absolute bottom-2.5 md:bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          {banners.map((banner, i) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`Ir a la promoción ${i + 1}`}
              aria-current={current === i}
              onClick={() => api?.scrollTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${current === i ? "w-6 bg-white shadow" : "w-1.5 bg-white/50 hover:bg-white/80"}`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
}




