import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingCart, Users, LogOut, MessageSquare } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // Protección de ruta estricta para administradores
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/"); // Redirigir al home si no es admin
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full z-10">
        <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <Link href="/admin" className="flex items-center gap-3 text-xl font-bold text-white tracking-tight">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black">
              AT
            </div>
            <span>AURA<span className="text-blue-500">ADMIN</span></span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition">
            <LayoutDashboard className="w-5 h-5 text-blue-500" />
            <span className="font-semibold">Dashboard</span>
          </Link>
          <Link href="/admin/pedidos" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition">
            <ShoppingCart className="w-5 h-5 text-emerald-500" />
            <span className="font-semibold">Pedidos</span>
          </Link>
          <Link href="/admin/productos" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition">
            <Package className="w-5 h-5 text-orange-500" />
            <span className="font-semibold">Productos</span>
          </Link>
          <Link href="/admin/clientes" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition">
            <Users className="w-5 h-5 text-purple-500" />
            <span className="font-semibold">Clientes</span>
          </Link>
          <Link href="/admin/mensajes" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition">
            <MessageSquare className="w-5 h-5 text-pink-500" />
            <span className="font-semibold">Mensajes & Reclamos</span>
          </Link>
        </div>

        <div className="p-4 border-t border-slate-800">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <LogOut className="w-5 h-5" />
            <span className="font-semibold">Volver a la Tienda</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
