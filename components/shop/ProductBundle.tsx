"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Check, ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/data";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import { validateCoupon } from "@/app/actions/coupons";

interface ProductBundleProps {
  mainProduct: {
    id: string;
    name: string;
    price: number;
    image: string;
    variantId?: string;
    stock: number;
  };
  suggestedProducts: Product[];
}

export default function ProductBundle({ mainProduct, suggestedProducts }: ProductBundleProps) {
  // Solo tomaremos hasta 2 productos sugeridos para el bundle
  const bundleItems = suggestedProducts.slice(0, 2);
  
  if (bundleItems.length === 0) return null;

  // Estado para saber cuáles de los adicionales están seleccionados (por defecto todos)
  const [selectedIds, setSelectedIds] = useState<string[]>(bundleItems.map(p => p.id));
  const [isAdding, setIsAdding] = useState(false);
  const addItem = useCartStore(state => state.addItem);
  const applyCoupon = useCartStore(state => state.applyCoupon);
  const totalPrice = useCartStore(state => state.totalPrice);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectedBundleItems = bundleItems.filter(p => selectedIds.includes(p.id));
  
  const originalTotal = mainProduct.price + selectedBundleItems.reduce((acc, p) => acc + p.price, 0);
  // Aplicamos un 10% de descuento si compran el bundle de 2 o más ítems
  const hasBundleDiscount = selectedBundleItems.length > 0;
  const finalTotal = hasBundleDiscount ? originalTotal * 0.90 : originalTotal;

  const handleAddBundleToCart = async () => {
    setIsAdding(true);
    
    // Añadir producto principal
    addItem({
      id: mainProduct.variantId || mainProduct.id,
      productId: mainProduct.id,
      variantId: mainProduct.variantId,
      name: mainProduct.name,
      price: mainProduct.price,
      quantity: 1,
      maxStock: mainProduct.stock,
      image: mainProduct.image,
    });

    // Añadir productos sugeridos seleccionados
    selectedBundleItems.forEach(prod => {
      const image = (Array.isArray(prod.images) && prod.images.length > 0) ? prod.images[0] : "/placeholder.webp";

      addItem({
        id: (prod.variants as any[])?.[0]?.id || prod.id,
        productId: prod.id,
        variantId: (prod.variants as any[])?.[0]?.id,
        name: prod.name,
        price: prod.price,
        quantity: 1,
        maxStock: (prod.variants as any[])?.[0]?.stock ?? prod.stock,
        image,
      });
    });

    // Aplicar cupón de bundle si corresponde
    if (hasBundleDiscount) {
      const newTotal = totalPrice(); // El totalPrice actualizado de Zustand
      const res = await validateCoupon("BUNDLE10", newTotal);
      if (res.success && res.coupon) {
        applyCoupon(res.coupon);
      }
    }

    toast.success('¡Bundle añadido al carrito!', {
      description: `Se han añadido ${selectedBundleItems.length + 1} productos con descuento a tu carrito.`,
    });

    setTimeout(() => setIsAdding(false), 1000);
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8 mt-12 mb-12">
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-xl font-black text-slate-900 tracking-tight">Comprados juntos habitualmente</h3>
        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider hidden md:inline-block">Ahorra 10%</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* IMÁGENES DEL BUNDLE */}
        <div className="flex-1 flex items-center gap-2 md:gap-4 overflow-x-auto pb-4">
          {/* Main Product */}
          <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-2xl border-2 border-blue-500 p-2 shrink-0 relative">
            <Image src={mainProduct.image} alt={mainProduct.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-contain p-2" />
            <div className="absolute -top-3 -right-3 bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
          </div>

          {bundleItems.map((item, idx) => {
            const isSelected = selectedIds.includes(item.id);
            const img = (Array.isArray(item.images) && item.images.length > 0) ? item.images[0] : "/placeholder.webp";

            return (
              <div key={item.id} className="flex items-center gap-2 md:gap-4 shrink-0">
                <Plus className="w-6 h-6 text-slate-300" />
                <div 
                  onClick={() => toggleSelection(item.id)}
                  className={`w-24 h-24 md:w-32 md:h-32 bg-white rounded-2xl border-2 p-2 relative cursor-pointer transition-all ${isSelected ? 'border-emerald-500 shadow-md shadow-emerald-100' : 'border-slate-200 opacity-50 hover:opacity-100'}`}
                >
                  <Image src={img} alt={item.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-contain p-2" />
                  <div className={`absolute -top-3 -right-3 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-transparent'}`}>
                    <Check className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* RESUMEN Y BOTÓN */}
        <div className="w-full lg:w-72 flex flex-col justify-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="mb-4">
            <span className="text-sm font-bold text-slate-500 block mb-1">Precio Total:</span>
            {hasBundleDiscount ? (
              <div className="flex flex-col">
                <span className="text-3xl font-black text-slate-900 leading-none">S/ {finalTotal.toFixed(2)}</span>
                <span className="text-sm font-bold text-slate-400 line-through mt-1">S/ {originalTotal.toFixed(2)}</span>
              </div>
            ) : (
              <span className="text-3xl font-black text-slate-900 leading-none">S/ {finalTotal.toFixed(2)}</span>
            )}
          </div>
          
          <button 
            onClick={handleAddBundleToCart}
            disabled={isAdding}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isAdding ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-200'}`}
          >
            {isAdding ? (
              <><Check className="w-5 h-5" /> Añadido</>
            ) : (
              <><ShoppingBag className="w-5 h-5" /> Añadir Conjunto</>
            )}
          </button>
        </div>
      </div>

      {/* CHECKBOXES DE DETALLE */}
      <div className="mt-8 flex flex-col gap-3">
        <label className="flex items-center gap-3 cursor-not-allowed">
          <input type="checkbox" checked readOnly className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 pointer-events-none accent-blue-600" />
          <span className="font-bold text-slate-900 text-sm">Este artículo: {mainProduct.name} - S/ {mainProduct.price.toFixed(2)}</span>
        </label>
        
        {bundleItems.map(item => (
          <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={selectedIds.includes(item.id)} 
              onChange={() => toggleSelection(item.id)}
              className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-500" 
            />
            <span className={`text-sm font-bold transition-colors ${selectedIds.includes(item.id) ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>
              Sugerido: {item.name} - S/ {item.price.toFixed(2)}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
