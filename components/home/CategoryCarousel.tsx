"use client";

import { useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import * as icons from "lucide-react";

import { Category } from "@prisma/client";

interface DbCategory extends Category {
  bgClass?: string;
  brandText?: string;
}

interface CategoryCarouselProps {
  dbCategories?: DbCategory[];
}

export default function CategoryCarousel({ dbCategories = [] }: CategoryCarouselProps) {
    const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  
 //El pool ahora busca por el ID de texto (slug) y guarda rutas de imágenes reales
  const designPool = [
    { slug: "apple", imageUrl: "/images/categories/apple.svg", icon: icons.Smartphone, bg: "bg-slate-100", brand: "Ecosistema" },
    { slug: "amazon", imageUrl: "/images/categories/amazon.svg", icon: icons.Tv, bg: "bg-orange-50", brand: "Alexa Eco" },
    { slug: "audifonos", imageUrl: "/images/categories/headphones.svg", icon: icons.Headphones, bg: "bg-blue-50", brand: "Premium" },
    { slug: "cargadores-y-cables", imageUrl: "/images/categories/cables.svg", icon: icons.Battery, bg: "bg-emerald-50", brand: "Potencia" },
    { slug: "case-covers", imageUrl: "/images/categories/cases.svg", icon: icons.Shield, bg: "bg-purple-50", brand: "Protección" },
    { slug: "smart-home", imageUrl: "/images/categories/smarthome.svg", icon: icons.Home, bg: "bg-red-50", brand: "Hogar Int." },
    { slug: "wearables", imageUrl: "/images/categories/wearables.svg", icon: icons.Watch, bg: "bg-pink-50", brand: "Deportes" },
  ]; 

  // Diseño de respaldo (Fallback) por si creas una categoría en la BD y no está en el pool
  const defaultDesign = {
    imageUrl: "/images/categories/placeholder.png",
    icon: icons.Tag,
    bg: "bg-slate-50",
    brand: "Explorar"
  };


  return (
    <section className="max-w-7xl mx-auto px-4 w-full py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Explora por Categorías
          </h2>
          <p className="text-slate-500 text-sm mt-1">Encuentra exactamente lo que buscas.</p>
        </div>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full relative"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {dbCategories.map((cat) => {
            // Asignamos el diseño del pool basado en el índice
            const design = designPool.find((d) => d.slug == cat.slug) || defaultDesign;

            const finalImage = cat.imageUrl ||design.imageUrl;
            const finalBg = cat.bgClass || design.bg;
            const finalBrand = cat.brandText || design.brand;

            //
            const IconFallback = design.icon || icons.Tag;
            const isImageBroken = brokenImages[cat.id];

            return (
              <CarouselItem key={cat.id} className="pl-2 md:pl-4 basis-[44%] sm:basis-1/3 md:basis-1/4 lg:basis-1/6">
                <div className="p-0.5 sm:p-1">
                  <Link href={`/tienda?categoria=${cat.slug}`}>
                    <Card className="rounded-2xl sm:rounded-3xl border-slate-200 cursor-pointer hover:border-blue-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
                      <CardContent className="flex flex-col items-center justify-center p-3.5 sm:p-6 text-center">
                        <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2.5 sm:mb-4 group-hover:scale-110 transition-transform duration-300 relative p-2 ${finalBg}`}>
                        {!isImageBroken ? (
                          <Image 
                            src={finalImage}
                            alt={cat.name}
                            width={54}
                            height={54}
                            className="object-contain" 
                            onError={() => {
                              setBrokenImages((prev) => ({ ...prev, [cat.id]: true }));
                            }}
                          />
                        ) : (
                          <IconFallback className="w-6 h-6 sm:w-8 sm:h-8 text-slate-700 animate-fade-in" />
                        )}

                        </div>
                        <h3 className="font-bold text-slate-800 text-xs sm:text-sm truncate w-full">{cat.name}</h3>
                        <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 mt-0.5 sm:mt-1">{finalBrand}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <div className="hidden md:flex absolute -top-12 right-12 gap-2">
          <CarouselPrevious className="relative left-0 top-0 translate-y-0 translate-x-0 w-10 h-10 bg-white border-slate-200" />
          <CarouselNext className="relative right-0 top-0 translate-y-0 translate-x-0 w-10 h-10 bg-white border-slate-200" />
        </div>
      </Carousel>
    </section>
  );
}
