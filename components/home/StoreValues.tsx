import { ShieldCheck, Palette, Star, Smartphone, HeartHandshake } from "lucide-react";

const values = [
  { icon: ShieldCheck, title: "Protección", description: "Materiales resistentes que cuidan tu equipo diariamente." },
  { icon: Palette, title: "Diseño", description: "Estilos modernos que reflejan tu personalidad." },
  { icon: Star, title: "Calidad", description: "Acabados durables con ajuste perfecto." },
  { icon: Smartphone, title: "Compatibilidad", description: "Modelos exactos para múltiples dispositivos." },
  { icon: HeartHandshake, title: "Confianza", description: "Compra segura con atención garantizada." },
];

export default function StoreValues() {
  return (
    <section className="bg-slate-50 py-16">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-12">
          Aura Tech, más que un clic.
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {values.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex flex-col items-center gap-4 group">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-700 text-lg group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 mt-2 px-2">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
