import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface CartItem {
  id: number;
  size: number;
  qty: number;
}

interface AuthUser {
  name: string;
  email: string;
}

export type DemoAccountMode = "guest" | "active" | "expired";

export interface DemoAccountProfile {
  name: string;
  email: string;
  phone: string;
}

export interface DemoAddress {
  id: string;
  recipient: string;
  city: string;
  address: string;
}

type DemoAddressInput = Omit<DemoAddress, "id">;

interface Store {
  cart: CartItem[];
  addToCart: (id: number, size: number, qty?: number) => void;
  removeFromCart: (id: number, size: number) => void;
  updateQty: (id: number, size: number, qty: number) => void;
  clearCart: () => void;

  wishlist: number[];
  toggleWishlist: (id: number) => void;
  clearWishlist: () => void;

  recentlyViewed: number[];
  addRecentlyViewed: (id: number) => void;

  searchHistory: string[];
  addSearch: (query: string) => void;
  removeSearch: (query: string) => void;
  clearSearchHistory: () => void;

  isCartOpen: boolean;
  setCartOpen: (value: boolean) => void;
  isMobileNavOpen: boolean;
  setMobileNavOpen: (value: boolean) => void;
  isSearchOpen: boolean;
  setSearchOpen: (value: boolean) => void;

  user: AuthUser | null;
  signIn: (user: AuthUser) => void;
  signOut: () => void;

  demoAccountMode: DemoAccountMode;
  demoProfile: DemoAccountProfile;
  demoAddresses: DemoAddress[];
  startDemoSession: () => void;
  expireDemoSession: () => void;
  resetDemoSession: () => void;
  updateDemoProfile: (profile: DemoAccountProfile) => void;
  addDemoAddress: (address: DemoAddressInput) => void;
  removeDemoAddress: (id: string) => void;
}

const normalizeHistoryTerm = (value: string) => value.trim().replace(/\s+/g, " ");

const defaultDemoProfile: DemoAccountProfile = {
  name: "کاربر نمایشی SOLE",
  email: "demo@sole.local",
  phone: "",
};

let addressSequence = 0;
const nextDemoAddressId = () => {
  addressSequence += 1;
  return `sole-local-address-${Date.now()}-${addressSequence}`;
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      cart: [],
      addToCart: (id, size, qty = 1) => {
        const existing = get().cart.find((item) => item.id === id && item.size === size);
        if (existing) {
          set({
            cart: get().cart.map((item) =>
              item.id === id && item.size === size ? { ...item, qty: item.qty + qty } : item,
            ),
          });
        } else {
          set({ cart: [...get().cart, { id, size, qty }] });
        }
      },
      removeFromCart: (id, size) =>
        set({ cart: get().cart.filter((item) => !(item.id === id && item.size === size)) }),
      updateQty: (id, size, qty) =>
        set({
          cart: get().cart.map((item) =>
            item.id === id && item.size === size ? { ...item, qty: Math.max(1, qty) } : item,
          ),
        }),
      clearCart: () => set({ cart: [] }),

      wishlist: [],
      toggleWishlist: (id) =>
        set({
          wishlist: get().wishlist.includes(id)
            ? get().wishlist.filter((item) => item !== id)
            : [id, ...get().wishlist],
        }),
      clearWishlist: () => set({ wishlist: [] }),

      recentlyViewed: [],
      addRecentlyViewed: (id) =>
        set({
          recentlyViewed: [id, ...get().recentlyViewed.filter((item) => item !== id)].slice(0, 8),
        }),

      searchHistory: [],
      addSearch: (query) => {
        const value = normalizeHistoryTerm(query);
        if (!value) return;
        set({
          searchHistory: [
            value,
            ...get().searchHistory.filter(
              (item) => item.toLocaleLowerCase("fa") !== value.toLocaleLowerCase("fa"),
            ),
          ].slice(0, 6),
        });
      },
      removeSearch: (query) =>
        set({
          searchHistory: get().searchHistory.filter((item) => item !== query),
        }),
      clearSearchHistory: () => set({ searchHistory: [] }),

      isCartOpen: false,
      setCartOpen: (value) => set({ isCartOpen: value }),
      isMobileNavOpen: false,
      setMobileNavOpen: (value) => set({ isMobileNavOpen: value }),
      isSearchOpen: false,
      setSearchOpen: (value) => set({ isSearchOpen: value }),

      user: null,
      signIn: (user) => set({ user }),
      signOut: () => set({ user: null }),

      demoAccountMode: "guest",
      demoProfile: defaultDemoProfile,
      demoAddresses: [],
      startDemoSession: () => set({ demoAccountMode: "active" }),
      expireDemoSession: () => set({ demoAccountMode: "expired" }),
      resetDemoSession: () => set({ demoAccountMode: "guest" }),
      updateDemoProfile: (profile) => set({ demoProfile: profile }),
      addDemoAddress: (address) =>
        set({
          demoAddresses: [
            ...get().demoAddresses,
            {
              id: nextDemoAddressId(),
              recipient: address.recipient,
              city: address.city,
              address: address.address,
            },
          ],
        }),
      removeDemoAddress: (id) =>
        set({ demoAddresses: get().demoAddresses.filter((item) => item.id !== id) }),
    }),
    {
      name: "sole-store",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : (undefined as unknown as Storage),
      ),
      partialize: (state) => ({
        cart: state.cart,
        wishlist: state.wishlist,
        recentlyViewed: state.recentlyViewed,
        searchHistory: state.searchHistory,
        user: state.user,
        demoAccountMode: state.demoAccountMode,
        demoProfile: state.demoProfile,
        demoAddresses: state.demoAddresses,
      }),
    },
  ),
);

export const useCartCount = () =>
  useStore((state) => state.cart.reduce((total, item) => total + item.qty, 0));
