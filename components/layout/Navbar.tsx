import Link from "next/link";
import { getCachedCategories } from "@/lib/api/categories";
import { ChevronDown, Sparkles } from "lucide-react";

export default async function Navbar() {
  const allCategories = await getCachedCategories();
  const categories = allCategories.slice(0, 9);

  return (
    <nav className="bg-slate-900 text-white text-sm font-medium hidden md:block border-b border-slate-800 relative z-30">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-2">
        {categories.map((category) => (
          <div key={category.id} className="group relative h-full flex items-center">
            <Link 
              href={`/tienda?categoria=${category.slug}`} 
              className="flex items-center gap-1 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors uppercase tracking-wider text-[11px] font-bold text-slate-300 hover:text-white"
            >
              {category.name}
              <ChevronDown className="w-3 h-3 opacity-50 group-hover:rotate-180 transition-transform duration-300" />
            </Link>

            {/* Mega Menu Dropdown */}
            <div className="absolute top-full left-0 w-[400px] bg-white text-slate-900 shadow-2xl rounded-2xl border border-slate-100 opacity-0 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 overflow-hidden flex">
              
              {/* Columna Izquierda: Subcategorías Reales */}
              <div className="w-1/2 p-6 bg-slate-50 border-r border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Subcategorías</h4>
                <ul className="flex flex-col gap-3">
                  {category.children && category.children.length > 0 ? (
                    category.children.map((child: any) => (
                      <li key={child.id}>
                        <Link href={`/tienda?categoria=${child.slug}`} className="text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors">
                          {child.name}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li>
                      <Link href={`/tienda?categoria=${category.slug}`} className="text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors">
                        Ver todo {category.name}
                      </Link>
                    </li>
                  )}
                </ul>
              </div>

              {/* Columna Derecha: Destacado */}
              <div className="w-1/2 p-6 flex flex-col justify-center items-center text-center bg-white group/promo cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover/promo:opacity-100 transition-opacity"></div>
                <Sparkles className="w-6 h-6 text-blue-500 mb-3 relative z-10" />
                <h5 className="font-black text-slate-900 mb-1 relative z-10">Colección<br/>Exclusiva</h5>
                <p className="text-xs text-slate-500 mb-4 relative z-10">Descubre lo mejor de nuestra tecnología.</p>
                <Link 
                  href={`/tienda?categoria=${category.slug}`}
                  className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg group-hover/promo:bg-blue-600 group-hover/promo:text-white transition-colors relative z-10"
                >
                  Explorar
                </Link>
              </div>

            </div>
          </div>
        ))}

        {/* Link extra estático basado en el wireframe 
        <Link 
          href="/tienda" 
          className="ml-auto flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors uppercase tracking-wider text-[11px] font-black text-white shadow-lg shadow-blue-900/50"
        >
          MARCAS
        </Link>*/}
      </div>
    </nav>
  );
}
