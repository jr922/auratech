"use client";

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import { useMemo } from "react";
import Image from "next/image";

export default function HeroCarousel() {
  const plugin = useMemo(() => Autoplay({ delay: 5000, stopOnInteraction: true }), []);

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
        className="w-full"
      >
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <Link href={banner.link} className="block relative w-full h-[450px] sm:h-[500px] md:h-[600px] overflow-hidden group cursor-pointer bg-slate-900">
                
                {/* Imagen del Banner */}
                <Image 
                  src={banner.imageDesktop} 
                  alt="Promoción Especial"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
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
      </Carousel>
    </div>
  );
}




