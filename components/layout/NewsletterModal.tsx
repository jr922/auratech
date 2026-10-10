"use client";

import { useState, useEffect } from "react";
import { X, Mail, Gift, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { subscribeNewsletter } from "@/app/actions/forms";

export default function NewsletterModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Solo mostramos el modal en la página principal
    if (pathname !== "/") return;

    // Verificar si ya se suscribió o cerró el modal antes
    const hasSeenModal = localStorage.getItem("hasSeenNewsletterModal");
    if (!hasSeenModal) {
      // Retrasar la aparición para no ser tan invasivo
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 5000); // Aparece a los 5 segundos

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("hasSeenNewsletterModal", "true");
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    
    // Petición real al backend para guardar el correo
    const res = await subscribeNewsletter(email);
    setIsLoading(false);

    if (res.success) {
      toast.success(res.isNew ? "¡Gracias por suscribirte!" : "¡Hola de nuevo!", {
        description: "Hemos aplicado el código AURA20 a tu portapapeles."
      });
      
      // Guardar en el portapapeles el cupón y mostrarlo
      navigator.clipboard.writeText("AURA20");
      handleClose();
    } else {
      toast.error("Hubo un problema", { description: res.error });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-300">
        
        {/* Lado de Imagen (Izquierda) */}
        <div className="hidden md:block w-1/2 bg-blue-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-90" />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white text-center z-10">
            <Gift className="w-20 h-20 mb-6 text-blue-200" />
            <h3 className="text-4xl font-black mb-4 leading-tight">Tu Primer Regalo</h3>
            <p className="text-blue-100 text-lg font-medium">Únete a nuestra comunidad y desbloquea acceso a ofertas secretas y lanzamientos antes que nadie.</p>
          </div>
          
          {/* Círculos decorativos */}
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </div>

        {/* Lado de Formulario (Derecha) */}
        <div className="w-full md:w-1/2 p-8 md:p-12 relative flex flex-col justify-center">
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <span className="text-blue-600 font-bold tracking-wider text-xs uppercase mb-2">Bienvenido a Aura Tech</span>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">¡Obtén 20% de Descuento!</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Suscríbete a nuestro boletín y llévate un cupón especial para tu primera compra. Cero spam, solo buenas noticias.
          </p>

          <form onSubmit={handleSubscribe} className="flex flex-col gap-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="email" 
                placeholder="tu@correo.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? "Enviando..." : (
                <>
                  Quiero mi descuento
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <button 
            onClick={handleClose}
            className="mt-6 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            No, gracias. Prefiero pagar precio completo.
          </button>
        </div>
      </div>
    </div>
  );
}
