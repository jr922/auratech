"use client";

import { User, LogOut, ShoppingBag, Settings, LayoutDashboard } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthDropdown() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const returnTo = pathname !== "/mi-cuenta" ? `&returnTo=${encodeURIComponent(pathname)}` : "";

  // Durante SSR y la primera hidratación, renderizamos un botón estático que coincide perfectamente 
  // con el árbol de Radix UI (que inyecta un <button> a través de DropdownMenuTrigger)
  if (!mounted || status === "loading") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="hidden sm:flex flex-col items-center text-slate-600 hover:text-blue-600 transition outline-none">
          <User className="w-6 h-6" />
          <span className="text-[10px] md:text-xs mt-0.5">Mi Perfil</span>
        </DropdownMenuTrigger>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hidden sm:flex flex-col items-center text-slate-600 hover:text-blue-600 transition outline-none">
        <User className="w-6 h-6" />
        <span className="text-[10px] md:text-xs mt-0.5">
          {status === "authenticated" ? "Mi Perfil" : "Iniciar Sesión"}
        </span>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56 bg-white p-2 rounded-xl shadow-lg border border-slate-100">
        {status === "authenticated" ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-bold text-slate-900">
                Hola, {session?.user?.name?.split(' ')[0] || 'Usuario'}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem onClick={() => router.push("/mi-cuenta")} className="cursor-pointer hover:bg-slate-50 focus:bg-slate-50 rounded-lg flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-slate-500" />
              Mi Panel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/mi-cuenta?tab=pedidos")} className="cursor-pointer hover:bg-slate-50 focus:bg-slate-50 rounded-lg flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-slate-500" />
              Mis Pedidos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/mi-cuenta?tab=detalles")} className="cursor-pointer hover:bg-slate-50 focus:bg-slate-50 rounded-lg flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-500" />
              Ajustes
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem 
              onClick={() => signOut({ callbackUrl: '/' })} 
              className="cursor-pointer hover:bg-red-50 focus:bg-red-50 text-red-600 focus:text-red-600 rounded-lg"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-bold text-slate-900 text-center py-2">
                Bienvenido a AuraTech
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-slate-100" />
            <div className="p-2 flex flex-col gap-2">
              <DropdownMenuItem 
                onClick={() => router.push(`/mi-cuenta?login=true${returnTo}`)}
                className="w-full bg-blue-600 focus:bg-blue-700 text-white focus:text-white text-sm font-bold py-2 rounded-lg text-center hover:bg-blue-700 transition cursor-pointer flex justify-center"
              >
                Iniciar Sesión
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push(`/mi-cuenta?register=true${returnTo}`)}
                className="w-full bg-slate-100 focus:bg-slate-200 text-slate-700 focus:text-slate-900 text-sm font-bold py-2 rounded-lg text-center hover:bg-slate-200 transition cursor-pointer flex justify-center"
              >
                Crear Cuenta
              </DropdownMenuItem>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
