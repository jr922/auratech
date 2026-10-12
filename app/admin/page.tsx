import { prisma } from "@/lib/prisma";
import { Package, ShoppingCart, Users, DollarSign, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  // Obtener estadísticas reales de Prisma
  const [totalOrders, totalProducts, totalUsers, totalRevenueObj] = await Promise.all([
    prisma.order.count(),
    prisma.product.count(),
    prisma.user.count(),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { not: "CANCELLED" } }
    })
  ]);

  const totalRevenue = totalRevenueObj._sum.total || 0;

  // Obtener pedidos recientes
  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { user: true }
  });

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-6 md:mb-8 tracking-tight">Resumen General</h1>
      
      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8 md:mb-12">
        
        <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3 md:gap-4 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="font-bold text-slate-500 text-xs md:text-base leading-tight">Ingresos Totales</span>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-xl md:text-3xl font-black text-slate-900 truncate">S/ {totalRevenue.toFixed(2)}</h2>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3 md:gap-4 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="font-bold text-slate-500 text-xs md:text-base leading-tight">Pedidos Totales</span>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-xl md:text-3xl font-black text-slate-900 truncate">{totalOrders}</h2>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3 md:gap-4 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="font-bold text-slate-500 text-xs md:text-base leading-tight">Productos Activos</span>
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-xl md:text-3xl font-black text-slate-900 truncate">{totalProducts}</h2>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3 md:gap-4 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="font-bold text-slate-500 text-xs md:text-base leading-tight">Clientes Registrados</span>
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-xl md:text-3xl font-black text-slate-900 truncate">{totalUsers}</h2>
        </div>

      </div>

      {/* Tabla de Últimos Pedidos */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 md:px-8 py-4 md:py-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Pedidos Recientes</h2>
          <Link href="/admin/pedidos" className="text-sm font-bold text-blue-600 hover:underline flex items-center">
            Ver todos <ArrowUpRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                <th className="font-semibold py-3 md:py-4 px-4 md:px-8">ID Pedido</th>
                <th className="font-semibold py-3 md:py-4 px-4 md:px-8">Cliente</th>
                <th className="font-semibold py-3 md:py-4 px-4 md:px-8">Fecha</th>
                <th className="font-semibold py-3 md:py-4 px-4 md:px-8">Total</th>
                <th className="font-semibold py-3 md:py-4 px-4 md:px-8">Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No hay pedidos todavía.
                  </td>
                </tr>
              ) : (
                recentOrders.map(order => (
                  <tr key={order.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                    <td className="py-3 md:py-4 px-4 md:px-8 font-bold text-slate-900">#{order.id.slice(-6).toUpperCase()}</td>
                    <td className="py-3 md:py-4 px-4 md:px-8 text-slate-600">{order.user?.name || order.customerName || order.user?.email || order.customerEmail}</td>
                    <td className="py-3 md:py-4 px-4 md:px-8 text-slate-600">{new Date(order.createdAt).toLocaleDateString('es-PE')}</td>
                    <td className="py-3 md:py-4 px-4 md:px-8 font-black text-blue-600">S/ {order.total.toFixed(2)}</td>
                    <td className="py-3 md:py-4 px-4 md:px-8">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        order.status === 'PENDING' ? 'bg-orange-100 text-orange-600' :
                        order.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' :
                        order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
