"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, Plus, Pencil, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import {
  getMyAddresses,
  saveAddress,
  setDefaultAddress,
  deleteAddress,
} from "@/app/actions/address";
import { formatAddress } from "@/lib/address";
import { PERU_UBIGEO } from "@/lib/ubigeo";

type Address = Awaited<ReturnType<typeof getMyAddresses>>[number];

const EMPTY = { title: "", addressLine: "", state: "", province: "", city: "", phone: "", isDefault: false };

const fieldCls =
  "w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 bg-white disabled:bg-slate-50 disabled:text-slate-400";

export default function AddressBook() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setAddresses(await getMyAddresses());
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    load();
  }, [load]);

  const startNew = () => {
    setForm(EMPTY);
    setEditingId("new");
  };

  const startEdit = (a: Address) => {
    setForm({
      title: a.title,
      addressLine: a.addressLine,
      state: a.state,
      province: a.province || "",
      city: a.city,
      phone: a.phone || "",
      isDefault: a.isDefault,
    });
    setEditingId(a.id);
  };

  const provinces = PERU_UBIGEO.find((d) => d.department === form.state)?.provinces ?? [];
  const districts = provinces.find((p) => p.province === form.province)?.districts ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await saveAddress(form, editingId === "new" ? undefined : editingId ?? undefined);
    setSaving(false);
    if (res.success) {
      toast.success(editingId === "new" ? "Dirección agregada" : "Dirección actualizada");
      setEditingId(null);
      load();
    } else {
      toast.error(res.error || "No se pudo guardar");
    }
  };

  const handleDefault = async (id: string) => {
    const res = await setDefaultAddress(id);
    if (res.success) {
      toast.success("Dirección predeterminada actualizada");
      load();
    } else toast.error(res.error);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta dirección?")) return;
    const res = await deleteAddress(id);
    if (res.success) {
      toast.success("Dirección eliminada");
      load();
    } else toast.error(res.error);
  };

  if (loading) return <p className="text-slate-500">Cargando direcciones...</p>;

  return (
    <div>
      <p className="text-slate-600 mb-6">
        Tu dirección predeterminada se cargará automáticamente en la página de finalizar compra.
      </p>

      {editingId === null && (
        <>
          {addresses.length === 0 ? (
            <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-100 mb-6">
              <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Aún no tienes direcciones guardadas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {addresses.map((a) => (
                <div
                  key={a.id}
                  className={`rounded-xl border p-5 flex flex-col gap-2 ${
                    a.isDefault ? "border-blue-600 bg-blue-50/40" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900">{a.title}</p>
                    {a.isDefault && (
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-600 text-white px-2 py-1 rounded-full">
                        Predeterminada
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 text-sm">{formatAddress(a)}</p>
                  {a.phone && <p className="text-slate-500 text-sm">Tel: {a.phone}</p>}
                  <div className="flex gap-4 mt-2 text-sm font-bold">
                    <button onClick={() => startEdit(a)} className="text-blue-600 hover:underline flex items-center gap-1">
                      <Pencil className="w-4 h-4" /> Editar
                    </button>
                    {!a.isDefault && (
                      <button onClick={() => handleDefault(a.id)} className="text-slate-600 hover:underline flex items-center gap-1">
                        <Star className="w-4 h-4" /> Predeterminar
                      </button>
                    )}
                    <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:underline flex items-center gap-1 ml-auto">
                      <Trash2 className="w-4 h-4" /> Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={startNew}
            className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-600 transition"
          >
            <Plus className="w-5 h-5" /> Agregar dirección
          </button>
        </>
      )}

      {editingId !== null && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-2xl">
          <h3 className="text-lg font-black text-slate-900">
            {editingId === "new" ? "Nueva dirección" : "Editar dirección"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nombre (Casa, Oficina...)</label>
              <input className={fieldCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Teléfono de contacto</label>
              <input className={fieldCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Departamento</label>
              <select
                className={fieldCls}
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value, province: "", city: "" })}
                required
              >
                <option value="">Selecciona...</option>
                {PERU_UBIGEO.map((d) => (
                  <option key={d.department} value={d.department}>{d.department}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Provincia</label>
              <select
                className={fieldCls}
                value={form.province}
                disabled={!form.state}
                onChange={(e) => setForm({ ...form, province: e.target.value, city: "" })}
                required
              >
                <option value="">Selecciona...</option>
                {provinces.map((p) => (
                  <option key={p.province} value={p.province}>{p.province}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Distrito</label>
              <select className={fieldCls} value={form.city} disabled={!form.province} onChange={(e) => setForm({ ...form, city: e.target.value })} required>
                <option value="">Selecciona...</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Dirección exacta</label>
              <input className={fieldCls} placeholder="Calle, número, referencia..." value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} required />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            Usar como dirección predeterminada
          </label>
          <div className="flex gap-3">
            <button type="button" onClick={() => setEditingId(null)} className="px-6 py-3 rounded-xl border border-slate-200 font-bold hover:bg-slate-100 transition">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-blue-600 transition disabled:opacity-50">
              {saving ? "Guardando..." : "Guardar dirección"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
