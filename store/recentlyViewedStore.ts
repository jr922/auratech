import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/lib/data';

interface RecentlyViewedStore {
  items: Product[];
  isHydrated: boolean;
  _setHydrated: () => void;
  addProduct: (product: Product) => void;
  clearHistory: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      items: [],
      isHydrated: false,
      _setHydrated: () => set({ isHydrated: true }),
      addProduct: (product) => set((state) => {
        // Filtrar si ya existe para moverlo al principio
        const filtered = state.items.filter(item => item.id !== product.id);
        
        // Agregar al inicio y mantener un máximo de 12 productos
        const newItems = [product, ...filtered].slice(0, 12);
        
        return { items: newItems };
      }),
      clearHistory: () => set({ items: [] }),
    }),
    {
      name: 'recently-viewed-storage',
      onRehydrateStorage: () => (state) => {
        if (state) state._setHydrated();
      },
    }
  )
);
