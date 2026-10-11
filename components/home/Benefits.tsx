import { CreditCard, Truck, Store } from "lucide-react";

export default function Benefits() {
  return (
    <div className="flex flex-col gap-12 pt-8">
      
      {/* SECCIÓN: BENEFICIOS (GRID DE 3) */}
      <section className="max-w-7xl mx-auto px-4 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-8">
          <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-row sm:flex-col items-center sm:text-center text-left gap-4 hover:bg-white hover:shadow-lg transition-all duration-300 border border-slate-100 group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 text-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <CreditCard className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-0.5 sm:mb-2 text-base sm:text-lg">Financiamiento</h3>
              <p className="text-xs sm:text-sm text-slate-600">Compra ahora y paga en cuotas cómodamente.</p>
            </div>
          </div>
          <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-row sm:flex-col items-center sm:text-center text-left gap-4 hover:bg-white hover:shadow-lg transition-all duration-300 border border-slate-100 group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-100 text-orange-600 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all">
              <Truck className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-0.5 sm:mb-2 text-base sm:text-lg">Envíos Express Lima</h3>
              <p className="text-xs sm:text-sm text-slate-600">Recibe tu pedido hasta en 4 hrs en zonas de cobertura.</p>
            </div>
          </div>
          <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-row sm:flex-col items-center sm:text-center text-left gap-4 hover:bg-white hover:shadow-lg transition-all duration-300 border border-slate-100 group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-100 text-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <Store className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-0.5 sm:mb-2 text-base sm:text-lg">Retiro en Tienda</h3>
              <p className="text-xs sm:text-sm text-slate-600">Compra Online y recoge sin ningún costo adicional.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

