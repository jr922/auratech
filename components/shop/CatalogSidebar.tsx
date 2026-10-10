"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Filter } from "lucide-react";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
  slug: string;
}


interface Brand { id: string; name: string; slug: string; }
interface Category { id: string; name: string; slug: string; children?: Category[]; }
interface CatalogSidebarProps { brands?: Brand[];
  categories: Category[];
}

export default function CatalogSidebar({ categories, brands }: CatalogSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  
  
  const currentCategory = searchParams.get("categoria");
  const currentBrand = searchParams.get("marca");

  const handleBrandToggle = (slug: string) => {
    let currentBrands = currentBrand ? currentBrand.split(",") : [];
    if (currentBrands.includes(slug)) {
      currentBrands = currentBrands.filter(b => b !== slug);
    } else {
      currentBrands.push(slug);
    }
    router.push(`/tienda?${createQueryString("marca", currentBrands.join(","))}`);
  };

  
  // Estado local para el slider de precios
  const initialMinPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : 10;
  const initialMaxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : 5000;
  
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      
      // Si el usuario hace click en una Categoría o Marca, borramos su búsqueda de texto
      // para evitar cruces extraños que den 0 resultados
      if (name === "categoria" || name === "marca") {
        params.delete("q");
      }
      
      params.delete("page");
      return params.toString();
    },
    [searchParams]
  );

  const handleCategoryToggle = (slug: string) => {
    const newValue = currentCategory === slug ? "" : slug;
    router.push(`/tienda?${createQueryString("categoria", newValue)}`);
    setIsOpen(false);
  };

  const handlePriceFilter = () => {
    let params = new URLSearchParams(searchParams.toString());
    params.set("minPrice", minPrice.toString());
    params.set("maxPrice", maxPrice.toString());
    params.delete("page");
    router.push(`/tienda?${params.toString()}`);
    setIsOpen(false);
  };

  const clearFilters = () => {
    router.push(`/tienda`);
    setIsOpen(false);
  };

  const FiltersContent = (
    <div className="flex flex-col gap-8 w-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-900 text-lg tracking-tight">CATEGORÍAS</h3>
          {(currentCategory || searchParams.has("minPrice")) && (
            <button onClick={clearFilters} className="text-xs font-bold text-red-500 hover:text-red-600 transition">
              Limpiar Todo
            </button>
          )}
        </div>
        <ul className="flex flex-col gap-4 text-sm font-medium text-slate-600 pb-2">
          
          {categories.map((cat: any) => (
            <li key={cat.id} className="flex flex-col gap-2">
              <span className="font-black text-slate-900 uppercase text-xs tracking-wider">
                {cat.name} <span className="text-slate-400 font-normal">({cat._count?.products || 0})</span>
              </span>
              {cat.children && cat.children.length > 0 ? (
                <ul className="flex flex-col gap-2 pl-3 border-l-2 border-slate-100 ml-1 mt-1">
                  {cat.children.map((child: any) => {
                    const isSelected = currentCategory === child.slug;
                    return (
                      <li key={child.id}>
                        <button 
                          onClick={() => handleCategoryToggle(child.slug)} 
                          className={`text-left w-full cursor-pointer transition flex justify-between items-center ${isSelected ? "text-blue-600 font-bold" : "text-slate-500 hover:text-blue-600"}`} 
                          title={child.name}
                        >
                          <span className="line-clamp-1">{child.name}</span>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <button 
                  onClick={() => handleCategoryToggle(cat.slug)} 
                  className={`text-left w-full mt-1 cursor-pointer transition flex justify-between items-center ${currentCategory === cat.slug ? "text-blue-600 font-bold" : "text-slate-500 hover:text-blue-600"}`} 
                  title={cat.name}
                >
                  <span className="line-clamp-1">{cat.name}</span>
                  {currentCategory === cat.slug && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                </button>
              )}
            </li>
          ))}

        </ul>
      </div>

      
      {brands && brands.length > 0 && (
      <div className="border-t border-slate-100 pt-8 mb-8">
        <h3 className="font-black text-slate-900 text-lg tracking-tight mb-4">MARCAS</h3>
        <div className="grid grid-cols-2 gap-2">
          {brands.map((brand: any) => {
            const isSelected = currentBrand ? currentBrand.split(",").includes(brand.slug) : false;
            return (
              <button 
                key={brand.id}
                onClick={() => handleBrandToggle(brand.slug)}
                className={`relative flex items-center justify-center p-3 h-14 rounded-xl border-2 transition-all font-bold text-xs overflow-hidden group ${isSelected ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-100 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}
                title={brand.name}
              >
                {brand.imageUrl && !failedImages[brand.id] ? (
                  <>
                    <Image 
                      src={brand.imageUrl} 
                      alt={brand.name} 
                      fill
                      unoptimized={true}
                      onError={() => setFailedImages(prev => ({...prev, [brand.id]: true}))}
                      className={`object-contain p-2 mix-blend-multiply transition-transform ${isSelected ? 'scale-110' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'}`}
                      sizes="80px"
                    />
                    {/* Indicador azul si está seleccionado pero es un logo */}
                    {isSelected && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600 shadow-sm"></div>}
                  </>
                ) : (
                  <span className="truncate">{brand.name}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      )}

      <div className="border-t border-slate-100 pt-8">

        <h3 className="font-black text-slate-900 text-lg mb-4 tracking-tight">PRECIO MÁXIMO</h3>
        <div className="flex flex-col gap-4">
          <input 
            type="range" 
            min="10" 
            max="10000" 
            step="50"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-blue-600" 
          />
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500">S/ 0 - S/ {maxPrice}</span>
            <button 
              onClick={handlePriceFilter}
              className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-600 transition shadow-md"
            >
              Filtrar
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-8">
        <h3 className="font-black text-slate-900 text-lg mb-4 tracking-tight">DISPONIBILIDAD</h3>
        <ul className="flex flex-col gap-3 text-sm font-medium text-slate-600">
          <li className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={searchParams.get("inStock") === "true"}
              onChange={() => {
                const isChecked = searchParams.get("inStock") === "true";
                router.push(`/tienda?${createQueryString("inStock", isChecked ? "" : "true")}`);
                setIsOpen(false);
              }}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
            />
            <label className="cursor-pointer">Mostrar solo En Stock</label>
          </li>
          <li className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={searchParams.get("hasDiscount") === "true"}
              onChange={() => {
                const isChecked = searchParams.get("hasDiscount") === "true";
                router.push(`/tienda?${createQueryString("hasDiscount", isChecked ? "" : "true")}`);
                setIsOpen(false);
              }}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
            />
            <label className="cursor-pointer">Con descuento aplicado</label>
          </li>
        </ul>
      </div>
    </div>
  );

  return (
    <>
      {/* MOBILE TRIGGER */}
      <div className="md:hidden w-full mb-6">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-blue-600 transition">
            <Filter className="w-5 h-5" />
            Filtrar Productos
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[350px] p-6 overflow-y-auto">
            <SheetHeader className="mb-8">
              <SheetTitle className="text-2xl font-black text-slate-900 text-left">Filtros</SheetTitle>
            </SheetHeader>
            {FiltersContent}
          </SheetContent>
        </Sheet>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-full md:w-1/4 shrink-0 flex-col gap-8 sticky top-24 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pb-12 scrollbar-thin scrollbar-thumb-slate-200 pr-4">
        {FiltersContent}
      </aside>
    </>
  );
}
