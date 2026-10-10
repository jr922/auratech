"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, ShoppingCart, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import QuickViewModal from "@/components/shop/QuickViewModal";
import type { Product } from "@/lib/data";
import { useUIStore } from "@/store/uiStore";

interface ProductCardProps {
  product: Product;
}

// Verifica si el string es una ruta de imagen válida (empieza con / o http)
function isValidImageSrc(src: string): boolean {
  return src.startsWith("/") || src.startsWith("http");
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const { addItem } = useCartStore();
  const { addItem: addWishlist, removeItem: removeWishlist, isInWishlist } = useWishlistStore();
  const openCart = useUIStore((state) => state.openCart);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);
  
  const inWishlist = isMounted ? isInWishlist(product.id) : false;

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      maxStock: product.stock ?? 99,
      image: product.images[0] || '/placeholder.webp'
    });
    
    // Auto-abrir carrito
    openCart();

    toast.success(`${product.name} se agregó al carrito`, {
      description: "Puedes verlo en el menú superior."
    });
  };

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating if wrapped in Link
    e.stopPropagation();
    if (inWishlist) {
      removeWishlist(product.id);
      toast.info('Eliminado de Favoritos');
    } else {
      addWishlist(product);
      toast.success('Agregado a Favoritos', {
        description: `${product.name} guardado.`
      });
    }
  };

  const hasValidMainImage = product.images[0] && isValidImageSrc(product.images[0]);
  const hasValidHoverImage = product.images.length > 1 && isValidImageSrc(product.images[1]);

  return (
    <div className="border border-slate-200 rounded-2xl p-4 hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 transition-all duration-300 bg-white flex flex-col gap-4 group relative">
      
      {/* Badges Flotantes (Top Left) */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-2 pointer-events-none">
        {product.discountBadge && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md tracking-wider shadow-sm">
            {product.discountBadge}
          </span>
        )}
        {product.isNew && !product.discountBadge && (
          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-md tracking-wider shadow-sm">
            NUEVO
          </span>
        )}
        {product.stock !== undefined && product.stock > 0 && product.stock <= 5 && (
          <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-md tracking-wider shadow-sm animate-pulse">
            ¡SOLO {product.stock}!
          </span>
        )}
        {product.stock === 0 && (
          <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-md tracking-wider shadow-sm">
            AGOTADO
          </span>
        )}
      </div>

      {/* Botones Flotantes (Top Right) */}
      <div className="absolute top-6 right-6 z-10 flex flex-col gap-2">
        <button 
          onClick={toggleWishlist}
          className={`opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 bg-white/90 backdrop-blur-sm shadow-sm border hover:border-red-500 rounded-full w-10 h-10 flex items-center justify-center hover:scale-110 ${inWishlist ? '!opacity-100 border-red-500 text-red-500' : 'border-slate-200 text-slate-400 hover:text-red-500'}`}
        >
          <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
        </button>
      </div>
      
      {/* Imagen del producto con next/image y hover effect */}
      <Link href={`/producto/${product.id}`}>
        <div className="relative aspect-square rounded-xl w-full overflow-hidden bg-slate-50">
          {hasValidMainImage ? (
            <>
              {/* Imagen de hover (absoluta) */}
              {hasValidHoverImage && (
                <Image
                  src={product.images[1]}
                  alt={`Imagen secundaria de ${product.name}`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-opacity duration-500 opacity-0 group-hover:opacity-100"
                />
              )}
              {/* Imagen principal (visible por defecto) */}
              <Image
                src={product.images[0]}
                alt={`Imagen de ${product.name}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-opacity duration-500 group-hover:opacity-0"
              />
            </>
          ) : (
            /* Fallback: placeholder de texto si la imagen no es una ruta válida */
            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
              <span className="text-sm font-medium">{product.images[0] || "Sin imagen"}</span>
            </div>
          )}
        </div>
      </Link>
      
      {/* Detalles del producto */}
      <div className="flex flex-col gap-1 flex-1">
        <Link href={`/producto/${product.id}`} className="mt-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
              {product.category}
            </span>
            {/* Sistema de Estrellas (Mini) */}
            <div className="flex items-center gap-1">
              <div className="flex items-center text-amber-400">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              </div>
              <span className="text-[10px] font-bold text-slate-500">
                {product.rating ? product.rating.toFixed(1) : "Nuevo"}
              </span>
            </div>
          </div>
          <h3 className="font-semibold text-slate-800 text-sm leading-tight group-hover:text-blue-600 transition-colors line-clamp-2 cursor-pointer">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-end gap-2 mt-auto pt-3">
          <span className="text-lg font-bold text-slate-900">S/ {product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="text-xs font-medium text-slate-400 line-through decoration-slate-300 mb-1">
              S/ {product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
        {product.variants && product.variants.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto hide-scrollbar pb-1">
            {(product.variants as any[]).slice(0, 3).map((v: any, i: number) => (
              <span key={i} className="text-[9px] bg-slate-100 border border-slate-200 text-slate-600 px-2 py-1 rounded-md font-bold whitespace-nowrap" title={v.name}>
                {v.name}
              </span>
            ))}
            {product.variants.length > 3 && (
              <span className="text-[9px] text-slate-400 font-bold bg-white border border-slate-100 px-1.5 py-1 rounded-md">
                +{product.variants.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Botón de compra Shadcn */}
      {product.variants && product.variants.length > 0 ? (
        <Button 
          onClick={() => setIsQuickViewOpen(true)}
          className="w-full bg-slate-900 text-white rounded-xl py-6 text-sm font-bold hover:bg-blue-600 hover:shadow-md hover:shadow-blue-200 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          Agregar
        </Button>
      ) : product.stock === 0 ? (
        <Button 
          disabled
          className="w-full bg-slate-100 text-slate-400 rounded-xl py-6 text-sm font-bold cursor-not-allowed flex items-center justify-center gap-2"
        >
          Agotado
        </Button>
      ) : (
        <Button 
          onClick={handleAddToCart}
          className="w-full bg-slate-900 text-white rounded-xl py-6 text-sm font-bold hover:bg-blue-600 hover:shadow-md hover:shadow-blue-200 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          Comprar Ahora
        </Button>
      )}

      {/* Modal de Vista Previa */}
      <QuickViewModal 
        product={product} 
        isOpen={isQuickViewOpen} 
        onClose={() => setIsQuickViewOpen(false)} 
      />
    </div>
  );
}
