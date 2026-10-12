"use client";

import { useState } from "react";
import { updateProductStock, updateProductPrice } from "@/app/actions/admin-products";
import { toast } from "sonner";
import { Search, Package, Save, Eye } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function AdminProductsTable({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // States to hold currently edited values per product ID
  const [editStock, setEditStock] = useState<Record<string, string>>({});
  const [editPrice, setEditPrice] = useState<Record<string, string>>({});

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category?.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleStockChange = (id: string, val: string) => setEditStock({ ...editStock, [id]: val });
  const handlePriceChange = (id: string, val: string) => setEditPrice({ ...editPrice, [id]: val });

  const handleSave = async (id: string) => {
    setLoadingId(id);
    let successCount = 0;
    
    // Save stock if changed
    if (editStock[id] !== undefined) {
      const newStock = parseInt(editStock[id]);
      if (!isNaN(newStock)) {
        const res = await updateProductStock(id, newStock);
        if (res.success) {
          setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
          successCount++;
          setEditStock(prev => { const n = {...prev}; delete n[id]; return n; });
        } else {
          toast.error(res.error || "Error al actualizar stock");
        }
      }
    }

    // Save price if changed
    if (editPrice[id] !== undefined) {
      const newPrice = parseFloat(editPrice[id]);
      if (!isNaN(newPrice)) {
        const res = await updateProductPrice(id, newPrice);
        if (res.success) {
          setProducts(prev => prev.map(p => p.id === id ? { ...p, price: newPrice } : p));
          successCount++;
          setEditPrice(prev => { const n = {...prev}; delete n[id]; return n; });
        } else {
          toast.error(res.error || "Error al actualizar precio");
        }
      }
    }

    if (successCount > 0) {
      toast.success("Cambios guardados");
    }

    setLoadingId(null);
  };

  const isEdited = (id: string) => editStock[id] !== undefined || editPrice[id] !== undefined;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between gap-4 md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o categoría..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />
        </div>
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-semibold uppercase tracking-wider">
              <th className="p-4">Producto</th>
              <th className="p-4">Categoría</th>
              <th className="p-4">Precio (S/)</th>
              <th className="p-4">Stock</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  No se encontraron productos.
                </td>
              </tr>
            ) : (
              filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-slate-50 transition group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden relative flex-shrink-0">
                         <Image 
                           src={product.images && JSON.parse(product.images)[0] ? JSON.parse(product.images)[0] : "/placeholder.webp"} 
                           alt={product.name}
                           fill
                           className="object-cover"
                         />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 line-clamp-1">{product.name}</p>
                        <p className="text-xs text-slate-500">{product.brand?.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 font-medium">
                    {product.category?.name}
                  </td>
                  <td className="p-4">
                    <input 
                      type="number"
                      step="0.01"
                      value={editPrice[product.id] !== undefined ? editPrice[product.id] : product.price}
                      onChange={(e) => handlePriceChange(product.id, e.target.value)}
                      className="w-24 px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      type="number"
                      value={editStock[product.id] !== undefined ? editStock[product.id] : product.stock}
                      onChange={(e) => handleStockChange(product.id, e.target.value)}
                      className={`w-20 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500 ${product.stock <= 5 ? 'border-orange-300 bg-orange-50' : 'border-slate-300'}`}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      {isEdited(product.id) && (
                        <button 
                          onClick={() => handleSave(product.id)}
                          disabled={loadingId === product.id}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                          title="Guardar cambios"
                        >
                          <Save className="w-5 h-5" />
                        </button>
                      )}
                      <Link href={`/producto/${product.slug}`} target="_blank" className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Ver en tienda">
                        <Eye className="w-5 h-5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Vista móvil: tarjetas */}
      <div className="md:hidden divide-y divide-slate-100">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            No se encontraron productos.
          </div>
        ) : (
          filteredProducts.map(product => (
            <div key={product.id} className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden relative shrink-0">
                  <Image
                    src={product.images && JSON.parse(product.images)[0] ? JSON.parse(product.images)[0] : "/placeholder.webp"}
                    alt={product.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 line-clamp-2 text-sm leading-snug">{product.name}</p>
                  <p className="text-xs text-slate-500 truncate">{product.brand?.name}{product.brand?.name && product.category?.name ? " · " : ""}{product.category?.name}</p>
                </div>
                <Link href={`/producto/${product.slug}`} target="_blank" className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition shrink-0" title="Ver en tienda">
                  <Eye className="w-5 h-5" />
                </Link>
              </div>
              <div className="flex items-end gap-2">
                <label className="flex-1 min-w-0 text-[11px] font-bold text-slate-400 uppercase">
                  Precio (S/)
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={editPrice[product.id] !== undefined ? editPrice[product.id] : product.price}
                    onChange={(e) => handlePriceChange(product.id, e.target.value)}
                    className="mt-1 w-full px-3 py-2.5 text-base text-slate-900 normal-case border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </label>
                <label className="w-24 text-[11px] font-bold text-slate-400 uppercase">
                  Stock
                  <input
                    type="number"
                    inputMode="numeric"
                    value={editStock[product.id] !== undefined ? editStock[product.id] : product.stock}
                    onChange={(e) => handleStockChange(product.id, e.target.value)}
                    className={`mt-1 w-full px-3 py-2.5 text-base text-slate-900 normal-case border rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none ${product.stock <= 5 ? 'border-orange-300 bg-orange-50' : 'border-slate-300'}`}
                  />
                </label>
                {isEdited(product.id) && (
                  <button
                    onClick={() => handleSave(product.id)}
                    disabled={loadingId === product.id}
                    className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shrink-0"
                    title="Guardar cambios"
                  >
                    <Save className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
