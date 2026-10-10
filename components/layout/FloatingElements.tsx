"use client";

import { MessageCircle, ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function FloatingElements() {
  const [showScroll, setShowScroll] = useState(false);
  const phoneNumber = "51992279632";
  const message = "Hola Aura Tech, necesito ayuda con una compra.";
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScroll(true);
      } else {
        setShowScroll(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-[90px] md:bottom-6 right-4 md:right-6 z-50 flex flex-col items-center gap-3 pointer-events-none">
      
      {/* Botón Scroll to Top */}
      <button
        onClick={scrollToTop}
        aria-label="Volver arriba"
        className={cn(
          "w-12 h-12 bg-slate-900/80 backdrop-blur-md text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-all duration-300 pointer-events-auto",
          showScroll ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <ArrowUp className="w-5 h-5" />
      </button>

      {/* Botón WhatsApp */}
      <a
        href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-[#25D366] text-white p-4 rounded-full shadow-lg shadow-[#25D366]/30 hover:scale-110 transition-transform duration-300 flex items-center justify-center group relative pointer-events-auto"
        aria-label="Contactar por WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
        {/* Tooltip */}
        <span className="absolute right-full mr-4 bg-white text-slate-800 text-sm font-bold py-2 px-4 rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap border border-slate-100">
          ¿Necesitas ayuda?
        </span>
      </a>

    </div>
  );
}
