import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  id: number;
  size: number;
  qty: number;
}

interface AuthUser {
  name: string;
  email: string;
}

interface Store {
  // Cart
  cart: CartItem[];
  addToCart: (id: number, size: number, qty?: number) => void;
  removeFromCart: (id: number, size: number) => void;
  updateQty: (id: number, size: number, qty: number) => void;
  clearCart: () => void;

  // Wishlist
  wishlist: number[];
  toggleWishlist: (id: number) => void;

  // Recently viewed
  recentlyViewed: number[];
  addRecentlyViewed: (id: number) => void;

  // Search
  searchHistory: string[];
  addSearch: (q: string) => void;
  clearSearchHistory: () => void;

  // UI
  isCartOpen: boolean;
  setCartOpen: (v: boolean) => void;

  // Mock auth
  user: AuthUser | null;
  signIn: (u: AuthUser) => void;
  signOut: () => void;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      cart: [],
      addToCart: (id, size, qty = 1) => {
        const existing = get().cart.find((i) => i.id === id && i.size === size);
        if (existing) {
          set({
            cart: get().cart.map((i) =>
              i.id === id && i.size === size ? { ...i, qty: i.qty + qty } : i,
            ),
          });
        } else {
          set({ cart: [...get().cart, { id, size, qty }] });
        }
      },
      removeFromCart: (id, size) =>
        set({ cart: get().cart.filter((i) => !(i.id === id && i.size === size)) }),
      updateQty: (id, size, qty) =>
        set({
          cart: get().cart.map((i) =>
            i.id === id && i.size === size ? { ...i, qty: Math.max(1, qty) } : i,
          ),
        }),
      clearCart: () => set({ cart: [] }),

      wishlist: [],
      toggleWishlist: (id) =>
        set({
          wishlist: get().wishlist.includes(id)
            ? get().wishlist.filter((x) => x !== id)
            : [id, ...get().wishlist],
        }),

      recentlyViewed: [],
      addRecentlyViewed: (id) =>
        set({
          recentlyViewed: [id, ...get().recentlyViewed.filter((x) => x !== id)].slice(0, 8),
        }),

      searchHistory: [],
      addSearch: (q) =>
        set({
          searchHistory: [q, ...get().searchHistory.filter((x) => x !== q)].slice(0, 6),
        }),
      clearSearchHistory: () => set({ searchHistory: [] }),

      isCartOpen: false,
      setCartOpen: (v) => set({ isCartOpen: v }),

      user: null,
      signIn: (u) => set({ user: u }),
      signOut: () => set({ user: null }),
    }),
    {
      name: "sole-store",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.localStorage
          : (undefined as unknown as Storage),
      ),
      partialize: (s) => ({
        cart: s.cart,
        wishlist: s.wishlist,
        recentlyViewed: s.recentlyViewed,
        searchHistory: s.searchHistory,
        user: s.user,
      }),
    },
  ),
);

// Helpers
export const useCartCount = () =>
  useStore((s) => s.cart.reduce((acc, i) => acc + i.qty, 0));
