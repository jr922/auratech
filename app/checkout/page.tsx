"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCartStore } from "@/store/cartStore";
import { ShieldCheck, Tag, ShoppingCart } from "lucide-react";
import { VisaLogo, MastercardLogo, AmexLogo, DinersLogo, YapeLogo, PlinLogo, NiubizLogo, BimLogo, BcpLogo, InterbankLogo, BbvaLogo } from "@/components/checkout/PaymentLogos";

import { processCheckout } from "@/app/actions/checkout";
import { validateCoupon } from "@/app/actions/coupons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { PERU_UBIGEO } from "@/lib/ubigeo";
import { getMyAddresses } from "@/app/actions/address";
import { formatAddress } from "@/lib/address";

type SavedAddress = Awaited<ReturnType<typeof getMyAddresses>>[number];

export const checkoutSchema = z.object({
  firstName: z.string().min(2, "El nombre es muy corto"),
  lastName: z.string().min(2, "El apellido es muy corto"),
  receiptType: z.enum(["boleta", "factura"]),
  businessName: z.string().optional(),
  document: z.string().min(8, "Documento inválido").max(11, "Máximo 11 dígitos"),
  phone: z.string().min(9, "Teléfono inválido"),
  email: z.string().email("Correo inválido"),
  deliveryType: z.enum(["domicilio", "tienda"]),
  department: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(["yape", "plin", "card", "transfer"]),
  acceptTerms: z.boolean().refine(v => v === true, {
    message: "Debes aceptar los términos y condiciones",
  }),
}).superRefine((data, ctx) => {
  if (data.receiptType === "factura") {
    if (!data.businessName || data.businessName.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["businessName"],
        message: "La Razón Social es requerida para factura",
      });
    }
    if (data.document.length !== 11) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["document"],
        message: "El RUC debe tener 11 dígitos",
      });
    } else if (!/^(10|15|17|20)/.test(data.document)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["document"],
        message: "RUC inválido (debe iniciar con 10, 15, 17 o 20)",
      });
    }
  }
  if (data.deliveryType === "domicilio") {
    if (!data.department || data.department.length < 3) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["department"], message: "Requerido" });
    if (!data.province || data.province.length < 3) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["province"], message: "Requerido" });
    if (!data.district || data.district.length < 3) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["district"], message: "Requerido" });
    if (!data.address || data.address.length < 5) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["address"], message: "Dirección muy corta" });
  }
});

