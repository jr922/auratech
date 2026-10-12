"use client";

import { useState } from "react";
import { Search, Package, MapPin, Truck } from "lucide-react";
import { trackOrder } from "@/app/actions/order";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

export default function RastreoPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !email) {
      toast.error("Por favor completa ambos campos");
      return;
    }

    setIsSearching(true);
    const res = await trackOrder(orderId, email);
    
    if (res.success && res.fullOrderId) {
      toast.success("¡Pedido encontrado!");
      router.push(`/pedido/${res.fullOrderId}`);
    } else {
      toast.error("Pedido no encontrado", { description: res.error });
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-[80vh] flex flex-col">
      {/* Header Visual */}
      <div className="bg-slate-900 pt-10 pb-28 md:pt-16 md:pb-32 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
            <Search className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3 md:mb-4 tracking-tight">Rastrea tu pedido</h1>
          <p className="text-slate-400 text-sm md:text-lg">Ingresa tu número de pedido y el correo con el que realizaste la compra para ver el estado de tu envío en tiempo real.</p>
        </div>
      </div>

      {/* Formulario de Búsqueda */}
      <div className="flex-1 px-4 pb-12">
        <div className="max-w-md mx-auto -mt-20 md:-mt-24 relative z-20 bg-white rounded-3xl p-5 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          <form onSubmit={handleSearch} className="flex flex-col gap-5 md:gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Número de Pedido</label>
              <Input 
                placeholder="Ej. A8X9B2" 
                value={orderId}
                onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                className="h-12 uppercase font-mono tracking-widest bg-slate-50 focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Correo Electrónico</label>
              <Input 
                type="email"
                placeholder="tu@correo.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                className="h-12 bg-slate-50 focus:bg-white"
                required
              />
            </div>
            <Button 
              type="submit" 
              disabled={isSearching}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-200 mt-2 transition-transform active:scale-95"
            >
              {isSearching ? "Buscando..." : "Localizar mi pedido"}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500 mb-2">¿Tienes una cuenta con nosotros?</p>
            <Link href="/mi-cuenta" className="text-sm font-bold text-blue-600 hover:underline">
              Inicia sesión para ver tu historial completo
            </Link>
          </div>
        </div>
        
        {/* Features Info */}
        <div className="max-w-4xl mx-auto mt-10 md:mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center px-4">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4"><Package className="w-6 h-6" /></div>
            <h3 className="font-bold text-slate-900 mb-2">Empaque Seguro</h3>
            <p className="text-sm text-slate-500">Todos los pedidos se empacan el mismo día de la confirmación.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4"><Truck className="w-6 h-6" /></div>
            <h3 className="font-bold text-slate-900 mb-2">Envíos Rápidos</h3>
            <p className="text-sm text-slate-500">Trabajamos con las mejores agencias para entregas en 24-48 horas.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4"><MapPin className="w-6 h-6" /></div>
            <h3 className="font-bold text-slate-900 mb-2">Seguimiento Real</h3>
            <p className="text-sm text-slate-500">Actualizamos tu línea de tiempo conforme tu paquete avanza.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
