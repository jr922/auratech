"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, ShoppingCart, Star, Check, Plus, Minus, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useUIStore } from "@/store/uiStore";
import type { Product } from "@/lib/data";
import ImageMagnifier from "@/components/ui/ImageMagnifier";

interface QuickViewModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useUIStore((state) => state.openCart);
  const [mounted, setMounted] = useState(false);
  
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any>(
    (product.variants as any[])?.find((v: any) => v.stock > 0) || (product.variants as any[])?.[0] || null
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Reset states when opening a new product
      setActiveImage(0);
      setQuantity(1);
      setSelectedVariant((product.variants as any[])?.find((v: any) => v.stock > 0) || (product.variants as any[])?.[0] || null);
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen, product]);

  if (!isOpen || !mounted) return null;

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentStock = selectedVariant ? selectedVariant.stock : (product.stock || 99);

  const handleAddToCart = () => {
    addItem({
      id: selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id,
      productId: product.id,
      name: selectedVariant ? `${product.name} (${selectedVariant.name})` : product.name,
      price: currentPrice,
      image: product.images[0] || "/placeholder.webp",
      quantity,
      maxStock: currentStock
    });
    
    toast.success("¡Agregado al carrito!", {
      description: `${quantity}x ${product.name} ${selectedVariant ? `(${selectedVariant.name})` : ''}`
    });
    
    onClose();
    // Abrimos el carrito usando la tienda de UI (evita el problema de rehidratación del layout global)
    setTimeout(() => {
      openCart();
    }, 100);
  };

  const handleGoToDetails = () => {
    onClose();
    router.push(`/producto/${product.id}`);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Botón Cerrar Móvil/Desktop */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Galería (Izquierda) */}
        <div className="w-full md:w-1/2 bg-slate-50 p-6 flex flex-col">
          <div className="relative flex-1 min-h-[300px] md:min-h-[400px] w-full rounded-2xl overflow-hidden bg-white mb-4 border border-slate-100">
            <Image 
              src={product.images[activeImage] || "/placeholder.webp"} 
              alt={product.name}
              fill
              className="object-contain p-4 mix-blend-multiply transition-transform duration-500 hover:scale-105"
            />
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none z-20">
              {product.discountBadge && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                  {product.discountBadge}
                </span>
              )}
              {product.isNew && !product.discountBadge && (
                <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                  NUEVO
                </span>
              )}
            </div>
          </div>
          
          {/* Miniaturas */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto hide-scrollbar snap-x py-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition snap-center ${activeImage === idx ? 'border-blue-600 shadow-md' : 'border-transparent hover:border-slate-300 bg-white'}`}
                >
                  <Image src={img} alt={`${product.name} ${idx + 1}`} fill className="object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detalles (Derecha) */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto">
          <span className="text-xs font-bold tracking-widest text-blue-600 uppercase mb-2">{product.category}</span>
          <h2 className="text-2xl font-black text-slate-900 leading-tight mb-2">{product.name}</h2>
          
          <div className="flex items-center gap-2 mb-4">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating || 5) ? 'fill-current' : 'text-slate-300'}`} />
              ))}
            </div>
            <span className="text-xs text-slate-500 font-bold">({product.reviews || 0} reseñas)</span>
          </div>

          <div className="flex items-end gap-3 mb-6">
            <span className="text-3xl font-black text-slate-900">S/ {currentPrice.toFixed(2)}</span>
            {product.originalPrice && (
              <span className="text-sm font-bold text-slate-400 line-through mb-1">
                S/ {product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <p className="text-sm text-slate-600 mb-8 line-clamp-3">
            {product.description || "Un producto increíble con tecnología de punta para mejorar tu vida diaria."}
          </p>

          {/* Variantes */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Opción: <span className="text-slate-500">{selectedVariant?.name}</span></h3>
              <div className="flex flex-wrap gap-2">
                {((product.variants as any[]) || []).map((variant) => (
                  <button 
                    key={variant.id}
                    onClick={() => {
                      setSelectedVariant(variant);
                      setQuantity(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg border-2 transition-all font-bold text-xs ${selectedVariant?.id === variant.id ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                  >
                    {variant.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col gap-3">
            {/* Alerta de Stock */}
            {currentStock > 0 && currentStock <= 5 && (
              <p className="text-orange-500 text-xs font-bold animate-pulse flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> ¡Date prisa, solo quedan {currentStock} en stock!
              </p>
            )}
            {currentStock > 5 && (
              <p className="text-emerald-500 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Stock disponible
              </p>
            )}

            {currentStock === 0 ? (
              <Button disabled className="w-full bg-slate-100 text-slate-400 py-6 rounded-xl font-bold cursor-not-allowed">
                Agotado Temporalmente
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Selector de Cantidad */}
                <div className="flex items-center justify-between sm:justify-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 w-full sm:w-32 h-[52px]">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-colors p-1"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-slate-900 w-8 text-center text-sm">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => Math.min(currentStock, q + 1))}
                    disabled={quantity >= currentStock}
                    className="text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-colors p-1"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Botón Agregar */}
                <Button 
                  onClick={handleAddToCart}
                  className="flex-1 bg-blue-600 text-white h-[52px] rounded-xl font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" /> Agregar al Carrito
                </Button>
              </div>
            )}
            
            <button 
              onClick={() => {
                onClose();
                router.push(`/producto/${product.id}`);
              }}
              className="text-sm font-bold text-slate-500 hover:text-blue-600 transition underline underline-offset-4 text-center mt-2"
            >
              Ver todos los detalles
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
