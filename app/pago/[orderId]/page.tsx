import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import NiubizPayment from "@/components/checkout/NiubizPayment";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pago seguro | Aura Tech", robots: { index: false, follow: false } };

export default async function PagoPage(props: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { orderId } = await props.params;
  const { error } = await props.searchParams;

  const session = await getServerSession(authOptions);
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, total: true, status: true, paymentMethod: true },
  });

  const sessionUserId = (session?.user as { id?: string })?.id as string | undefined;
  const notAllowed = order && sessionUserId && sessionUserId !== order.userId && (session?.user as { role?: string })?.role !== "ADMIN";

  if (!order || order.paymentMethod !== "card" || notAllowed) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-black text-slate-900 mb-4">Pedido no encontrado</h1>
        <Link href="/" className="text-blue-600 font-bold hover:underline">Volver a la tienda</Link>
      </div>
    );
  }

  // Ya pagado: no mostramos el formulario de nuevo
  if (order.status === "PAID") redirect(`/order-received?orderId=${order.id}&method=card`);

  const cannotPay = order.status !== "PENDING";

  return (
    <div className="bg-slate-50 min-h-[80vh] py-6 md:py-12 px-3 sm:px-4 flex justify-center">
      {cannotPay ? (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 max-w-xl w-full text-center">
          <h1 className="text-2xl font-black text-slate-900 mb-3">Este pedido ya no admite pago</h1>
          <p className="text-slate-500 mb-6">
            {order.status === "CANCELLED"
              ? "El tiempo de reserva venció y el pedido fue cancelado. Puedes volver a realizar tu compra."
              : "El pedido ya está siendo procesado."}
          </p>
          <Link href="/tienda" className="inline-block bg-slate-900 text-white font-bold px-8 py-4 rounded-xl hover:bg-blue-600 transition">
            Volver a la tienda
          </Link>
        </div>
      ) : (
        <NiubizPayment orderId={order.id} total={order.total} error={error} />
      )}
    </div>
  );
}
