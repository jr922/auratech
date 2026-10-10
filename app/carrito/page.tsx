"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import { X, Minus, Plus, CreditCard, Tag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { validateCoupon } from "@/app/actions/coupons";

import ProductCard from "@/components/ui/ProductCard";
import type { Product } from "@/lib/data";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, shippingOption, setShippingOption, appliedCoupon, applyCoupon, removeCoupon } = useCartStore();
  const [isMounted, setIsMounted] = useState(false);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [couponInput, setCouponInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    fetch('/api/products/recomendados')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRecommended(data);
      })
      .catch(console.error);
  }, []);
  
  const subtotal = totalPrice();
  
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    const res = await validateCoupon(couponInput.trim(), subtotal);
    if (res.success && res.coupon) {
      applyCoupon(res.coupon);
      setCouponInput("");
      const typeLabel = res.coupon.discountType === "PERCENTAGE" ? `${res.coupon.discountValue}%` : `S/ ${res.coupon.discountValue}`;
      toast.success('Cupón aplicado', { description: `Se te ha otorgado un descuento de ${typeLabel}` });
    } else {
      toast.error('Cupón inválido', { description: res.error });
    }
    setIsApplyingCoupon(false);
  };

  // Recalcular el descuento en tiempo real según el tipo de cupón
  let dynamicDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === "PERCENTAGE") {
      dynamicDiscount = subtotal * (appliedCoupon.discountValue / 100);
    } else {
      dynamicDiscount = appliedCoupon.discountValue > subtotal ? subtotal : appliedCoupon.discountValue;
    }
  }
  
  const shippingCost = shippingOption === "lima" ? 10.00 : shippingOption === "provincia" ? 25.00 : 0.00;
  const finalTotal = subtotal - dynamicDiscount + (items.length > 0 ? shippingCost : 0);

  if (!isMounted) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500 text-lg">Cargando carrito...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-20">
      
      {/* TÍTULO */}
      <div className="bg-white border-b border-slate-100 py-12 mb-8">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Carrito de Compras</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 w-full flex flex-col lg:flex-row gap-8">
        
        {/* COLUMNA IZQUIERDA (70% - Tabla de items) */}
        <div className="w-full lg:w-[70%] flex flex-col gap-8">
          
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-sm font-bold text-slate-500 uppercase tracking-wider">
                  <th className="pb-4 pl-4">Producto</th>
                  <th className="pb-4">Precio</th>
                  <th className="pb-4 text-center">Cant</th>
                  <th className="pb-4 text-right pr-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500 font-medium">
                      Tu carrito está vacío. <Link href="/tienda" className="text-blue-600 hover:underline">Ir a la tienda</Link>
                    </td>
                  </tr>
                ) : (
                  items.map(item => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-6 pr-4">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition"
                          >
                            <X className="w-5 h-5" />
                          </button>
                          <Link href={`/producto/${item.productId || item.id}`} className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0 relative hover:opacity-80 transition block">
                            {item.image ? (
                              <Image src={item.image} alt={item.name} width={96} height={96} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-[8px] font-bold text-slate-400">IMG</span>
                              </div>
                            )}
                          </Link>
                          <Link href={`/producto/${item.productId || item.id}`} className="font-bold text-slate-800 line-clamp-2 max-w-[250px] hover:text-blue-600 hover:underline transition-colors cursor-pointer">
                            {item.name}
                          </Link>
                        </div>
                      </td>
                      <td className="py-6 font-bold text-slate-600">
                        S/ {item.price.toFixed(2)}
                      </td>
                      <td className="py-6">
                        <div className="flex items-center justify-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-2 w-28 h-10 mx-auto">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="text-slate-500 hover:text-blue-600 p-1"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold text-slate-900 w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="text-slate-500 hover:text-blue-600 p-1"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="py-6 font-black text-slate-900 text-right pr-4">
                        S/ {(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {items.length > 0 && (
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-100">
                <Link href="/tienda" className="text-sm font-bold text-blue-600 hover:underline">
                  ← Seguir comprando
                </Link>
                <button className="bg-slate-100 text-slate-600 font-bold px-6 py-3 rounded-xl hover:bg-slate-200 transition">
                  Actualizar Carrito
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 w-full md:w-2/3">
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <Tag className="w-5 h-5" />
                  Cupón aplicado: {appliedCoupon.code}
                </div>
                <button 
                  onClick={removeCoupon}
                  className="text-emerald-600 hover:text-red-500 transition font-medium text-sm"
                >
                  Quitar
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                <input 
                  type="text" 
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Código de cupón" 
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 bg-white uppercase"
                  disabled={isApplyingCoupon}
                />
                <button 
                  onClick={handleApplyCoupon}
                  disabled={isApplyingCoupon || !couponInput.trim()}
                  className="bg-slate-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-600 transition shrink-0 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {isApplyingCoupon ? 'Aplicando...' : 'Aplicar cupón'}
                </button>
              </div>
            )}
          </div>

          {/* CROSS SELLING */}
          {recommended.length > 0 && (
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h2 className="text-2xl font-black text-slate-900 mb-6">Te podría interesar</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recommended.slice(0, 2).map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}

        </div>

        {/* COLUMNA DERECHA (30% - Totales) */}
        <div className="w-full lg:w-[30%]">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 sticky top-28">
            <h2 className="text-xl font-black text-slate-900 mb-6 pb-6 border-b border-slate-100">
              TOTALES DEL CARRITO
            </h2>
            
            <div className="flex justify-between items-center mb-4 text-slate-600">
              <span className="font-medium">Subtotal</span>
              <span className="font-bold text-slate-900">S/ {subtotal.toFixed(2)}</span>
            </div>
            
            {dynamicDiscount > 0 && (
              <div className="flex justify-between items-center mb-6 text-emerald-600">
                <span className="font-bold flex items-center gap-1"><Tag className="w-4 h-4"/> Descuento</span>
                <span className="font-black">- S/ {dynamicDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="mb-8 border-t border-slate-100 pt-6">
              <span className="font-medium text-slate-600 block mb-4">Envío</span>
              <div className="flex flex-col gap-3">
                <label className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition ${shippingOption === "lima" ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="shipping" 
                      checked={shippingOption === "lima"}
                      onChange={() => setShippingOption("lima")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-slate-700">Envío Lima Metropolitana</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">S/ 10.00</span>
                </label>

                <label className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition ${shippingOption === "provincia" ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="shipping" 
                      checked={shippingOption === "provincia"}
                      onChange={() => setShippingOption("provincia")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-slate-700">Envío a Provincia</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">S/ 25.00</span>
                </label>
                
                <label className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition ${shippingOption === "tienda" ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="shipping" 
                      checked={shippingOption === "tienda"}
                      onChange={() => setShippingOption("tienda")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-slate-700">Recojo en Tienda</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">Gratis</span>
                </label>
              </div>
            </div>

            <div className="flex justify-between items-center mb-8 pb-8 border-b border-slate-100">
              <span className="text-lg font-black text-slate-900">Total</span>
              <span className="text-3xl font-black text-blue-600">S/ {finalTotal.toFixed(2)}</span>
            </div>

            <Link href="/checkout" className="block w-full">
              <button className="w-full bg-blue-600 text-white font-black text-lg py-4 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all uppercase tracking-wide">
                Ir a Finalizar Compra
              </button>
            </Link>

            <div className="mt-6 flex flex-col items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Medios de pago aceptados</span>
              <div className="flex gap-2 text-slate-300">
                <CreditCard className="w-8 h-8" />
                {/* Simulación de logos de tarjetas */}
                <div className="w-12 h-8 bg-slate-100 rounded flex items-center justify-center text-[8px] font-bold text-slate-400 border border-slate-200">VISA</div>
                <div className="w-12 h-8 bg-slate-100 rounded flex items-center justify-center text-[8px] font-bold text-slate-400 border border-slate-200">MC</div>
                <div className="w-12 h-8 bg-slate-100 rounded flex items-center justify-center text-[8px] font-bold text-slate-400 border border-slate-200">AMEX</div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
