import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Package, Truck, CheckCircle2, Clock, ChevronLeft, XCircle, MessageCircle } from "lucide-react";
import PendingPaymentInstructions from "@/components/checkout/PendingPaymentInstructions";

export default async function PedidoPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: {
          product: true,
        }
      },
      user: true,
      history: { orderBy: { createdAt: 'desc' } },
    }
  });

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-black text-slate-900 mb-4">Pedido no encontrado</h1>
        <Link href="/" className="text-blue-600 font-bold hover:underline">Volver a la Tienda</Link>
      </div>
    );
  }

  // Si hay sesión iniciada pero el pedido no le pertenece (y no es ADMIN), lo bloqueamos por seguridad.
  // Pero si NO hay sesión (Invitado), le permitimos ver el pedido ya que tiene el link exacto (ID in-adivinable).
  if (session?.user && order.userId !== (session.user as { id?: string }).id && (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/mi-cuenta");
  }

  const steps = [
    { id: 'PENDING', label: 'Pendiente', icon: Clock, desc: 'Esperando validación de pago' },
    { id: 'PREPARING', label: 'En Preparación', icon: Package, desc: 'Pago confirmado y empacando' },
    { id: 'SHIPPED', label: 'En Camino', icon: Truck, desc: 'Entregado al courier' },
    { id: 'DELIVERED', label: 'Entregado', icon: CheckCircle2, desc: 'Recibido con éxito' }
  ];

  const statusLevels: Record<string, number> = { PENDING: 0, PAID: 1, PROCESSING: 1, PREPARING: 1, SHIPPED: 2, DELIVERED: 3 };
  const currentLevel = statusLevels[order.status] || 0;

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        <Link href={session?.user ? "/mi-cuenta" : "/"} className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold mb-8 transition">
          <ChevronLeft className="w-5 h-5" /> {session?.user ? "Volver a mis pedidos" : "Volver a la tienda"}
        </Link>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-100 pb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">Pedido #{order.id.slice(-6).toUpperCase()}</h1>
              <p className="text-slate-500 font-medium">Realizado el {new Date(order.createdAt).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 font-medium mb-1">Total Pagado</p>
              <p className="text-3xl font-black text-slate-900">S/ {order.total.toFixed(2)}</p>
            </div>
          </div>

          {/* INSTRUCCIONES DE PAGO COMPLETAS */}
          <PendingPaymentInstructions 
            paymentMethod={order.paymentMethod} 
            isPaid={order.status !== "PENDING"} 
            orderId={order.id} 
          />

          {order.status === "PENDING" && order.paymentMethod === "card" && (
            <div className="mb-8 bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-black text-orange-900 mb-1">Pago Incompleto</h3>
                <p className="text-orange-800 text-sm">Parece que hubo una interrupción al momento de pagar con tu tarjeta. Completa el pago para asegurar tu pedido.</p>
              </div>
              <a 
                href={`/pago/${order.id}`}
                className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-sm transition"
              >
                Intentar pagar de nuevo
              </a>
            </div>
          )}

          {/* DATOS DE ENVÍO */}
          {order.shippingAddress && (
            <div className="mb-8 p-4 bg-slate-50 rounded-2xl flex items-start gap-3">
              <Truck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-900 mb-1">Dirección de Envío</p>
                <p className="text-sm text-slate-600">{order.shippingAddress}</p>
                <div className="flex gap-4 mt-2">
                  {order.billingDocument && <span className="text-xs font-medium text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded">DNI/RUC: {order.billingDocument}</span>}
                  {order.shippingOption && <span className="text-xs font-medium text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded uppercase">Envío: {order.shippingOption}</span>}
                </div>
              </div>
            </div>
          )}

          {/* ESTADO DEL PEDIDO */}
          {order.status === "CANCELLED" ? (
            <div className="py-8">
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-black text-red-600 mb-2">Pedido Cancelado</h3>
                  <p className="text-red-800 font-medium">Este pedido ha sido cancelado y ya no será procesado. Si tienes alguna duda o crees que es un error, por favor comunícate con soporte.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 relative">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 hidden md:block"></div>
              <div 
                className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 hidden md:block transition-all duration-1000"
                style={{ width: `${(currentLevel / (steps.length - 1)) * 100}%` }}
              ></div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                {steps.map((step, idx) => {
                  const isActive = idx <= currentLevel;
                  const isCurrent = idx === currentLevel;
                  const Icon = step.icon;
                  
                  return (
                    <div key={step.id} className="flex md:flex-col items-center gap-4 md:gap-3 md:text-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-colors duration-500 ${isActive ? 'bg-blue-600 border-blue-100 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-300'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className={`font-bold ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</h4>
                        <p className={`text-xs ${isCurrent ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* DETALLE DE PRODUCTOS */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-900 text-lg mb-6">Detalle de Artículos</h3>
          <div className="flex flex-col gap-6">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 border-b border-slate-50 pb-6 last:border-0 last:pb-0">
                <div className="w-20 h-20 bg-slate-50 rounded-xl relative overflow-hidden shrink-0 border border-slate-100">
                  <Image src={item.productImage || '/placeholder.webp'} alt={item.productName} fill className="object-contain p-2" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 line-clamp-2">{item.productName}</h4>
                  <p className="text-sm text-slate-500 mt-1">Cant: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900">S/ {(item.price * item.quantity).toFixed(2)}</p>
                  <p className="text-xs text-slate-400 mt-1">S/ {item.price.toFixed(2)} c/u</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
