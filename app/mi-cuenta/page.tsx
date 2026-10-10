"use client";

import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { User, ShoppingBag, MapPin, Settings, ChevronRight, LogOut } from "lucide-react";
import { registerUser, getUserOrders } from "@/app/actions/auth";
import { getUserProfile, updateUserProfile } from "@/app/actions/user";
import { changeUserPassword } from "@/app/actions/auth-password";
import { toast } from "sonner";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AddressBook from "@/components/account/AddressBook";
import { loginSchema, registerSchema } from "@/lib/validations";

function MiCuentaContent() {
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "escritorio");
  const [isRegistering, setIsRegistering] = useState(searchParams.get("register") === "true");
  const [orders, setOrders] = useState<any[]>([]);

  // Auth Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Profile Form states
  const [profileData, setProfileData] = useState({
    name: "",
    document: "",
    phone: ""
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Change states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    // Sincronizar la Pestaña Activa con la URL
    const tab = searchParams.get("tab");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tab) setActiveTab(tab);

    // Sincronizar el formulario (Login vs Register) con la URL
    if (searchParams.get("register") === "true") {
      setIsRegistering(true);
    } else if (searchParams.get("login") === "true") {
      setIsRegistering(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === "authenticated" && session?.user && (session.user as { id: string }).id) {
      const userId = (session.user as { id: string }).id;
      getUserOrders(userId).then(setOrders);
      getUserProfile(userId).then((data) => {
        if (data) {
          setProfileData({
            name: data.name || "",
            document: data.document || "",
            phone: data.phone || ""
          });
        }
      });
    }
  }, [status, session]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user || !(session.user as { id: string }).id) return;
    
    setIsUpdatingProfile(true);
    const res = await updateUserProfile((session.user as { id: string }).id, profileData);
    
    if (res.success) {
      toast.success("Perfil actualizado con éxito");
      // Sincronizar el estado global de la sesión (ej. el DropdownMenu)
      if (profileData.name !== session?.user?.name) {
        await update({ name: profileData.name });
      }
    } else {
      toast.error(res.error || "Ocurrió un error");
    }
    setIsUpdatingProfile(false);
  };

  const router = useRouter();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Las nuevas contraseñas no coinciden");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    
    setIsChangingPassword(true);
    const res = await changeUserPassword(oldPassword, newPassword);
    if (res.success) {
      toast.success("Contraseña actualizada con éxito");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast.error(res.error || "Ocurrió un error al cambiar la contraseña");
    }
    setIsChangingPassword(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFormErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const formatted = parsed.error.format();
      setFormErrors({
        email: formatted.email?._errors[0] || "",
        password: formatted.password?._errors[0] || "",
      });
      return;
    }

    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError(res.error);
      toast.error('Error al iniciar sesión', { description: res.error });
    } else {
      toast.success('¡Bienvenido de vuelta!');
      const returnTo = searchParams.get("returnTo");
      if (returnTo) {
        router.push(returnTo);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFormErrors({});

    const parsed = registerSchema.safeParse({ 
      name, 
      email, 
      password: registerPassword, 
      confirmPassword: registerConfirmPassword 
    });
    
    if (!parsed.success) {
      const formatted = parsed.error.format();
      setFormErrors({
        name: formatted.name?._errors[0] || "",
        email: formatted.email?._errors[0] || "",
        password: formatted.password?._errors[0] || "",
        confirmPassword: formatted.confirmPassword?._errors[0] || "",
      });
      return;
    }

    setLoading(true);
    
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", registerPassword);
    
    const res = await registerUser(formData);
    if (res.success) {
      toast.success('Cuenta creada exitosamente');
      // Login automatically
      await signIn("credentials", { email, password: registerPassword, redirect: false });
      const returnTo = searchParams.get("returnTo");
      if (returnTo) {
        router.push(returnTo);
      }
    } else {
      setError(res.error || "Error al registrarse");
      toast.error('Error al registrarse', { description: res.error });
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <div className="min-h-[60vh] flex items-center justify-center">Cargando...</div>;
  }

  // ================= VISTA 1: NO LOGUEADO =================
  if (status === "unauthenticated") {
    return (
      <div className="bg-slate-50 min-h-[80vh] py-16 px-4 flex justify-center items-center">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mi cuenta</h1>
            <p className="text-slate-500 mt-2">
              {isRegistering ? "Crea una cuenta nueva." : "Accede para gestionar tus pedidos."}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mb-6">
              {error}
            </div>
          )}

          {isRegistering ? (
            <form onSubmit={handleRegister} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">Nombre completo *</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 bg-slate-50 focus:bg-white outline-none transition ${formErrors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-600'}`}
                />
                {formErrors.name && <p className="text-red-500 text-xs font-medium">{formErrors.name}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">Correo electrónico *</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 bg-slate-50 focus:bg-white outline-none transition ${formErrors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-600'}`}
                />
                {formErrors.email && <p className="text-red-500 text-xs font-medium">{formErrors.email}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">Contraseña *</label>
                <input 
                  type="password" 
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 bg-slate-50 focus:bg-white outline-none transition ${formErrors.password ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-600'}`}
                  placeholder="Mínimo 6 caracteres"
                />
                {formErrors.password && <p className="text-red-500 text-xs font-medium">{formErrors.password}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">Confirmar Contraseña *</label>
                <input 
                  type="password" 
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 bg-slate-50 focus:bg-white outline-none transition ${formErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-600'}`}
                  placeholder="Repite tu contraseña"
                />
                {formErrors.confirmPassword && <p className="text-red-500 text-xs font-medium">{formErrors.confirmPassword}</p>}
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl mt-2 hover:bg-blue-700 transition"
              >
                {loading ? "Registrando..." : "Registrarse"}
              </button>
              <p className="text-center text-sm text-slate-600 mt-4">
                ¿Ya tienes cuenta? <button type="button" onClick={() => router.push('?login=true')} className="text-blue-600 font-bold hover:underline">Inicia sesión</button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">Correo electrónico *</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 bg-slate-50 focus:bg-white outline-none transition ${formErrors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-600'}`}
                />
                {formErrors.email && <p className="text-red-500 text-xs font-medium">{formErrors.email}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">Contraseña *</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 bg-slate-50 focus:bg-white outline-none transition ${formErrors.password ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-600'}`}
                />
                {formErrors.password && <p className="text-red-500 text-xs font-medium">{formErrors.password}</p>}
              </div>
              <div className="flex justify-end items-center mt-2">
                <a 
                  href="/recuperar-password"
                  className="text-sm font-bold text-blue-600 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl mt-2 hover:bg-blue-600 transition"
              >
                {loading ? "Accediendo..." : "Acceder"}
              </button>
              <p className="text-center text-sm text-slate-600 mt-4">
                ¿No tienes cuenta? <button type="button" onClick={() => router.push('?register=true')} className="text-blue-600 font-bold hover:underline">Regístrate</button>
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ================= VISTA 2: LOGUEADO =================
  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* SIDEBAR */}
        <div className="w-full md:w-1/4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 sticky top-28">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-xl">
                {session?.user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-slate-900">{session?.user?.name}</p>
                <p className="text-xs text-slate-500">{session?.user?.email}</p>
              </div>
            </div>

            <nav className="flex flex-col gap-2">
              <button onClick={() => setActiveTab("escritorio")} className={`flex items-center justify-between p-3 rounded-xl font-bold transition ${activeTab === "escritorio" ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}>
                <div className="flex items-center gap-3"><Settings className="w-5 h-5" /> Escritorio</div>
                {activeTab === "escritorio" && <ChevronRight className="w-4 h-4" />}
              </button>
              <button onClick={() => setActiveTab("pedidos")} className={`flex items-center justify-between p-3 rounded-xl font-bold transition ${activeTab === "pedidos" ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}>
                <div className="flex items-center gap-3"><ShoppingBag className="w-5 h-5" /> Mis Pedidos</div>
                {activeTab === "pedidos" && <ChevronRight className="w-4 h-4" />}
              </button>
              <button onClick={() => setActiveTab("direcciones")} className={`flex items-center justify-between p-3 rounded-xl font-bold transition ${activeTab === "direcciones" ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}>
                <div className="flex items-center gap-3"><MapPin className="w-5 h-5" /> Direcciones</div>
                {activeTab === "direcciones" && <ChevronRight className="w-4 h-4" />}
              </button>
              <button onClick={() => setActiveTab("detalles")} className={`flex items-center justify-between p-3 rounded-xl font-bold transition ${activeTab === "detalles" ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}>
                <div className="flex items-center gap-3"><User className="w-5 h-5" /> Detalles de la cuenta</div>
                {activeTab === "detalles" && <ChevronRight className="w-4 h-4" />}
              </button>
              <button onClick={() => signOut()} className="flex items-center gap-3 p-3 rounded-xl font-bold text-red-500 hover:bg-red-50 transition mt-4">
                <LogOut className="w-5 h-5" /> Cerrar sesión
              </button>
            </nav>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="w-full md:w-3/4">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100 min-h-[600px]">
            
            {activeTab === "escritorio" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-slate-900 mb-6">Hola {session?.user?.name}</h2>
                <p className="text-slate-600 mb-8">
                  Desde el escritorio de tu cuenta puedes ver tus pedidos recientes, gestionar tus direcciones de envío y facturación, y editar tu contraseña y los detalles de tu cuenta.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button onClick={() => setActiveTab("pedidos")} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-600 hover:bg-blue-50 transition group flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition">
                      <ShoppingBag className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="font-bold text-slate-900">Mis Pedidos</span>
                  </button>
                  <button onClick={() => setActiveTab("direcciones")} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-600 hover:bg-blue-50 transition group flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition">
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="font-bold text-slate-900">Direcciones</span>
                  </button>
                  <button onClick={() => setActiveTab("detalles")} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-600 hover:bg-blue-50 transition group flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="font-bold text-slate-900">Perfil</span>
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === "pedidos" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-slate-900 mb-6">Mis Pedidos</h2>
                
                {orders.length === 0 ? (
                  <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-100">
                    <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium mb-4">Aún no has realizado ningún pedido.</p>
                    <a href="/tienda" className="inline-block bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-600 transition">Explorar tienda</a>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {orders.map(order => (
                      <div key={order.id} className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                          <div>
                            <p className="font-bold text-slate-900">Pedido #{order.id.slice(-6).toUpperCase()}</p>
                            <p className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString('es-PE')} • {order.items?.length || 0} productos</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-black text-blue-600 text-lg">S/ {order.total.toFixed(2)}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              order.status === 'CANCELLED' ? 'bg-red-100 text-red-600' :
                              order.status === 'PENDING' ? 'bg-orange-100 text-orange-600' : 
                              order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {order.status === 'CANCELLED' ? 'CANCELADO' :
                               order.status === 'PENDING' ? 'PENDIENTE' : 
                               order.status === 'DELIVERED' ? 'ENTREGADO' : 
                               'EN PROCESO'}
                            </span>
                          </div>
                          <div className="md:ml-auto flex flex-col gap-2">
                            <a href={`/pedido/${order.id}`} className="inline-block bg-slate-900 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-blue-600 transition text-center">
                              Ver Seguimiento
                            </a>
                          </div>
                        </div>
                        
                        {/* INYECTANDO HISTORIAL DE AUDITORÍA */}
                        {order.history && order.history.length > 0 && (
                          <div className="pt-4 border-t border-slate-100 pl-4 border-l-4 border-blue-600">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Última Actualización</p>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-slate-900">{order.history[0].status}</span>
                              <span className="text-xs text-slate-400">{new Date(order.history[0].createdAt).toLocaleString('es-PE')}</span>
                            </div>
                            {order.history[0].notes && <p className="text-xs text-slate-500 mt-1">{order.history[0].notes}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "direcciones" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-slate-900 mb-6">Mis Direcciones</h2>
                <AddressBook />
              </div>
            )}

            {activeTab === "detalles" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-slate-900 mb-6">Detalles de la cuenta</h2>
                <form onSubmit={handleUpdateProfile} className="flex flex-col gap-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Nombre Completo</label>
                      <input 
                        type="text" 
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600"
                        placeholder="Tu nombre completo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Documento (DNI/RUC)</label>
                      <input 
                        type="text" 
                        value={profileData.document}
                        onChange={(e) => setProfileData({ ...profileData, document: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600"
                        placeholder="Ej. 12345678"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Teléfono</label>
                      <input 
                        type="text" 
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600"
                        placeholder="Tu celular"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Correo Electrónico (No editable)</label>
                      <input 
                        type="email" 
                        disabled
                        value={session?.user?.email || ""}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 text-slate-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <p className="text-sm text-slate-500">
                    Gestiona tus direcciones de envío en la pestaña{" "}
                    <button type="button" onClick={() => setActiveTab("direcciones")} className="text-blue-600 font-bold hover:underline">
                      Direcciones
                    </button>.
                  </p>

                  <button 
                    type="submit" 
                    disabled={isUpdatingProfile}
                    className="w-full md:w-auto px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-blue-600 transition disabled:opacity-50"
                  >
                    {isUpdatingProfile ? "Guardando..." : "Guardar cambios"}
                  </button>

                </form>

                <div className="mt-12 border-t border-slate-100 pt-12">
                  <h2 className="text-xl font-black text-slate-900 mb-6">Cambiar contraseña</h2>
                  <form onSubmit={handleChangePassword} className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña Actual</label>
                        <input 
                          type="password" 
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600"
                          placeholder="Tu contraseña actual"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Nueva Contraseña</label>
                        <input 
                          type="password" 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600"
                          placeholder="Mínimo 6 caracteres"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Confirmar Nueva Contraseña</label>
                        <input 
                          type="password" 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600"
                          placeholder="Repite la nueva contraseña"
                          required
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      disabled={isChangingPassword}
                      className="w-full md:w-auto px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-blue-600 transition disabled:opacity-50"
                    >
                      {isChangingPassword ? "Actualizando..." : "Actualizar contraseña"}
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

export default function MiCuentaPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center">Cargando...</div>}>
      <MiCuentaContent />
    </Suspense>
  );
}
