"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { liveSearchProducts } from "@/app/actions/search";
import Image from "next/image";
import Link from "next/link";

export default function LiveSearch({ className = "hidden md:flex flex-1 max-w-xl relative" }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sincronizar con la URL
  useEffect(() => {
    setQuery(searchParams.get('q') || "");
  }, [searchParams]);

  // Cerrar al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsSearching(true);
        const data = await liveSearchProducts(query.trim());
        setResults(data);
        setIsSearching(false);
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false);
    if (query.trim()) {
      router.push(`/tienda?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push(`/tienda`);
    }
  };

  return (
    <div ref={wrapperRef} className={className}>
      <form onSubmit={handleSubmit} className="w-full relative">
        <Input
          name="q"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.length >= 2) setIsOpen(true);
          }}
          placeholder="Buscar por productos..."
          className="w-full bg-slate-50 border-slate-200 rounded-lg pl-4 pr-12 py-6 text-sm focus-visible:ring-blue-600 focus-visible:bg-white transition"
          autoComplete="off"
        />
        <Button 
          type="submit" 
          variant="ghost" 
          size="icon" 
          className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 hover:bg-transparent"
        >
          {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        </Button>
      </form>

      {/* Dropdown de Autocomplete */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
          {results.length > 0 ? (
            <ul className="py-2">
              <li className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-50">
                Productos Sugeridos
              </li>
              {results.map((product) => (
                <li key={product.id}>
                  <Link 
                    href={`/producto/${product.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="relative w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0">
                      <Image 
                        src={product.image} 
                        alt={product.name} 
                        fill 
                        sizes="48px"
                        className="object-contain p-1 mix-blend-multiply" 
                      />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-xs font-bold text-blue-600">{product.category}</span>
                      <span className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-700 transition">
                        {product.name}
                      </span>
                      <span className="text-sm font-black text-slate-900 mt-0.5">
                        S/ {product.price.toFixed(2)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
              <li className="border-t border-slate-50">
                <button 
                  onClick={handleSubmit}
                  className="w-full text-center py-4 text-sm font-bold text-blue-600 hover:bg-blue-50 transition"
                >
                  Ver todos los resultados para "{query}"
                </button>
              </li>
            </ul>
          ) : query.length >= 2 && !isSearching ? (
            <div className="p-8 text-center">
              <p className="text-sm font-bold text-slate-700 mb-1">No hay resultados</p>
              <p className="text-xs text-slate-500">Prueba con otra palabra clave</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
