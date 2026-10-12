"use client";

import { useEffect, useState } from "react";
import { useWishlistStore } from "@/store/wishlistStore";
import ProductCard from "@/components/ui/ProductCard";
import { HeartCrack } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FavoritosPage() {
  const { items, isHydrated } = useWishlistStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted || !isHydrated) {
    return <div className="min-h-[60vh] flex items-center justify-center text-slate-500 font-bold">Cargando favoritos...</div>;
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8 md:py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-4xl font-black text-slate-900 mb-2">Mis Favoritos</h1>
        <p className="text-sm md:text-base text-slate-500 mb-6 md:mb-12">Productos que has guardado para comprar más tarde.</p>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 md:p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <HeartCrack className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Tu lista está vacía</h2>
            <p className="text-slate-500 mb-8 max-w-md">
              Aún no has guardado ningún producto. Explora nuestra tienda y dale al corazón para guardar tus favoritos.
            </p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-8 rounded-xl shadow-lg shadow-blue-200">
              <Link href="/tienda">Explorar Tienda</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {items.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
