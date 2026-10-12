import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { Users, Mail, Phone, ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clientes | Admin Aura Tech", robots: { index: false, follow: false } };

export default async function AdminClientesPage() {
  await requireAdmin();

  // Nunca seleccionamos `password`
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      document: true,
      role: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
  });

  return (
    <div className="md:p-2">
      <div className="mb-5 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Clientes</h1>
        <p className="text-slate-500 mt-2">
          {users.length} usuario{users.length === 1 ? "" : "s"} registrado{users.length === 1 ? "" : "s"}.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {users.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            Aún no hay clientes registrados.
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-semibold uppercase tracking-wider">
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Contacto</th>
                    <th className="p-4">Documento</th>
                    <th className="p-4 text-center">Pedidos</th>
                    <th className="p-4">Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="p-4">
                        <p className="font-bold text-slate-900 flex items-center gap-2">
                          {u.name || "Sin nombre"}
                          {u.role === "ADMIN" && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">ADMIN</span>
                          )}
                        </p>
                        <p className="text-sm text-slate-500">{u.email}</p>
                      </td>
                      <td className="p-4 text-slate-600">{u.phone || "—"}</td>
                      <td className="p-4 text-slate-600 font-mono text-sm">{u.document || "—"}</td>
                      <td className="p-4 text-center font-bold text-slate-900">{u._count.orders}</td>
                      <td className="p-4 text-slate-600">{u.createdAt.toLocaleDateString("es-PE")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Móvil */}
            <ul className="md:hidden divide-y divide-slate-100">
              {users.map((u) => (
                <li key={u.id} className="p-4 flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-bold text-slate-900 truncate flex items-center gap-2">
                      {u.name || "Sin nombre"}
                      {u.role === "ADMIN" && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">ADMIN</span>
                      )}
                    </p>
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-full shrink-0">
                      <ShoppingBag className="w-3 h-3" /> {u._count.orders}
                    </span>
                  </div>
                  <a href={`mailto:${u.email}`} className="text-sm text-blue-600 flex items-center gap-2 truncate">
                    <Mail className="w-4 h-4 shrink-0" /> <span className="truncate">{u.email}</span>
                  </a>
                  {u.phone && (
                    <a href={`tel:${u.phone}`} className="text-sm text-slate-600 flex items-center gap-2">
                      <Phone className="w-4 h-4 shrink-0" /> {u.phone}
                    </a>
                  )}
                  <p className="text-xs text-slate-400">
                    {u.document ? `Doc: ${u.document} · ` : ""}Registro: {u.createdAt.toLocaleDateString("es-PE")}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