export type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { items, clearCart, shippingOption, setShippingOption, appliedCoupon, applyCoupon, removeCoupon } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { data: session, status } = useSession();
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  // Estados y Lógica del Cupón
  const [couponInput, setCouponInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    const res = await validateCoupon(couponInput.trim(), subtotal);
    if (res.success && res.coupon) {
      applyCoupon(res.coupon);
      setCouponInput("");
      toast.success("Cupón aplicado correctamente", { description: `Se aplicó un descuento de ${res.coupon.discountType === 'PERCENTAGE' ? res.coupon.discountValue + '%' : 'S/' + res.coupon.discountValue}` });
    } else {
      toast.error("Cupón inválido", { description: res.error });
    }
    setIsApplyingCoupon(false);
  };

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      receiptType: 'boleta',
      deliveryType: 'domicilio',
      paymentMethod: 'yape',
      acceptTerms: false,
    }
  });

  const applySavedAddress = useCallback((id: string, list?: SavedAddress[]) => {
    setSelectedAddressId(id);
    const addr = (list ?? savedAddresses).find((a) => a.id === id);
    if (!addr) return;
    setValue("department", addr.state, { shouldValidate: true });
    if (addr.phone) setValue("phone", addr.phone);
    setValue("address", addr.addressLine, { shouldValidate: true });
    // provincia y distrito dependen del departamento: se aplican tras el re-render
    setTimeout(() => {
      setValue("province", addr.province || "", { shouldValidate: true });
      setValue("district", addr.city, { shouldValidate: true });
    }, 50);
  }, [savedAddresses, setValue]);

  useEffect(() => {
    setIsMounted(true);
    if (status === "authenticated" && session?.user && (session.user as { id: string }).id) {
      import("@/app/actions/user").then(({ getUserProfile }) => {
        getUserProfile((session.user as { id: string }).id).then((profile) => {
          if (profile) {
            if (profile.name) {
              const parts = profile.name.split(" ");
              setValue("firstName", parts[0] || "");
              setValue("lastName", parts.slice(1).join(" ") || "");
            }
            if (profile.email) setValue("email", profile.email);
            if (profile.document) setValue("document", profile.document);
            if (profile.phone) setValue("phone", profile.phone);
          }
        });
      });
      getMyAddresses().then((list) => {
        setSavedAddresses(list);
        const def = list.find((a) => a.isDefault) ?? list[0];
        if (def) applySavedAddress(def.id, list);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, setValue]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedDepartment = watch("department");
  const receiptType = watch("receiptType");
  const selectedProvince = watch("province");
  const deliveryType = watch("deliveryType");

  useEffect(() => {
    if (deliveryType === "tienda") {
      setShippingOption("tienda");
      return;
    }
    if (!selectedDepartment) return;
    
    if (selectedDepartment === "Lima" || selectedDepartment === "Callao") {
      setShippingOption("lima");
    } else {
      setShippingOption("provincia");
    }
  }, [selectedDepartment, deliveryType, setShippingOption]);

  const paymentMethod = watch("paymentMethod");


  let dynamicDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === "PERCENTAGE") {
      dynamicDiscount = subtotal * (appliedCoupon.discountValue / 100);
    } else {
      dynamicDiscount = appliedCoupon.discountValue > subtotal ? subtotal : appliedCoupon.discountValue;
    }
  }

  const shipping = shippingOption === "lima" ? 10.00 : shippingOption === "provincia" ? 25.00 : 0.00;
  const finalTotal = subtotal - dynamicDiscount + shipping;

  const executeCheckout = async (data: CheckoutForm) => {
    setIsProcessing(true);
    let finalAddress = data.deliveryType === 'tienda' ? 'Recojo en tienda' : `${data.address}, ${data.district}, ${data.province}, ${data.department}`;
    let finalAddressDetail = undefined;

    if (data.deliveryType === 'domicilio') {
      if (data.reference) finalAddress += ` (Ref: ${data.reference})`;
      if (data.notes) finalAddress += ` - Notas: ${data.notes}`;
      finalAddressDetail = {
        addressLine: data.address || '',
        city: data.district || '',
        province: data.province || '',
        state: data.department || '',
      };
    }

    const res = await processCheckout({
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      document: data.receiptType === "factura" ? `RUC: ${data.document} - ${data.businessName}` : `DNI/CE: ${data.document}`,
      address: finalAddress,
      addressDetail: finalAddressDetail,
      phone: data.phone,
      paymentMethod: data.paymentMethod,
      items: items.map(i => ({ 
        id: i.id, 
        productId: i.productId || i.id, 
        variantId: i.variantId, 
        quantity: i.quantity
      })),
      shippingOption,
      couponCode: appliedCoupon?.code,
      expectedTotal: finalTotal
    });
    
    if (res.success) {
      clearCart();
      // Tarjeta: la orden ya reservó el stock; se paga en la pasarela segura (Niubiz).
      // Yape/Plin/transferencia: pantalla de instrucciones de pago.
      window.location.href = res.requiresPayment
        ? `/pago/${res.orderId}`
        : `/order-received?orderId=${res.orderId}&method=${data.paymentMethod}`;
    } else {
      toast.error('Error procesando el pedido', {
        description: res.error || "Intenta nuevamente."
      });
      setIsProcessing(false);
    }
  };

  const onSubmit = async (data: CheckoutForm) => {
    executeCheckout(data);
  };

  if (!isMounted) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500 text-lg">Cargando checkout...</div>;

  if (items.length === 0) {
    return (
      <div className="min-h-[80vh] bg-slate-50 flex flex-col items-center justify-center p-4">
        <ShoppingCart className="w-24 h-24 text-slate-300 mb-6" />
        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Tu carrito está vacío</h2>
        <p className="text-slate-600 mb-8 max-w-md text-center">Para proceder al pago necesitas añadir al menos un producto a tu carrito.</p>
        <a href="/tienda" className="bg-blue-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200">Volver a la tienda</a>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* COLUMNA IZQUIERDA: FORMULARIOS */}
        <div className="w-full lg:w-3/5">
          <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            
            {/* FACTURACIÓN Y ENVÍO */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4">
                Tus Datos y Dirección de Envío
              </h2>

              <div className="mb-6">
                <Label className="mb-3 block font-bold text-slate-800">Tipo de Comprobante</Label>
                <RadioGroup 
                  defaultValue="boleta" 
                  className="flex gap-4"
                  onValueChange={(v) => setValue("receiptType", v as "boleta" | "factura")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="boleta" id="boleta" />
                    <Label htmlFor="boleta" className="cursor-pointer">Boleta</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="factura" id="factura" />
                    <Label htmlFor="factura" className="cursor-pointer">Factura</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Nombres</Label>
                  <Input {...register("firstName")} className={errors.firstName ? "border-red-500" : ""} />
                  {errors.firstName && <span className="text-xs text-red-500">{errors.firstName.message}</span>}
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Apellidos</Label>
                  <Input {...register("lastName")} className={errors.lastName ? "border-red-500" : ""} />
                  {errors.lastName && <span className="text-xs text-red-500">{errors.lastName.message}</span>}
                </div>
                {receiptType === "factura" && (
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label>Razón Social</Label>
                    <Input {...register("businessName")} className={errors.businessName ? "border-red-500" : ""} placeholder="Nombre de la empresa" />
                    {errors.businessName && <span className="text-xs text-red-500">{errors.businessName.message}</span>}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Label>{receiptType === "factura" ? "RUC" : "DNI / CE"}</Label>
                  <Input {...register("document")} className={errors.document ? "border-red-500" : ""} placeholder={receiptType === "factura" ? "11 dígitos" : "8 o 9 dígitos"} />
                  {errors.document && <span className="text-xs text-red-500">{errors.document.message}</span>}
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Teléfono</Label>
                  <Input {...register("phone")} className={errors.phone ? "border-red-500" : ""} />
                  {errors.phone && <span className="text-xs text-red-500">{errors.phone.message}</span>}
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label>Correo Electrónico</Label>
                  <Input type="email" {...register("email")} className={errors.email ? "border-red-500" : ""} />
                  {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
                </div>
                
                <div className="flex flex-col gap-2 mt-4 md:col-span-2">
                  <h3 className="font-bold text-slate-800 text-sm">Ubicación de entrega</h3>
                </div>

                <div className="md:col-span-2 mb-2">
                  <Label className="mb-3 block font-bold text-slate-800">Tipo de Entrega</Label>
                  <RadioGroup 
                    defaultValue="domicilio" 
                    className="flex gap-4"
                    onValueChange={(v) => setValue("deliveryType", v as "domicilio" | "tienda")}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="domicilio" id="domicilio" />
                      <Label htmlFor="domicilio" className="cursor-pointer">Envío a Domicilio</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="tienda" id="tienda" />
                      <Label htmlFor="tienda" className="cursor-pointer">Recojo en Tienda</Label>
                    </div>
                  </RadioGroup>
                </div>

                {deliveryType === "domicilio" && (
                  <>
                    {savedAddresses.length > 0 && (
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <Label>Usar una dirección guardada</Label>
                        <select
                          value={selectedAddressId}
                          onChange={(e) => applySavedAddress(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="">Ingresar una dirección nueva</option>
                          {savedAddresses.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.title}{a.isDefault ? " (predeterminada)" : ""} — {formatAddress(a)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <Label>Departamento</Label>
                      <select 
                        {...register("department", {
                          onChange: () => {
                            setValue("province", "", { shouldValidate: true });
                            setValue("district", "", { shouldValidate: true });
                          }
                        })} 
                        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.department ? "border-red-500" : "border-slate-200"}`}
                      >
                        <option value="">Selecciona...</option>
                        {PERU_UBIGEO.map(d => (
                          <option key={d.department} value={d.department}>{d.department}</option>
                        ))}
                      </select>
                      {errors.department && <span className="text-xs text-red-500">{errors.department.message}</span>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Provincia</Label>
                      <select 
                        {...register("province", {
                          onChange: () => {
                            setValue("district", "", { shouldValidate: true });
                          }
                        })} 
                        disabled={!selectedDepartment}
                        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.province ? "border-red-500" : "border-slate-200"}`}
                      >
                        <option value="">Selecciona...</option>
                        {selectedDepartment && PERU_UBIGEO.find(d => d.department === selectedDepartment)?.provinces.map(p => (
                          <option key={p.province} value={p.province}>{p.province}</option>
                        ))}
                      </select>
                      {errors.province && <span className="text-xs text-red-500">{errors.province.message}</span>}
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <Label>Distrito</Label>
                      <select 
                        {...register("district")} 
                        disabled={!selectedProvince}
                        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.district ? "border-red-500" : "border-slate-200"}`}
                      >
                        <option value="">Selecciona...</option>
                        {selectedDepartment && selectedProvince && PERU_UBIGEO.find(d => d.department === selectedDepartment)?.provinces.find(p => p.province === selectedProvince)?.districts.map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                      {errors.district && <span className="text-xs text-red-500">{errors.district.message}</span>}
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <Label>Dirección exacta</Label>
                      <Input {...register("address")} className={errors.address ? "border-red-500" : ""} />
                      {errors.address && <span className="text-xs text-red-500">{errors.address.message}</span>}
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <Label>Referencia (Opcional)</Label>
                      <Input {...register("reference")} placeholder="Ej. Frente al parque, al lado de la tienda" className={errors.reference ? "border-red-500" : ""} />
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <Label>Notas del Pedido (Opcional)</Label>
                      <Input {...register("notes")} placeholder="Ej. Tocar el timbre, dejar en portería" className={errors.notes ? "border-red-500" : ""} />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* MÉTODO DE PAGO */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4">
                Método de Pago
              </h2>
              
              <RadioGroup 
                value={paymentMethod} 
                onValueChange={(val) => setValue("paymentMethod", val as "yape" | "plin" | "card" | "transfer")}
                className="flex flex-col gap-4"
              >
                <div className={`flex items-center space-x-2 border-2 p-4 rounded-xl cursor-pointer ${paymentMethod === 'yape' ? 'border-purple-600 bg-purple-50' : 'border-slate-100'}`}>
                  <RadioGroupItem value="yape" id="yape" />
                  <Label htmlFor="yape" className="font-bold cursor-pointer text-slate-800 flex items-center justify-between w-full">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span>Yape / Plin (Transferencia Directa)</span>
                      <YapeLogo />
                      <PlinLogo />
                    </div>
                    <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded font-bold">QR</span>
                  </Label>
                </div>
                <div className={`flex items-center space-x-2 border-2 p-4 rounded-xl cursor-pointer ${paymentMethod === 'card' ? 'border-blue-600 bg-blue-50' : 'border-slate-100'}`}>
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="font-bold cursor-pointer text-slate-800 flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <span>Tarjeta de Crédito / Débito (Automático)</span>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <VisaLogo />
                        <MastercardLogo />
                        <AmexLogo />
                        <DinersLogo />
                        <BimLogo />
                      </div>
                    </div>
                    <NiubizLogo />
                  </Label>
                </div>
                <div className={`flex items-center space-x-2 border-2 p-4 rounded-xl cursor-pointer ${paymentMethod === 'transfer' ? 'border-slate-600 bg-slate-100' : 'border-slate-100'}`}>
                  <RadioGroupItem value="transfer" id="transfer" />
                  <Label htmlFor="transfer" className="font-bold cursor-pointer text-slate-800 flex items-center justify-between w-full">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span>Transferencia Bancaria</span>
                      <div className="flex gap-1.5 opacity-90">
                        <BcpLogo />
                        <InterbankLogo />
                        <BbvaLogo />
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </form>
        </div>

        {/* COLUMNA DERECHA: RESUMEN DEL PEDIDO */}
        <div className="w-full lg:w-2/5">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 sticky top-28">
            <h2 className="text-xl font-black text-slate-900 mb-6">Tu Pedido</h2>
            
            <div className="flex flex-col gap-4 mb-6 max-h-60 overflow-y-auto pr-2">
              {items.map(item => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0 relative border border-slate-100">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} width={64} height={64} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-[8px] font-bold text-slate-400">IMG</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                    <span className="text-xs text-slate-500 mb-1">Cant: {item.quantity}</span>
                    <span className="text-sm font-black text-blue-600">S/ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Módulo de Cupones */}
            <div className="py-4 border-t border-slate-100 mt-2">
              <Label className="text-sm font-bold text-slate-700 mb-2 block">¿Tienes un cupón de descuento?</Label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-emerald-600" />
                    <div>
                      <span className="block text-sm font-black text-emerald-700">{appliedCoupon.code}</span>
                      <span className="block text-xs font-medium text-emerald-600">
                        Cupón aplicado exitosamente
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeCoupon()}
                    className="text-emerald-700 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 p-1.5 rounded-lg transition"
                    title="Remover cupón"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input 
                    placeholder="Ej. AURA20" 
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="uppercase font-mono tracking-wider focus:border-blue-500"
                    onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); } }}
                  />
                  <Button 
                    type="button" 
                    onClick={handleApplyCoupon}
                    disabled={!couponInput.trim() || isApplyingCoupon}
                    className="bg-slate-900 hover:bg-blue-600 text-white font-bold transition-colors"
                  >
                    {isApplyingCoupon ? "Validando..." : "Aplicar"}
                  </Button>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-6 flex flex-col gap-3">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Subtotal</span>
                <span>S/ {subtotal.toFixed(2)}</span>
              </div>
              
              {dynamicDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span className="flex items-center gap-1"><Tag className="w-4 h-4"/> Descuento ({appliedCoupon?.code})</span>
                  <span>- S/ {dynamicDiscount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Envío</span>
                <span>S/ {shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-black text-slate-900 mt-2 pt-4 border-t border-slate-100">
                <span>Total</span>
                <span>S/ {finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-2">
              <label className="flex items-start gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  {...register("acceptTerms")}
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-600 group-hover:text-slate-800 transition">
                  He leído y acepto los <a href="/terminos" target="_blank" className="text-blue-600 font-bold hover:underline">Términos y Condiciones</a> y la Política de Privacidad de Aura Tech.
                </span>
              </label>
              {errors.acceptTerms && <span className="text-xs text-red-500 font-bold">{errors.acceptTerms.message}</span>}
            </div>
            
            <button 
              type="submit"
              form="checkout-form"
              disabled={isProcessing || items.length === 0}
              className={`w-full text-white font-black text-lg py-4 rounded-xl shadow-lg transition-all uppercase tracking-wide mt-4 ${
                isProcessing || items.length === 0 ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-blue-600 shadow-slate-200 hover:shadow-blue-200'
              }`}
            >
              {isProcessing ? 'Procesando...' : 'Realizar el Pedido'}
            </button>
            
            <div className="flex justify-center mt-4 text-emerald-600 font-bold">
              <ShieldCheck className="w-5 h-5 mr-1" />
              <span className="text-xs">Pago 100% Seguro y Encriptado</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
