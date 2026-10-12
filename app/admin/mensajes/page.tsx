import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { AlertTriangle, Inbox, Mail, Phone } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mensajes y Reclamos | Admin Aura Tech", robots: { index: false, follow: false } };

const fmt = (d: Date) =>
  d.toLocaleString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default async function AdminMensajesPage(props: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin();
  const { tab } = await props.searchParams;
  const activeTab = tab === "mensajes" ? "mensajes" : "reclamos";

  const [claims, messages] = await Promise.all([
    prisma.claim.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
  ]);

  const tabClass = (active: boolean) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition whitespace-nowrap ${
      active ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
    }`;

  return (
    <div className="md:p-2">
      <div className="mb-5 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Mensajes &amp; Reclamos</h1>
        <p className="text-slate-500 mt-2">
          Los reclamos del Libro de Reclamaciones deben responderse en un plazo máximo de 15 días hábiles.
        </p>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto hide-scrollbar">
        <Link href="/admin/mensajes?tab=reclamos" className={tabClass(activeTab === "reclamos")}>
          <AlertTriangle className="w-4 h-4" /> Reclamos ({claims.length})
        </Link>
        <Link href="/admin/mensajes?tab=mensajes" className={tabClass(activeTab === "mensajes")}>
          <Inbox className="w-4 h-4" /> Contacto ({messages.length})
        </Link>
      </div>

      {activeTab === "reclamos" ? (
        claims.length === 0 ? (
          <Empty text="No hay reclamos registrados." />
        ) : (
          <div className="flex flex-col gap-3">
            {claims.map((c) => (
              <details key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm group">
                <summary className="p-4 md:p-5 cursor-pointer list-none flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 flex flex-wrap items-center gap-2">
                      {c.name}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          c.claimType === "Reclamo" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {c.claimType.toUpperCase()}
                      </span>
                    </p>
                    <p className="text-sm text-slate-500 truncate">
                      Pedido: {c.customerOrder || "—"} · {c.goodsType} · S/ {c.amount.toFixed(2)}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{fmt(c.createdAt)}</span>
                </summary>
                <div className="px-4 md:px-5 pb-5 pt-1 border-t border-slate-100 text-sm text-slate-700 flex flex-col gap-3">
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-slate-600 pt-3">
                    <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-blue-600"><Mail className="w-4 h-4" />{c.email}</a>
                    <a href={`tel:${c.phone}`} className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{c.phone}</a>
                    <span>{c.docType}: {c.docNumber}</span>
                  </div>
                  <p className="text-slate-500">Dirección: {c.address}</p>
                  <Field label="Descripción del bien" value={c.description} />
                  <Field label="Detalle del reclamo" value={c.claimDetail} />
                </div>
              </details>
            ))}
          </div>
        )
      ) : messages.length === 0 ? (
        <Empty text="No hay mensajes de contacto." />
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <details key={m.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <summary className="p-4 md:p-5 cursor-pointer list-none flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900">{m.name}</p>
                  <p className="text-sm text-slate-500 truncate">{m.message}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{fmt(m.createdAt)}</span>
              </summary>
              <div className="px-4 md:px-5 pb-5 pt-1 border-t border-slate-100 text-sm text-slate-700 flex flex-col gap-3">
                <div className="flex flex-wrap gap-x-6 gap-y-1 pt-3">
                  <a href={`mailto:${m.email}`} className="flex items-center gap-1.5 text-blue-600"><Mail className="w-4 h-4" />{m.email}</a>
                  {m.phone && <a href={`tel:${m.phone}`} className="flex items-center gap-1.5 text-slate-600"><Phone className="w-4 h-4" />{m.phone}</a>}
                </div>
                <Field label="Mensaje" value={m.message} />
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="whitespace-pre-wrap break-words">{value}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
      <Inbox className="w-12 h-12 mx-auto text-slate-300 mb-3" />
      {text}
    </div>
  );
}
