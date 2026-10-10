import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import OrderReceivedView from "@/components/checkout/OrderReceivedView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pedido recibido | Aura Tech", robots: { index: false, follow: false } };

/**
 * El estado mostrado es el REAL del pedido (base de datos), no un parámetro de la URL:
 * nadie puede "fabricar" una pantalla de pago confirmado.
 */
export default async function OrderReceivedPage(props: { searchParams: Promise<{ orderId?: string }> }) {
  const { orderId } = await props.searchParams;
  const session = await getServerSession(authOptions);

  const order = orderId
    ? await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, userId: true, status: true, paymentMethod: true, total: true, createdAt: true },
      })
    : null;

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-black text-slate-900 mb-4">Pedido no encontrado</h1>
        <Link href="/" className="text-blue-600 font-bold hover:underline">Volver a la tienda</Link>
      </div>
    );
  }

  // Con sesión, el pedido debe ser suyo. Un invitado accede con el id (no adivinable) que recibió al comprar.
  const sessionUserId = (session?.user as { id?: string })?.id as string | undefined;
  if (sessionUserId && sessionUserId !== order.userId && (session?.user as { role?: string })?.role !== "ADMIN") {
    redirect("/mi-cuenta");
  }

  return (
    <OrderReceivedView
      orderId={order.id}
      status={order.status}
      paymentMethod={order.paymentMethod}
      total={order.total}
      createdAt={order.createdAt.toISOString()}
    />
  );
}
