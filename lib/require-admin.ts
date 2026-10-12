import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";

/**
 * Garantiza que quien ejecuta la página/acción es ADMIN.
 * El layout de /admin ya lo valida, pero las páginas lo vuelven a comprobar
 * porque layout y page se renderizan en paralelo (defensa en profundidad).
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/");
  }
  return session;
}
