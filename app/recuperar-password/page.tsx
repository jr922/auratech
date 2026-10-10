"use client";

import { useState } from "react";
import { requestPasswordReset } from "@/app/actions/auth-password";
import { toast } from "sonner";
import { Mail, ArrowLeft } from "lucide-react";

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    const res = await requestPasswordReset(email);
    setLoading(false);

    if (res.success) {
      setSubmitted(true);
    } else {
      toast.error(res.error || "Ocurrió un error. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="bg-slate-50 min-h-[80vh] py-16 px-4 flex justify-center items-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
        
        <div className="mb-8">
          <a href="/mi-cuenta" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition mb-6">
            <ArrowLeft className="w-4 h-4" /> Volver a mi cuenta
          </a>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Recuperar contraseña</h1>
          <p className="text-slate-500 mt-2">
            Ingresa tu correo electrónico y te enviaremos un enlace para crear una nueva contraseña.
          </p>
        </div>

        {submitted ? (
          <div className="bg-blue-50 text-blue-900 p-6 rounded-2xl text-center border border-blue-100">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">Revisa tu bandeja de entrada</h3>
            <p className="text-sm">
              Si el correo <strong>{email}</strong> está registrado, recibirás un enlace de recuperación en los próximos minutos.
            </p>
            <p className="text-xs text-slate-500 mt-4">
              No olvides revisar la carpeta de spam o correo no deseado.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Correo electrónico</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none transition" 
                placeholder="ejemplo@correo.com"
                required 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl mt-4 hover:bg-blue-600 transition disabled:opacity-50"
            >
              {loading ? "Enviando enlace..." : "Enviar enlace de recuperación"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
