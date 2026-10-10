import { CreditCard, Truck, Store } from "lucide-react";

export default function Benefits() {
  return (
    <div className="flex flex-col gap-12 pt-8">
      
      {/* SECCIÓN: BENEFICIOS (GRID DE 3) */}
      <section className="max-w-7xl mx-auto px-4 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-50 p-6 rounded-3xl flex flex-col items-center text-center hover:bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-slate-100 group">
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <CreditCard className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2 text-lg">Financiamiento</h3>
            <p className="text-sm text-slate-600">Compra ahora y paga en cuotas cómodamente.</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-3xl flex flex-col items-center text-center hover:bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-slate-100 group">
            <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all">
              <Truck className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2 text-lg">Envíos Express Lima</h3>
            <p className="text-sm text-slate-600">Recibe tu pedido hasta en 4 hrs en zonas de cobertura.</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-3xl flex flex-col items-center text-center hover:bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-slate-100 group">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <Store className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2 text-lg">Retiro en Tienda</h3>
            <p className="text-sm text-slate-600">Compra Online y recoge sin ningún costo adicional.</p>
          </div>
        </div>
      </section>

    </div>
  );
}

