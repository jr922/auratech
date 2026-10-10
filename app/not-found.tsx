import { PackageOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-slate-50">
      <PackageOpen className="text-slate-300 w-24 h-24 mb-6" />
      <h1 className="text-6xl font-black text-slate-900 mb-2">404</h1>
      <h2 className="text-2xl font-bold text-slate-800 mb-4">¡Ups! No pudimos encontrar esta página</h2>
      <p className="text-slate-500 mb-8 max-w-md">
        Parece que el producto o la página que buscas ya no existe o ha sido movida.
      </p>
      <Button asChild className="bg-blue-600 hover:bg-blue-700 px-8">
        <Link href="/tienda">Volver a la Tienda</Link>
      </Button>
    </div>
  );
}
