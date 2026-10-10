"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { subscribeNewsletter } from "@/app/actions/forms";
import { toast } from "sonner";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    
    const res = await subscribeNewsletter(email);
    if (res.success) {
      setStatus("idle");
      // @ts-ignore - isNew exists now
      toast.success(res.isNew ? "¡Gracias por suscribirte!" : "¡Hola de nuevo!", {
        description: "Pronto recibirás nuestras novedades en tu correo."
      });
      setEmail("");
    } else {
      setStatus("idle");
      toast.error("Hubo un error", {
        description: "No pudimos suscribirte. Intenta de nuevo."
      });
    }
  };

  return (
    <footer className="bg-slate-50 pt-16 pb-8 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Columna 1: Contacto / Logo */}
          <div className="flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-3 text-2xl font-bold text-blue-600 tracking-tight">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black">
                AT
              </div>
              <span>AURA<span className="text-slate-900">TECH</span></span>
            </Link>
            
            <ul className="flex flex-col gap-4 text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900">Contact Center</p>
                  <p>+51 992 279 632</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900">Email</p>
                  <p>ventas@auratech.com</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900">Ubicación</p>
                  <p>Av. Garcilaso de la Vega 1251, Lima</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Columna 2: Productos */}
          <div>
            <h3 className="font-bold text-slate-900 text-lg mb-6">Productos</h3>
            <ul className="flex flex-col gap-3 text-sm text-slate-600">
              <li><Link href="/tienda?marca=apple" className="hover:text-blue-600 transition">Apple</Link></li>
              <li><Link href="/tienda?marca=amazon" className="hover:text-blue-600 transition">Amazon & Google</Link></li>
              <li><Link href="/tienda?categoria=audio" className="hover:text-blue-600 transition">Audio / Audífonos</Link></li>
              <li><Link href="/tienda?categoria=accesorios" className="hover:text-blue-600 transition">Cables & Cases</Link></li>
              <li><Link href="/tienda?marca=xiaomi" className="hover:text-blue-600 transition">Xiaomi</Link></li>
              <li><Link href="/tienda" className="font-medium text-blue-600 hover:underline">Ver todo el catálogo...</Link></li>
            </ul>
          </div>

          {/* Columna 3: Información */}
          <div>
            <h3 className="font-bold text-slate-900 text-lg mb-6">Aura Tech</h3>
            <ul className="flex flex-col gap-3 text-sm text-slate-600 mb-8">
              <li><Link href="/contacto" className="hover:text-blue-600 transition">Quiénes somos</Link></li>
              <li><Link href="/contacto" className="hover:text-blue-600 transition">Contáctanos</Link></li>
              <li><Link href="/reclamaciones" className="hover:text-blue-600 transition">Libro de Reclamaciones</Link></li>
            </ul>

            <h3 className="font-bold text-slate-900 text-lg mb-6">Información</h3>
            <ul className="flex flex-col gap-3 text-sm text-slate-600">
              <li><Link href="/politicas-de-privacidad" className="hover:text-blue-600 transition">Políticas de Privacidad</Link></li>
              <li><Link href="/politicas-de-privacidad" className="hover:text-blue-600 transition">Términos y Condiciones</Link></li>
              <li><Link href="/preguntas-frecuentes" className="hover:text-blue-600 transition">Preguntas Frecuentes</Link></li>
            </ul>
          </div>

          {/* Columna 4: Boletín */}
          <div>
            {/* 
            <h3 className="font-bold text-slate-900 text-lg mb-6">Boletín</h3>
            <p className="text-sm text-slate-600 mb-4">
              Suscríbete a nuestro boletín para ser el primero en recibir novedades, lanzamientos y ofertas exclusivas.
            </p>
            <form className="flex flex-col gap-3 mb-6" onSubmit={handleSubscribe}>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tu correo electrónico" 
                required
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-600 transition"
              />
              <button 
                type="submit" 
                disabled={status === "loading"}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition"
              >
                {status === "loading" ? "Procesando..." : "Suscribirme"}
              </button>
            </form>
            */}
            
            <h3 className="font-bold text-slate-900 text-lg mb-6">Síguenos</h3>
            <div className="flex items-center gap-4">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-10 h-10 bg-slate-200 hover:bg-blue-600 hover:text-white text-slate-600 rounded-full flex items-center justify-center transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-10 h-10 bg-slate-200 hover:bg-blue-600 hover:text-white text-slate-600 rounded-full flex items-center justify-center transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
              </a>
            </div>
          </div>
        </div>

        {/* Sub-Footer */}
        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>Aura Tech © 2026. Todos los derechos reservados.</p>
          <p>
            Desarrollado con ❤️ para <Link href="#" className="font-medium text-slate-700 hover:text-blue-600">tiendas de alto impacto</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
