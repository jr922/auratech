"use client";

import { useState, Suspense } from "react";
import { resetPassword } from "@/app/actions/auth-password";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Token inválido o faltante.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    setError("");
    const res = await resetPassword(token, password);
    setLoading(false);

    if (res.success) {
      setSuccess(true);
      toast.success("Contraseña actualizada con éxito.");
    } else {
      setError(res.error || "El enlace es inválido o ha expirado.");
    }
  };

  if (!token) {
    return (
      <div className="bg-slate-50 min-h-[80vh] py-16 px-4 flex justify-center items-center">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
          <h1 className="text-2xl font-black text-slate-900 mb-4">Enlace Inválido</h1>
          <p className="text-slate-500 mb-6">No se encontró un token de recuperación válido en la URL.</p>
          <button onClick={() => router.push("/recuperar-password")} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition">
            Solicitar nuevo enlace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-[80vh] py-16 px-4 flex justify-center items-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
        
        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">¡Contraseña actualizada!</h1>
            <p className="text-slate-500 mb-8">
              Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión con tu nueva clave.
            </p>
            <button onClick={() => router.push("/mi-cuenta?login=true")} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-blue-600 transition">
              Ir a Iniciar Sesión
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Crear nueva contraseña</h1>
              <p className="text-slate-500 mt-2">
                Ingresa tu nueva contraseña para acceder a tu cuenta.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mb-6 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">Nueva Contraseña</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none transition" 
                  placeholder="Mínimo 6 caracteres"
                  required 
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">Confirmar Contraseña</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none transition" 
                  placeholder="Repite la contraseña"
                  required 
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl mt-4 hover:bg-blue-600 transition disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Guardar contraseña"}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center">Cargando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
