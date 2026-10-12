"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { submitClaim } from "@/app/actions/forms";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const reclamacionSchema = z.object({
  name: z.string().min(2, "Ingresa un nombre válido"),
  documentType: z.string(),
  documentNumber: z.string().min(8, "Documento inválido"),
  phone: z.string().min(7, "Teléfono inválido"),
  email: z.string().email("Correo electrónico inválido"),
  address: z.string().min(5, "Dirección muy corta"),
  productOrService: z.enum(["Producto", "Servicio"]),
  amount: z.string().min(1, "El monto es obligatorio"),
  details: z.string().min(10, "Por favor, detalla más tu reclamo/queja"),
  request: z.string()
});

type ReclamacionForm = z.infer<typeof reclamacionSchema>;

export default function ReclamacionesPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ReclamacionForm>({
    resolver: zodResolver(reclamacionSchema),
    defaultValues: {
      documentType: "DNI",
      productOrService: "Producto",
      request: "Reclamo"
    }
  });

  const onSubmit = async (data: ReclamacionForm) => {
    setStatus("loading");
    
    const dataToSend = {
      name: data.name,
      docType: data.documentType,
      docNumber: data.documentNumber,
      address: data.address,
      phone: data.phone,
      email: data.email,
      claimType: data.request,
      goodsType: data.productOrService,
      amount: Number(data.amount) || 0,
      description: "", 
      claimDetail: data.details,
      customerOrder: "No especificado" 
    };

    const res = await submitClaim(dataToSend);
    if (res.success) {
      setStatus("idle");
      reset();
      toast.success('Reclamo generado exitosamente', {
        description: `Código de seguimiento: ${res.claimId?.slice(-8).toUpperCase()}`
      });
    } else {
      setStatus("error");
      toast.error('Error al enviar el reclamo');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 md:py-16 px-4">
      <div className="max-w-3xl mx-auto">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3 md:mb-4">Libro de Reclamaciones</h1>
          <p className="text-slate-600">
            Conforme a lo establecido en el Código de Protección y Defensa del Consumidor, 
            esta institución cuenta con un Libro de Reclamaciones a tu disposición.
          </p>
        </div>

        {status === "error" && (
          <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl mb-6 font-bold text-center">
            Hubo un error al registrar el reclamo.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="rounded-3xl border-slate-200 overflow-hidden shadow-sm">
            <CardContent className="p-8 md:p-12 flex flex-col gap-8">
              
              {/* SECCIÓN 1 */}
              <div>
                <h3 className="font-bold text-lg text-slate-900 mb-6">1. Identificación del consumidor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label>Nombre Completo</Label>
                    <Input {...register("name")} className={errors.name ? "border-red-500" : ""} />
                    {errors.name && <span className="text-xs text-red-500 font-medium">{errors.name.message}</span>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>DNI / CE</Label>
                    <Input {...register("documentNumber")} className={errors.documentNumber ? "border-red-500" : ""} />
                    {errors.documentNumber && <span className="text-xs text-red-500 font-medium">{errors.documentNumber.message}</span>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Teléfono</Label>
                    <Input type="tel" {...register("phone")} className={errors.phone ? "border-red-500" : ""} />
                    {errors.phone && <span className="text-xs text-red-500 font-medium">{errors.phone.message}</span>}
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label>Correo Electrónico</Label>
                    <Input type="email" {...register("email")} className={errors.email ? "border-red-500" : ""} />
                    {errors.email && <span className="text-xs text-red-500 font-medium">{errors.email.message}</span>}
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label>Dirección</Label>
                    <Input {...register("address")} className={errors.address ? "border-red-500" : ""} />
                    {errors.address && <span className="text-xs text-red-500 font-medium">{errors.address.message}</span>}
                  </div>
                </div>
              </div>

              <Separator />

              {/* SECCIÓN 2 */}
              <div>
                <h3 className="font-bold text-lg text-slate-900 mb-6">2. Identificación del bien contratado</h3>
                <div className="flex flex-col gap-6">
                  <Controller
                    name="productOrService"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup 
                        value={field.value} 
                        onValueChange={field.onChange}
                        className="flex gap-8"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Producto" id="r1" />
                          <Label htmlFor="r1">Producto</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Servicio" id="r2" />
                          <Label htmlFor="r2">Servicio</Label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                  
                  <div className="flex flex-col gap-2">
                    <Label>Monto reclamado (S/)</Label>
                    <Input type="number" step="0.01" {...register("amount")} className={errors.amount ? "border-red-500" : ""} />
                    {errors.amount && <span className="text-xs text-red-500 font-medium">{errors.amount.message}</span>}
                  </div>
                </div>
              </div>

              <Separator />

              {/* SECCIÓN 3 */}
              <div>
                <h3 className="font-bold text-lg text-slate-900 mb-6">3. Detalle de la queja o reclamo</h3>
                <div className="flex flex-col gap-2">
                  <Label>Describe tu queja o reclamo</Label>
                  <Textarea rows={6} {...register("details")} className={errors.details ? "border-red-500" : ""} />
                  {errors.details && <span className="text-xs text-red-500 font-medium">{errors.details.message}</span>}
                </div>
              </div>

              <Button type="submit" size="lg" disabled={status === "loading"} className="w-full mt-4">
                {status === "loading" ? "Procesando..." : "Enviar Reclamo"}
              </Button>

            </CardContent>
          </Card>
        </form>

      </div>
    </div>
  );
}
