import { getAdminOrders } from "@/app/actions/admin-orders";
import AdminOrdersTable from "@/components/admin/AdminOrdersTable";

export const dynamic = "force-dynamic";

export default async function AdminPedidosPage() {
  const orders = await getAdminOrders();

  return (
    <div className="md:p-2">
      <div className="mb-5 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Gestión de Pedidos</h1>
        <p className="text-slate-500 mt-2">Administra y cambia el estado de todas las órdenes de la tienda.</p>
      </div>

      <AdminOrdersTable initialOrders={orders} />
    </div>
  );
}
