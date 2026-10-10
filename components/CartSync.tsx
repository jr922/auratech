"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store/cartStore";
import { syncCartToDb, getDbCart } from "@/app/actions/cart.actions";

export function CartSync() {
  const { status } = useSession();
  const isHydrated = useCartStore((state) => state.isHydrated);
  const hasRecoveredCart = useRef(false);

  // 1. Recuperar el carrito si inicia sesión (Hydration desde DB)
  useEffect(() => {
    if (status === "authenticated" && !hasRecoveredCart.current) {
      hasRecoveredCart.current = true;
      getDbCart().then((dbItems) => {
        if (dbItems && dbItems.length > 0) {
          // Si la DB tiene ítems, sobreescribimos/mergeamos el carrito local
          const localItems = useCartStore.getState().items;
          if (localItems.length === 0) {
            dbItems.forEach(item => useCartStore.getState().addItem(item));
          }
        }
      });
    }
  }, [status]);

  // 2. Sincronizar hacia la BD cuando cambia localmente
  useEffect(() => {
    if (!isHydrated) return;

    const unsubscribe = useCartStore.subscribe(
      (state, prevState) => {
        if (JSON.stringify(state.items) !== JSON.stringify(prevState.items)) {
          syncCartToDb(state.sessionId, state.items).catch(console.error);
        }
      }
    );

    const currentState = useCartStore.getState();
    if (currentState.items.length > 0) {
        syncCartToDb(currentState.sessionId, currentState.items).catch(console.error);
    }

    return () => unsubscribe();
  }, [isHydrated]);

  return null;
}
