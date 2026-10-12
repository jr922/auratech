"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { submitContact } from "@/app/actions/forms";
import { MapPin, Phone, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const contactSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  email: z.string().email("Correo electrónico inválido"),
  phone: z.string().min(7, "Teléfono inválido").optional().or(z.literal('')),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function ContactoPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactForm) => {
    setStatus("loading");
    const res = await submitContact({ ...data, subject: "Contacto general" });
    if (res.success) {
      setStatus("idle");
      reset();
      toast.success('Mensaje enviado exitosamente', {
        description: 'Te contactaremos lo más pronto posible.'
      });
    } else {
      setStatus("error");
      toast.error('Error al enviar el mensaje');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-6 md:py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 bg-white p-5 sm:p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100">
          
          {/* Columna Izquierda (Info) */}
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-6 md:mb-8">Ponte en contacto</h1>
            
            <div className="flex flex-col gap-5 md:gap-6 mb-8 md:mb-12">
              <div className="flex items-start gap-4 text-slate-600">
                <MapPin className="w-6 h-6 text-blue-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Dirección</h4>
                  <p>Av. Garcilaso de la Vega 1358 - Plaza Tec, Lima</p>
                </div>
              </div>
              <div className="flex items-start gap-4 text-slate-600">
                <Phone className="w-6 h-6 text-blue-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Teléfono</h4>
                  <p>+51 900 273 072</p>
                </div>
              </div>
              <div className="flex items-start gap-4 text-slate-600">
                <Mail className="w-6 h-6 text-blue-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Correo Electrónico</h4>
                  <p>ventas@auratech.pe</p>
                </div>
              </div>
            </div>

            {/* Div Cuadrado Gris para el Mapa */}
            <div className="w-full h-[220px] md:h-[300px] bg-slate-200 rounded-2xl overflow-hidden border border-slate-300">
              <iframe
                title="Ubicación de Aura Tech"
                src="https://maps.google.com/maps?q=Av.+Garcilaso+de+la+Vega+1358,+Lima,+Peru&t=&z=15&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>

          {/* Columna Derecha (Formulario) */}
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-5 md:mb-6">Envíanos un mensaje</h2>
            
            {status === "error" && (
              <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl mb-6 font-bold text-sm">
                Hubo un error al enviar tu mensaje.
              </div>
            )}

            <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">Nombre Completo</label>
                <Input 
                  type="text" 
                  {...register("name")}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <span className="text-xs text-red-500 font-medium">{errors.name.message}</span>}
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">Correo Electrónico</label>
                <Input 
                  type="email" 
                  {...register("email")}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <span className="text-xs text-red-500 font-medium">{errors.email.message}</span>}
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">Teléfono</label>
                <Input 
                  type="tel" 
                  {...register("phone")}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && <span className="text-xs text-red-500 font-medium">{errors.phone.message}</span>}
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">Mensaje</label>
                <Textarea 
                  rows={5}
                  {...register("message")}
                  className={errors.message ? "border-red-500" : ""}
                />
                {errors.message && <span className="text-xs text-red-500 font-medium">{errors.message.message}</span>}
              </div>

              <Button 
                type="submit" 
                disabled={status === "loading"}
                className="w-full mt-2"
                size="lg"
              >
                {status === "loading" ? "Enviando..." : "Enviar Mensaje"}
              </Button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
