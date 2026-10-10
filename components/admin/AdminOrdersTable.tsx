"use client";

import { useState } from "react";
import { updateOrderStatus, dispatchOrder } from "@/app/actions/admin-orders";
import { toast } from "sonner";
import { Search, Package, Eye, Truck, Check } from "lucide-react";
import Link from "next/link";

export default function AdminOrdersTable({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchOrderObj, setDispatchOrderObj] = useState<any | null>(null);
  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(search.toLowerCase()) || 
    (o.user?.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (o.user?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    // Si cambia a SHIPPED desde el dropdown, abrimos el modal en vez de cambiarlo directo
    if (newStatus === "SHIPPED") {
      const orderToDispatch = orders.find(o => o.id === orderId);
      setDispatchOrderObj(orderToDispatch);
      setShowDispatchModal(true);
      return;
    }

    setLoadingId(orderId);
    const res = await updateOrderStatus(orderId, newStatus);
    if (res.success) {
      toast.success(newStatus === "PAID" ? "Pago Confirmado y Correo Enviado" : "Estado actualizado");
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } else {
      toast.error(res.error || "Error al actualizar");
    }
    setLoadingId(null);
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchOrderObj || !courier || !trackingNumber) return;

    setLoadingId(dispatchOrderObj.id);
    setShowDispatchModal(false);
    
    const res = await dispatchOrder(dispatchOrderObj.id, courier, trackingNumber);
    if (res.success) {
      toast.success("Pedido enviado y correo disparado al cliente");
      setOrders(orders.map(o => o.id === dispatchOrderObj.id ? { ...o, status: "SHIPPED", courier, trackingNumber } : o));
    } else {
      toast.error(res.error || "Error al despachar");
    }
    setLoadingId(null);
    setCourier("");
    setTrackingNumber("");
    setDispatchOrderObj(null);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "PENDING": return "bg-orange-100 text-orange-700 border-orange-200";
      case "PAID": return "bg-blue-100 text-blue-700 border-blue-200";
      case "PROCESSING": return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "SHIPPED": return "bg-purple-100 text-purple-700 border-purple-200";
      case "DELIVERED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between gap-4 md:items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por ID, nombre o email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-semibold uppercase tracking-wider">
                <th className="p-4">Pedido ID</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Fecha</th>
                <th className="p-4">Total</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    No se encontraron pedidos.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 transition group">
                    <td className="p-4 font-mono text-sm font-bold text-slate-900">
                      #{order.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{order.user?.name || "Invitado"}</p>
                      <p className="text-sm text-slate-500">{order.user?.email}</p>
                    </td>
                    <td className="p-4 text-slate-600">
                      {new Date(order.createdAt).toLocaleDateString('es-PE')}
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      S/ {order.total.toFixed(2)}
                    </td>
                    <td className="p-4 flex flex-col gap-2">
                      <select 
                        disabled={loadingId === order.id}
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border appearance-none cursor-pointer outline-none ${getStatusColor(order.status)}`}
                      >
                        <option value="PENDING">PENDIENTE</option>
                        <option value="PAID">PAGADO (Confirmar)</option>
                        <option value="PROCESSING">PROCESANDO</option>
                        <option value="SHIPPED">ENVIAR (Ingresar Tracking)</option>
                        <option value="DELIVERED">ENTREGADO</option>
                        <option value="CANCELLED">CANCELADO</option>
                      </select>
                      {order.status === "SHIPPED" && order.trackingNumber && (
                        <span className="text-[10px] font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                          {order.courier}: {order.trackingNumber}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <Link href={`/pedido/${order.id}`} target="_blank" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg inline-flex items-center transition" title="Ver detalle">
                        <Eye className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDispatchModal && dispatchOrderObj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
              <Truck className="w-6 h-6 text-blue-600" /> Despachar Pedido
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Ingresa los datos de envío para la orden #{dispatchOrderObj.id.slice(-6).toUpperCase()}. Se enviará un correo automático al cliente.
            </p>

            <form onSubmit={handleDispatch} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Agencia (Courier)</label>
                <select 
                  required
                  value={courier}
                  onChange={e => setCourier(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Olva Courier">Olva Courier</option>
                  <option value="Shalom">Shalom</option>
                  <option value="Motorizado Propio">Motorizado Local</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Número de Seguimiento (Tracking)</label>
                <input 
                  type="text"
                  required
                  placeholder="Ej. 12345678"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowDispatchModal(false)}
                  className="flex-1 px-4 py-3 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <Check className="w-5 h-5" />
                  Enviar Correo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
