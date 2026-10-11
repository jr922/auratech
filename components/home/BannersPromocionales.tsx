import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function BannersPromocionales({ type = 1 }: { type?: 1 | 2 }) {
  // Pool de diseños según el tipo solicitado en el wireframe
  const banners = type === 1 ? [
    { title: "Audio Premium", subtitle: "Audífonos In-Ear", img: "https://res.cloudinary.com/sjv0gctw/image/upload/v1791157506/aura_tech_catalog/nwuriwuvpvnyftftjut0.jpg", link: "/tienda?categoria=audifonos-in-ear", bg: "bg-slate-900", color: "text-white" },
    { title: "Cámaras 360", subtitle: "Seguridad Inteligente", img: "https://res.cloudinary.com/sjv0gctw/image/upload/v1791156739/aura_tech_catalog/ye6rpclfxza1d0r91m57.webp", link: "/tienda?categoria=camaras-seguridad", bg: "bg-blue-600", color: "text-white" },
    { title: "Cargadores GaN", subtitle: "Carga Súper Rápida", img: "https://res.cloudinary.com/sjv0gctw/image/upload/v1791156624/aura_tech_catalog/prfut8xpggzliuxpsqdr.webp", link: "/tienda?categoria=cargadores-pared", bg: "bg-emerald-600", color: "text-white" }
  ] : [
    { title: "Cables USB-C", subtitle: "Resistencia Extrema", img: "https://res.cloudinary.com/sjv0gctw/image/upload/v1791156624/aura_tech_catalog/prfut8xpggzliuxpsqdr.webp", link: "/tienda?categoria=cables", bg: "bg-orange-500", color: "text-white" },
    { title: "Audio Bluetooth", subtitle: "Parlantes Inalámbricos", img: "https://res.cloudinary.com/sjv0gctw/image/upload/v1791156633/aura_tech_catalog/myf2qoghhq4cotkiczmg.webp", link: "/tienda?categoria=parlantes", bg: "bg-purple-600", color: "text-white" },
    { title: "Fundas Spigen", subtitle: "Protección Total", img: "https://res.cloudinary.com/sjv0gctw/image/upload/v1791158025/aura_tech_catalog/dvslufct5tsh1hggu43x.jpg", link: "/tienda?categoria=case-covers&marca=spigen", bg: "bg-pink-500", color: "text-white" }
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 w-full py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {banners.map((banner, idx) => (
          <Link 
            key={idx} 
            href={banner.link}
            className={`relative w-full h-[240px] sm:h-[320px] md:h-[400px] rounded-2xl sm:rounded-3xl p-6 sm:p-8 overflow-hidden group flex flex-col justify-between ${banner.bg} ${banner.color} transition-transform hover:-translate-y-2 hover:shadow-xl`}
          >
            {/* Texto (Arriba) */}
            <div className="relative z-10">
              <span className="uppercase text-[10px] sm:text-xs font-bold tracking-widest opacity-80 mb-1 sm:mb-2 block">{banner.subtitle}</span>
              <h3 className="text-xl sm:text-3xl font-black leading-tight max-w-[200px]">{banner.title}</h3>
            </div>
            
            {/* Botón (Medio/Abajo) */}
            <div className="relative z-10 mt-auto mb-2 sm:mb-4">
              <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 bg-white/20 sm:bg-transparent px-3 py-1.5 sm:px-0 sm:py-0 rounded-full sm:rounded-none w-fit backdrop-blur-sm sm:backdrop-blur-none">
                Comprar Ahora <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>

            {/* Imagen Decorativa Absoluta (Fondo) */}
            <div className="absolute right-0 bottom-0 w-3/4 h-3/4 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 z-0 flex items-end justify-end">
               <div className="relative w-full h-full">
                 {/* Intentamos cargar la foto real, si no existe no rompe porque es decorativa */}
                 <Image src={banner.img} alt={banner.title} fill className="object-contain object-bottom drop-shadow-2xl" />
               </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
