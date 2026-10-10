"use client";

import { useEffect } from "react";
import { ServerCrash, RefreshCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Aquí podrías enviar el error a un servicio externo como Sentry
    console.error("AuraTech Error Boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-slate-50 rounded-3xl m-4 md:m-8 border border-slate-100 shadow-sm py-16">
      <div className="w-24 h-24 bg-red-100 text-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-sm rotate-3 hover:rotate-0 transition-transform duration-300">
        <ServerCrash className="w-12 h-12" />
      </div>
      
      <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
        ¡Uy! Algo salió mal
      </h1>
      
      <p className="text-slate-600 mb-8 max-w-md mx-auto text-sm md:text-base leading-relaxed">
        Nuestros servidores están tomando un respiro inesperado o perdimos la conexión. 
        No te preocupes, tus datos y tu carrito están completamente seguros.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto max-w-xs mx-auto">
        <Button 
          onClick={() => reset()} 
          className="bg-blue-600 text-white font-bold hover:bg-blue-700 h-12 px-6 rounded-xl flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Reintentar ahora
        </Button>
        
        <Button 
          asChild 
          variant="outline" 
          className="font-bold border-slate-200 text-slate-700 hover:bg-white h-12 px-6 rounded-xl flex items-center gap-2"
        >
          <Link href="/">
            <Home className="w-4 h-4" />
            Volver a la tienda
          </Link>
        </Button>
      </div>
      
      {/* Mensaje sutil para desarrolladores/soporte */}
      <p className="text-[10px] text-slate-400 mt-12 font-mono">
        Código de error: {error.digest || "ERR_UNKNOWN"}
      </p>
    </div>
  );
}
