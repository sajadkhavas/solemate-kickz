import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import {
  getCartQuantityCount,
  isCartSelectionValid,
  sanitizePersistedCart,
  type CartItem,
} from "@/cart/cart-domain";

export type { CartItem } from "@/cart/cart-domain";

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
  addToCart: (id: number, size: number, qty?: number) => boolean;
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

  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;

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

const safeStorage: StateStorage = {
  getItem(name) {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem(name, value) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // Storage can be disabled, quota-limited or blocked by browser policy.
    }
  },
  removeItem(name) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(name);
    } catch {
      // Keep the store usable even if persistent storage is unavailable.
    }
  },
};

const normalizeQuantity = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.max(1, Math.floor(value));
};

const sanitizeDemoMode = (value: unknown): DemoAccountMode =>
  value === "active" || value === "expired" ? value : "guest";

const sanitizeDemoProfile = (value: unknown): DemoAccountProfile => {
  if (!value || typeof value !== "object") return defaultDemoProfile;
  const profile = value as Record<string, unknown>;
  return {
    name: typeof profile.name === "string" ? profile.name : defaultDemoProfile.name,
    email: typeof profile.email === "string" ? profile.email : defaultDemoProfile.email,
    phone: typeof profile.phone === "string" ? profile.phone : "",
  };
};

const sanitizeDemoAddresses = (value: unknown): DemoAddress[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : nextDemoAddressId(),
      recipient: typeof item.recipient === "string" ? item.recipient : "",
      city: typeof item.city === "string" ? item.city : "",
      address: typeof item.address === "string" ? item.address : "",
    }))
    .filter((item) => item.recipient.trim() && item.city.trim() && item.address.trim());
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      cart: [],
      addToCart: (id, size, qty = 1) => {
        const safeQty = normalizeQuantity(qty);
        if (safeQty === null || !isCartSelectionValid(id, size)) return false;

        const existing = get().cart.find((item) => item.id === id && item.size === size);
        if (existing) {
          set({
            cart: get().cart.map((item) =>
              item.id === id && item.size === size ? { ...item, qty: item.qty + safeQty } : item,
            ),
          });
        } else {
          set({ cart: [...get().cart, { id, size, qty: safeQty }] });
        }
        return true;
      },
      removeFromCart: (id, size) =>
        set({ cart: get().cart.filter((item) => !(item.id === id && item.size === size)) }),
      updateQty: (id, size, qty) => {
        const safeQty = normalizeQuantity(qty);
        if (safeQty === null) return;
        set({
          cart: get().cart.map((item) =>
            item.id === id && item.size === size ? { ...item, qty: safeQty } : item,
          ),
        });
      },
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

      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

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
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<Store>;
        const persistedUser = persisted.user;
        const user =
          persistedUser &&
          typeof persistedUser === "object" &&
          typeof persistedUser.name === "string" &&
          typeof persistedUser.email === "string"
            ? { name: persistedUser.name, email: persistedUser.email }
            : null;

        return {
          ...currentState,
          cart: sanitizePersistedCart(persisted.cart),
          wishlist: Array.isArray(persisted.wishlist)
            ? [
                ...new Set(
                  persisted.wishlist.filter(
                    (id): id is number => Number.isInteger(id) && id > 0,
                  ),
                ),
              ]
            : [],
          recentlyViewed: Array.isArray(persisted.recentlyViewed)
            ? persisted.recentlyViewed
                .filter((id): id is number => Number.isInteger(id) && id > 0)
                .slice(0, 8)
            : [],
          searchHistory: Array.isArray(persisted.searchHistory)
            ? persisted.searchHistory
                .filter((term): term is string => typeof term === "string")
                .slice(0, 6)
            : [],
          user,
          demoAccountMode: sanitizeDemoMode(persisted.demoAccountMode),
          demoProfile: sanitizeDemoProfile(persisted.demoProfile),
          demoAddresses: sanitizeDemoAddresses(persisted.demoAddresses),
          isCartOpen: false,
          isMobileNavOpen: false,
          isSearchOpen: false,
          hasHydrated: false,
        };
      },
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
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export const useCartCount = () => useStore((state) => getCartQuantityCount(state.cart));
