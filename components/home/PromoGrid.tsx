import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function PromoGrid() {
  return (
    <section className="max-w-7xl mx-auto px-4 w-full py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[250px]">
        
        {/* Bloque 1 (Izquierda, alto - Ocupa 2 filas) */}
        <div className="lg:row-span-2 lg:col-span-1 md:col-span-1 bg-slate-100 rounded-xl p-8 flex flex-col hover:scale-[1.02] transition-transform duration-300 cursor-pointer overflow-hidden relative group">
          <div className="z-10 flex flex-col flex-1">
            <span className="text-xs font-bold text-slate-500 mb-2 tracking-widest uppercase">Audio Premium</span>
            <h3 className="text-3xl font-black text-slate-900 mb-4">Audífonos Over-Ear</h3>
            <p className="text-sm text-slate-600 mb-4">Descubre la mejor calidad de sonido con cancelación de ruido activa.</p>
            <Link href="/tienda?categoria=audifonos-over-ear" className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 w-fit">
              Ver Oferta <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="mt-8 flex-1 w-full rounded-lg flex items-center justify-center relative min-h-[200px]">
            <Image src="https://res.cloudinary.com/sjv0gctw/image/upload/v1791157054/aura_tech_catalog/poilecd1ruofrjgtm8eg.jpg" alt="Audífonos Premium" fill sizes="(max-width: 768px) 100vw, 33vw" priority={true} className="object-contain mix-blend-multiply drop-shadow-xl group-hover:scale-110 transition-transform duration-500" />
          </div>
        </div>

        {/* Bloque 2 (Centro-Arriba) */}
        <div className="lg:col-span-2 md:col-span-1 bg-slate-100 rounded-xl p-8 flex flex-col md:flex-row hover:scale-[1.02] transition-transform duration-300 cursor-pointer overflow-hidden group">
          <div className="z-10 flex flex-col justify-center flex-1 pr-4">
            <span className="text-xs font-bold text-slate-500 mb-2 tracking-widest uppercase">Fundas & Carcasas</span>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Máxima Protección Spigen</h3>
            <p className="text-sm text-slate-600 mb-4">La mejor armadura para tu iPhone o Samsung Galaxy.</p>
            <Link href="/tienda?categoria=case-covers&marca=spigen" className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 w-fit">
              Ver Fundas Spigen <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="mt-4 md:mt-0 flex-1 w-full rounded-lg flex items-center justify-center relative min-h-[150px]">
            <Image src="https://res.cloudinary.com/sjv0gctw/image/upload/v1791158025/aura_tech_catalog/dvslufct5tsh1hggu43x.jpg" alt="Fundas Spigen" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-contain mix-blend-multiply drop-shadow-xl group-hover:scale-110 transition-transform duration-500" />
          </div>
        </div>

        {/* Bloque 3 (Centro-Abajo) */}
        <div className="lg:col-span-2 md:col-span-2 bg-slate-100 rounded-xl p-8 flex flex-col md:flex-row hover:scale-[1.02] transition-transform duration-300 cursor-pointer overflow-hidden group">
          <div className="z-10 flex flex-col justify-center flex-1 pr-4">
            <span className="text-xs font-bold text-slate-500 mb-2 tracking-widest uppercase">Smart Home</span>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Cámaras de Seguridad</h3>
            <p className="text-sm text-slate-600 mb-4">Vigila tu hogar desde tu celular con nuestra línea Ezviz y Xiaomi.</p>
            <Link href="/tienda?categoria=camaras-seguridad" className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 w-fit">
              Proteger mi hogar <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="mt-4 md:mt-0 flex-1 w-full rounded-lg flex items-center justify-center relative min-h-[150px]">
            <Image src="https://res.cloudinary.com/sjv0gctw/image/upload/v1791156739/aura_tech_catalog/ye6rpclfxza1d0r91m57.webp" alt="Cámaras de Seguridad" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-contain mix-blend-multiply drop-shadow-xl group-hover:scale-110 transition-transform duration-500" />
          </div>
        </div>

      </div>
    </section>
  );
}
