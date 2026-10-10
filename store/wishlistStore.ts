import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product } from '@/lib/data';

interface WishlistStore {
  items: Product[];
  isHydrated: boolean;
  _setHydrated: () => void;
  addItem: (item: Product) => void;
  removeItem: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      isHydrated: false,
      _setHydrated: () => set({ isHydrated: true }),
      addItem: (item) => set((state) => {
        const exists = state.items.some((i) => i.id === item.id);
        if (!exists) {
          return { items: [...state.items, item] };
        }
        return state;
      }),
      removeItem: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id)
      })),
      isInWishlist: (id) => get().items.some((i) => i.id === id),
      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'aura-wishlist-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?._setHydrated();
      },
    }
  )
);
