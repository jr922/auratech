"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, ShoppingBag, User } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useUIStore } from "@/store/uiStore";

export default function BottomNav() {
  const pathname = usePathname();
  const { totalItems, isHydrated: cartHydrated } = useCartStore();
  const { items: wishlistItems, isHydrated: wishHydrated } = useWishlistStore();
  const openCart = useUIStore((state) => state.openCart);

  const navItems = [
    { name: "Inicio", href: "/", icon: Home },
    { name: "Explorar", href: "/tienda", icon: Search },
    { name: "Favoritos", href: "/favoritos", icon: Heart, count: wishHydrated ? wishlistItems.length : 0 },
    { name: "Perfil", href: "/mi-cuenta", icon: User },
  ];

  return (
    <div 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-200 px-6 pt-3 shadow-[0_-5px_20px_-15px_rgba(0,0,0,0.1)]"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <nav className="flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`relative flex flex-col items-center gap-1 min-w-[50px] transition-colors ${
                isActive ? "text-blue-600" : "text-slate-400 hover:text-slate-900"
              }`}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 ${isActive ? "fill-current" : ""}`} />
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce-short">
                    {item.count}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-bold ${isActive ? "opacity-100" : "opacity-0"} transition-opacity`}>
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* Botón Especial para el Carrito (Abre el Modal, no cambia de página) */}
        <button 
          onClick={openCart}
          className="relative flex flex-col items-center gap-1 min-w-[50px] text-slate-400 hover:text-slate-900 transition-colors"
        >
          <div className="relative">
            <ShoppingBag className="w-6 h-6" />
            {cartHydrated && totalItems() > 0 && (
              <span className="absolute -top-1 -right-2 bg-blue-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce-short">
                {totalItems()}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold opacity-0 transition-opacity">
            Carrito
          </span>
        </button>
      </nav>
    </div>
  );
}
