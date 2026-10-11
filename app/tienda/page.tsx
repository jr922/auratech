import ProductCard from "@/components/ui/ProductCard";
import { getPaginatedProducts } from "@/lib/api/products";
import { getCachedCategories } from "@/lib/api/categories";
import { getCachedBrands } from "@/lib/api/brands";
import CatalogSidebar from "@/components/shop/CatalogSidebar";
import CatalogSort from "@/components/shop/CatalogSort";
import Link from "next/link";
import PaginationControls from "@/components/shop/PaginationControls";
import RecentlyViewed from "@/components/shop/RecentlyViewed";

export const dynamic = 'force-dynamic';

export default async function TiendaPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  
  // Extraemos y validamos los parámetros de la URL
  const marca = typeof searchParams.marca === 'string' ? searchParams.marca : undefined;
  const categoria = typeof searchParams.categoria === 'string' ? searchParams.categoria : undefined;
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : undefined;
  const minPrice = typeof searchParams.minPrice === 'string' ? Number(searchParams.minPrice) : undefined;
  const maxPrice = typeof searchParams.maxPrice === 'string' ? Number(searchParams.maxPrice) : undefined;
  const q = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  const inStock = searchParams.inStock === 'true';
  const hasDiscount = searchParams.hasDiscount === 'true';
  const page = typeof searchParams.page === 'string' ? Number(searchParams.page) : 1;

  // 1. Ejecutar llamadas a la base de datos en paralelo
  const [paginatedData, categories, brands] = await Promise.all([
    getPaginatedProducts({ 
      categorySlug: categoria,
      brandSlug: marca,
      sort,
      minPrice,
      maxPrice,
      query: q,
      inStock,
      hasDiscount,
      page,
      pageSize: 12
    }),
    getCachedCategories(),
    getCachedBrands()
  ]);

  console.log(`[DIAGNOSTIC] Tienda requested with category: "${categoria}". Products found: ${paginatedData.products.length}`);


  const allProducts = paginatedData.products;

  // Encontrar el nombre real de la categoría seleccionada y su padre
  let currentCategoryName = "";
  let parentCategoryName = "";
  
  if (categoria) {
    for (const parent of categories) {
      if (parent.slug === categoria) {
        currentCategoryName = parent.name;
        break;
      }
      if (parent.children) {
        const child = parent.children.find((c: { slug: string; name: string }) => c.slug === categoria);
        if (child) {
          currentCategoryName = child.name;
          parentCategoryName = parent.name;
          break;
        }
      }
    }
  }

  // Encontrar nombre de la marca si hay solo 1 seleccionada
  let currentBrandName = "";
  if (marca && !marca.includes(",")) {
    const b = brands.find((b: { slug: string; name: string }) => b.slug === marca);
    if (b) currentBrandName = b.name;
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      
      {/* BREADCRUMBS DINÁMICAS */}
      <div className="bg-slate-50 border-b border-slate-100 py-4">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <p className="text-sm text-slate-500 font-medium">
            <Link href="/" className="hover:text-blue-600 transition">Inicio</Link> 
            <span className="mx-2">/</span> 
            <Link href="/tienda" className="hover:text-blue-600 transition">Tienda</Link>
            
            {parentCategoryName && (
              <>
                <span className="mx-2">/</span> 
                <span className="text-slate-500">{parentCategoryName}</span>
              </>
            )}
            
            {currentCategoryName && (
              <>
                <span className="mx-2">/</span> 
                <span className="text-slate-900 font-bold">{currentCategoryName}</span>
              </>
            )}

            {!currentCategoryName && currentBrandName && (
               <>
                 <span className="mx-2">/</span> 
                 <span className="text-slate-900 font-bold">{currentBrandName}</span>
               </>
            )}
          </p>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 w-full py-12 flex flex-col md:flex-row gap-8">
        
        {/* COLUMNA IZQUIERDA (25% - Sidebar Filtros Funcional) */}
        <CatalogSidebar categories={categories} brands={brands} />

        {/* COLUMNA DERECHA (75% - Grid Productos) */}
        <div className="flex-1 flex flex-col min-w-0">
          
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3 sm:mb-4 capitalize">
              {q ? `Resultados para "${q}"` : 
               currentCategoryName ? currentCategoryName : 
               currentBrandName ? `Productos ${currentBrandName}` : 
               `Todo el Catálogo`}
            </h1>
            
            {/* Componente Cliente para Ordenamiento */}
            <CatalogSort totalResults={paginatedData.totalCount} />
          </div>

          {allProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-8 sm:mb-12">
                {allProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <PaginationControls 
                currentPage={paginatedData.currentPage} 
                totalPages={paginatedData.totalPages} 
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <span className="text-4xl mb-4">🔍</span>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No se encontraron productos</h3>
              <p className="text-slate-500 text-center max-w-md">
                Intenta ajustar los filtros de precio o selecciona una categoría diferente para ver más resultados.
              </p>
              <Link href="/tienda" className="mt-6 bg-blue-600 text-white font-bold px-6 py-3 rounded-full hover:bg-blue-700 transition">
                Limpiar Filtros
              </Link>
            </div>
          )}

        </div>
      </div>
      
      {/* VISTOS RECIENTEMENTE (Global en tienda) */}
      <RecentlyViewed />
    </div>
  );
}
