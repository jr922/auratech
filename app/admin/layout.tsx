import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingCart, Users, LogOut, MessageSquare } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", shortLabel: "Dashboard", icon: LayoutDashboard, color: "text-blue-500" },
  { href: "/admin/pedidos", label: "Pedidos", shortLabel: "Pedidos", icon: ShoppingCart, color: "text-emerald-500" },
  { href: "/admin/productos", label: "Productos", shortLabel: "Productos", icon: Package, color: "text-orange-500" },
  { href: "/admin/clientes", label: "Clientes", shortLabel: "Clientes", icon: Users, color: "text-purple-500" },
  { href: "/admin/mensajes", label: "Mensajes & Reclamos", shortLabel: "Mensajes", icon: MessageSquare, color: "text-pink-500" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // Protección de ruta estricta para administradores
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/"); // Redirigir al home si no es admin
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Navegación móvil / tablet */}
      <nav className="lg:hidden bg-slate-900 text-slate-300 sticky top-0 z-20 shadow-md">
        <div className="flex items-center justify-between px-4 h-14 border-b border-slate-800 bg-slate-950">
          <Link href="/admin" className="flex items-center gap-2 text-lg font-bold text-white tracking-tight">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center font-black text-sm">
              AT
            </div>
            <span>AURA<span className="text-blue-500">ADMIN</span></span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition">
            <LogOut className="w-4 h-4" />
            Tienda
          </Link>
        </div>
        <div className="flex gap-2 overflow-x-auto px-3 py-2.5 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV_ITEMS.map(({ href, shortLabel, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-800 hover:bg-slate-700 hover:text-white transition whitespace-nowrap shrink-0 text-sm font-semibold"
            >
              <Icon className={`w-4 h-4 ${color}`} />
              {shortLabel}
            </Link>
          ))}
        </div>
      </nav>

      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-64 bg-slate-900 text-slate-300 flex-col fixed h-full z-10">
        <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <Link href="/admin" className="flex items-center gap-3 text-xl font-bold text-white tracking-tight">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black">
              AT
            </div>
            <span>AURA<span className="text-blue-500">ADMIN</span></span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon, color }) => (
            <Link key={href} href={href} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition">
              <Icon className={`w-5 h-5 ${color}`} />
              <span className="font-semibold">{label}</span>
            </Link>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <LogOut className="w-5 h-5" />
            <span className="font-semibold">Volver a la Tienda</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 lg:ml-64 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
