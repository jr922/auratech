"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { useState } from "react";
import { Search, User, ShoppingBag, Menu, ChevronRight, Trash2, Plus, Minus, Heart, Package } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import Link from "next/link";
import AuthDropdown from "./AuthDropdown";
import { getCachedCategories } from "@/lib/api/categories";
import LiveSearch from "./LiveSearch";

import { useUIStore } from "@/store/uiStore";

export default function Header({ categories = [] }: { categories?: { name: string, slug: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Extraemos estado global para el carrito
  const isCartOpen = useUIStore((state) => state.isCartOpen);
  const openCart = useUIStore((state) => state.openCart);
  const closeCart = useUIStore((state) => state.closeCart);
  const setIsCartOpen = (open: boolean) => open ? openCart() : closeCart();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const { items, removeItem, updateQuantity, totalItems, totalPrice, isHydrated, clearCart } = useCartStore();
  const wishlist = useWishlistStore();
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4 md:gap-8">
        
        {/* Menú Hamburguesa (Móvil) */}
        <div className="md:hidden">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger className="text-slate-600 hover:text-blue-600 p-2 -ml-2">
              <Menu className="w-6 h-6" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 border-r-0 flex flex-col">
              <SheetHeader className="h-20 flex flex-row items-center justify-between px-6 border-b border-slate-100 m-0">
                <SheetTitle className="flex items-center gap-3 text-xl font-bold text-blue-600">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black">AT</div>
                  <span>AURA<span className="text-slate-900">TECH</span></span>
                </SheetTitle>
              </SheetHeader>
              <div className="p-4 flex-1 overflow-y-auto">
                
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Categorías</h3>
                <ul className="flex flex-col font-medium text-slate-700 mb-8">
                  {categories.map((cat) => (
                    <li key={cat.slug} className="border-b border-slate-50 last:border-0">
                      <Link href={`/tienda?categoria=${cat.slug}`} onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between py-4 hover:text-blue-600 px-2">
                        {cat.name}
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>
                    </li>
                  ))}
                </ul>

                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Ayuda y Soporte</h3>
                <ul className="flex flex-col font-medium text-slate-700">
                  <li className="border-b border-slate-50">
                    <Link href="/rastreo" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 py-4 hover:text-blue-600 px-2 text-blue-600 font-bold">
                      <Package className="w-5 h-5" />
                      Rastrear mi Pedido
                    </Link>
                  </li>
                  <li>
                    <Link href="/preguntas-frecuentes" onClick={() => setIsMenuOpen(false)} className="flex items-center py-4 hover:text-blue-600 px-2">
                      Ayuda
                    </Link>
                  </li>
                </ul>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 text-xl md:text-2xl font-bold text-blue-600 tracking-tight">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black">
            AT
          </div>
          <span className="hidden sm:inline">AURA<span className="text-slate-900">TECH</span></span>
        </Link>

        {/* Centro: Buscador Inteligente */}
        <LiveSearch />

        {/* Derecha: Acciones */}
        <div className="flex items-center gap-4 md:gap-6">
        {/*Boton rastreo*/} 
        <Link href="/rastreo" aria-label="Rastrear Pedido" className="relative hidden md:flex flex-col items-center text-slate-600 hover:text-blue-600 transition group">
            <Package className="w-6 h-6" />
            <span className="text-[10px] md:text-xs mt-0.5">Rastrear</span>
          </Link>
        {/*Boton favoritos*/}
          <Link href="/favoritos" aria-label="Favoritos" className="relative hidden sm:flex flex-col items-center text-slate-600 hover:text-red-500 transition group">
            <Heart className="w-6 h-6 group-hover:fill-red-50" />
            <span className="text-[10px] md:text-xs mt-0.5">Favoritos</span>
            {wishlist.isHydrated && wishlist.items.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center animate-bounce-short">
                {wishlist.items.length}
              </span>
            )}
          </Link>
          {/*Boton iniciar sesion*/} 
          <AuthDropdown />
          
          {/* Carrito usando Shadcn Sheet e icono ShoppingBag */}
          <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetTrigger 
              aria-label="Carrito" 
              className="hidden md:flex relative flex-col items-center text-slate-600 hover:text-blue-600 transition"
            >
              <ShoppingBag className="w-6 h-6" />
              <span className="hidden md:block text-xs mt-0.5">Carrito</span>
              {isHydrated && totalItems() > 0 && (
                <span className="absolute -top-1 -right-2 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center animate-bounce-short">
                  {totalItems()}
                </span>
              )}
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col border-l-0">
              <SheetHeader className="h-20 flex flex-row items-center justify-between px-6 border-b border-slate-100 shrink-0 m-0">
                <SheetTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                  Mi Carrito ({isHydrated ? totalItems() : 0})
                </SheetTitle>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                {items.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center mt-20">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <ShoppingBag className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-lg font-semibold text-slate-700 mb-2">Tu carrito está vacío</p>
                    <p className="text-sm text-slate-500 mb-6">Parece que aún no has agregado productos.</p>
                    <Button 
                      onClick={() => setIsCartOpen(false)}
                      className="bg-blue-600 text-white font-semibold py-6 px-8 rounded-xl hover:bg-blue-700 transition"
                    >
                      Empezar a comprar
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-end pb-1 border-b border-slate-50">
                      <button 
                        onClick={() => clearCart()} 
                        className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1.5 transition-colors py-1 px-2 hover:bg-red-50 rounded-md -mr-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Vaciar Carrito
                      </button>
                    </div>
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4 border-b border-slate-100 pb-4">
                        <button 
                          onClick={() => {
                            setIsCartOpen(false);
                            router.push(`/producto/${item.productId || item.id}`);
                          }}
                          className="relative w-20 h-20 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden shrink-0 group-hover:border-blue-200 transition-colors"
                        >
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-[10px] text-slate-400">Img</span>
                            </div>
                          )}
                        </button>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <button 
                              onClick={() => {
                                setIsCartOpen(false);
                                router.push(`/producto/${item.productId || item.id}`);
                              }}
                              className="text-left"
                            >
                              <h4 className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2 hover:text-blue-600 hover:underline transition-colors cursor-pointer">
                                {item.name}
                              </h4>
                            </button>
                            <p className="font-bold text-blue-600 mt-1">S/ {item.price.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-2 py-1">
                              <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-slate-500 hover:text-blue-600"><Minus className="w-3 h-3" /></button>
                              <span className="text-sm font-semibold">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                                disabled={item.quantity >= (item.maxStock || 99)}
                                className={item.quantity >= (item.maxStock || 99) ? "text-slate-300 cursor-not-allowed" : "text-slate-500 hover:text-blue-600"}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-red-500 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div className="border-t border-slate-100 p-6 bg-slate-50 shrink-0">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-600 font-medium">Subtotal</span>
                    <span className="text-xl font-black text-slate-900">S/ {isHydrated ? totalPrice().toFixed(2) : "0.00"}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">Los costos de envío se calcularán en el checkout.</p>
                  <Link 
                    href="/carrito"
                    className="w-full bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition text-center block mb-3"
                    onClick={() => setIsCartOpen(false)}
                  >
                    Ver Carrito Completo
                  </Link>
                  <Link 
                    href="/checkout"
                    className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 transition text-center block"
                    onClick={() => setIsCartOpen(false)}
                  >
                    Proceder al Pago
                  </Link>
                </div>
              )}
            </SheetContent>
          </Sheet>

        </div>
      </div>
    </header>
  );
}
