"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function CatalogSort({ totalResults }: { totalResults: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "latest";

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    params.delete("page");
    router.push(`/tienda?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-50 p-4 rounded-xl gap-4">
      <span className="text-sm font-medium text-slate-500">
        Mostrando <strong className="text-slate-900">{totalResults}</strong> resultados
      </span>
      
      <div className="flex items-center gap-4 text-sm font-medium">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Ordenar por:</span>
          <select 
            value={currentSort}
            onChange={handleSortChange}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-600 text-slate-900 cursor-pointer shadow-sm"
          >
            <option value="latest">Más Recientes</option>
            <option value="price-asc">Precio: Menor a Mayor</option>
            <option value="price-desc">Precio: Mayor a Menor</option>
            <option value="name-asc">Nombre: A-Z</option>
          </select>
        </div>
      </div>
    </div>
  );
}
