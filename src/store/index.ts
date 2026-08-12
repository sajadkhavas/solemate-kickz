import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import {
  getCartQuantityCount,
  isCartSelectionValid,
  MAX_CART_ITEM_QUANTITY,
  sanitizePersistedCart,
  type CartItem,
} from "@/cart/cart-domain";
import { SHOES } from "@/data/shoes";

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

const MAX_SHORT_TEXT_LENGTH = 160;
const MAX_ADDRESS_LENGTH = 600;
const MAX_SEARCH_HISTORY_TERM_LENGTH = 120;
const knownProductIds = new Set(SHOES.map((shoe) => shoe.id));

const cleanText = (value: unknown, maxLength = MAX_SHORT_TEXT_LENGTH) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const normalizeHistoryTerm = (value: string) =>
  value.trim().replace(/\s+/g, " ").slice(0, MAX_SEARCH_HISTORY_TERM_LENGTH);

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
  const integer = Math.floor(value);
  if (!Number.isSafeInteger(integer)) return null;
  return Math.min(MAX_CART_ITEM_QUANTITY, Math.max(1, integer));
};

const sanitizeDemoMode = (value: unknown): DemoAccountMode =>
  value === "active" || value === "expired" ? value : "guest";

const sanitizeDemoProfile = (value: unknown): DemoAccountProfile => {
  if (!value || typeof value !== "object") return defaultDemoProfile;
  const profile = value as Record<string, unknown>;
  return {
    name: cleanText(profile.name) || defaultDemoProfile.name,
    email: cleanText(profile.email) || defaultDemoProfile.email,
    phone: cleanText(profile.phone),
  };
};

const sanitizeDemoAddresses = (value: unknown): DemoAddress[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      id: cleanText(item.id) || nextDemoAddressId(),
      recipient: cleanText(item.recipient),
      city: cleanText(item.city),
      address: cleanText(item.address, MAX_ADDRESS_LENGTH),
    }))
    .filter((item) => item.recipient && item.city && item.address)
    .slice(0, 25);
};

const sanitizeProductIds = (value: unknown, limit: number) => {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter(
        (id): id is number => Number.isInteger(id) && id > 0 && knownProductIds.has(id),
      ),
    ),
  ].slice(0, limit);
};

const sanitizeSearchHistory = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const candidate of value) {
    if (typeof candidate !== "string") continue;
    const term = normalizeHistoryTerm(candidate);
    if (!term) continue;
    const key = term.toLocaleLowerCase("fa");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(term);
    if (result.length >= 6) break;
  }
  return result;
};

const sanitizeAuthUser = (value: unknown): AuthUser | null => {
  if (!value || typeof value !== "object") return null;
  const user = value as Record<string, unknown>;
  const name = cleanText(user.name);
  const email = cleanText(user.email);
  return name && email ? { name, email } : null;
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
          const nextQty = Math.min(MAX_CART_ITEM_QUANTITY, existing.qty + safeQty);
          if (nextQty === existing.qty) return false;
          set({
            cart: get().cart.map((item) =>
              item.id === id && item.size === size ? { ...item, qty: nextQty } : item,
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
      toggleWishlist: (id) => {
        if (!knownProductIds.has(id)) return;
        set({
          wishlist: get().wishlist.includes(id)
            ? get().wishlist.filter((item) => item !== id)
            : [id, ...get().wishlist],
        });
      },
      clearWishlist: () => set({ wishlist: [] }),

      recentlyViewed: [],
      addRecentlyViewed: (id) => {
        if (!knownProductIds.has(id)) return;
        set({
          recentlyViewed: [id, ...get().recentlyViewed.filter((item) => item !== id)].slice(0, 8),
        });
      },

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
      signIn: (user) => {
        const safeUser = sanitizeAuthUser(user);
        if (safeUser) set({ user: safeUser });
      },
      signOut: () => set({ user: null }),

      demoAccountMode: "guest",
      demoProfile: defaultDemoProfile,
      demoAddresses: [],
      startDemoSession: () => set({ demoAccountMode: "active" }),
      expireDemoSession: () => set({ demoAccountMode: "expired" }),
      resetDemoSession: () => set({ demoAccountMode: "guest" }),
      updateDemoProfile: (profile) => set({ demoProfile: sanitizeDemoProfile(profile) }),
      addDemoAddress: (address) => {
        const safeAddress = sanitizeDemoAddresses([{ id: nextDemoAddressId(), ...address }])[0];
        if (!safeAddress) return;
        set({ demoAddresses: [...get().demoAddresses, safeAddress].slice(-25) });
      },
      removeDemoAddress: (id) =>
        set({ demoAddresses: get().demoAddresses.filter((item) => item.id !== id) }),
    }),
    {
      name: "sole-store",
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<Store>;

        return {
          ...currentState,
          cart: sanitizePersistedCart(persisted.cart),
          wishlist: sanitizeProductIds(persisted.wishlist, SHOES.length),
          recentlyViewed: sanitizeProductIds(persisted.recentlyViewed, 8),
          searchHistory: sanitizeSearchHistory(persisted.searchHistory),
          user: sanitizeAuthUser(persisted.user),
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
