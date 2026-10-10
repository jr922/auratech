import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string; // The cart item unique key (can be variantId or productId)
  productId?: string; // Real DB Product ID
  variantId?: string; // Real DB Variant ID (if applicable)
  name: string;
  price: number;
  quantity: number;
  maxStock: number; // Nuevo límite visual de stock
  image?: string;
}

interface CartStore {
  items: CartItem[];
  isHydrated: boolean;
  sessionId: string; // Generado para rastrear carritos de invitados
  shippingOption: 'lima' | 'provincia' | 'tienda';
  appliedCoupon: { code: string, discountType: 'PERCENTAGE' | 'FIXED', discountValue: number } | null;
  _setHydrated: () => void;
  setShippingOption: (option: 'lima' | 'provincia' | 'tienda') => void;
  applyCoupon: (coupon: { code: string, discountType: 'PERCENTAGE' | 'FIXED', discountValue: number }) => void;
  removeCoupon: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isHydrated: false,
      sessionId: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      shippingOption: 'lima',
      appliedCoupon: null,
      _setHydrated: () => set({ isHydrated: true }),
      setShippingOption: (option) => set({ shippingOption: option }),
      applyCoupon: (coupon) => set({ appliedCoupon: coupon }),
      removeCoupon: () => set({ appliedCoupon: null }),
      addItem: (item) => set((state) => {
        const existingItem = state.items.find((i) => i.id === item.id);
        if (existingItem) {
          return {
            items: state.items.map((i) => 
              i.id === item.id ? { 
                ...i, 
                quantity: Math.min(i.quantity + item.quantity, i.maxStock) // Respetamos maxStock al agregar más
              } : i
            )
          };
        }
        // Asegurar que si agregan más de maxStock de primera vez, se límite (ej. quantity=10, maxStock=2)
        const cappedItem = { ...item, quantity: Math.min(item.quantity, item.maxStock) };
        return { items: [...state.items, cappedItem] };
      }),
      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map((i) => 
          i.id === id ? { 
            ...i, 
            quantity: Math.max(1, Math.min(quantity, i.maxStock)) // Entre 1 y maxStock
          } : i
        )
      })),
      clearCart: () => set({ items: [], appliedCoupon: null }),
      totalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
      totalPrice: () => get().items.reduce((total, item) => total + (item.price * item.quantity), 0),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?._setHydrated();
      }
    }
  )
);
