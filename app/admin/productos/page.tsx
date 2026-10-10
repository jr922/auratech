import { getAdminProducts } from "@/app/actions/admin-products";
import AdminProductsTable from "@/components/admin/AdminProductsTable";

export const dynamic = "force-dynamic";

export default async function AdminProductosPage() {
  const products = await getAdminProducts();

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestión de Productos</h1>
        <p className="text-slate-500 mt-2">Administra el inventario, ajusta stock rápidamente y cambia precios.</p>
      </div>

      <AdminProductsTable initialProducts={products} />
    </div>
  );
}
