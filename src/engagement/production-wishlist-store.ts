import { useEffect, useSyncExternalStore } from "react";

import type { Shoe } from "@/data/shoes";
import {
  EngagementApiError,
  addWishlistVariant,
  getWishlist,
  migrateWishlistVariants,
  removeWishlistVariant,
  type WishlistItem,
} from "@/engagement/engagement-api";

export type WishlistStatus = "idle" | "loading" | "ready" | "unauthorized" | "error";
export type WishlistSnapshot = {
  status: WishlistStatus;
  items: WishlistItem[];
  error: string | null;
};

let snapshot: WishlistSnapshot = { status: "idle", items: [], error: null };
let loading: Promise<WishlistSnapshot> | null = null;
const listeners = new Set<() => void>();

function publish(next: WishlistSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function representativeVariantId(shoe: Shoe): number | null {
  const variants = (shoe as Shoe & {
    variants?: Array<{ id: number; availability?: string; availableQuantity?: number }>;
  }).variants;
  if (!variants?.length) return null;
  return (
    variants.find(
      (variant) => variant.availability === "in_stock" || (variant.availableQuantity ?? 0) > 0,
    )?.id ?? variants[0]?.id ?? null
  );
}

export async function loadProductionWishlist(force = false): Promise<WishlistSnapshot> {
  if (!force && snapshot.status === "ready") return snapshot;
  if (!force && loading) return loading;

  publish({ ...snapshot, status: "loading", error: null });
  loading = getWishlist()
    .then((items) => {
      const next = { status: "ready" as const, items, error: null };
      publish(next);
      return next;
    })
    .catch((cause: unknown) => {
      const unauthorized = cause instanceof EngagementApiError && cause.status === 401;
      const next: WishlistSnapshot = {
        status: unauthorized ? "unauthorized" : "error",
        items: [],
        error: unauthorized ? null : "دریافت علاقه‌مندی از Backend انجام نشد.",
      };
      publish(next);
      return next;
    })
    .finally(() => {
      loading = null;
    });

  return loading;
}

export function useProductionWishlistSnapshot(): WishlistSnapshot {
  const current = useSyncExternalStore(subscribe, () => snapshot, () => snapshot);
  useEffect(() => {
    if (current.status === "idle") void loadProductionWishlist();
  }, [current.status]);
  return current;
}

export function useProductionWishlistItem(shoe: Shoe) {
  const current = useProductionWishlistSnapshot();
  const variantId = representativeVariantId(shoe);
  const isWishlisted =
    variantId !== null && current.items.some((item) => item.variant_id === variantId);

  return {
    status: current.status,
    isWishlisted,
    variantId,
    async toggle() {
      if (variantId === null) throw new Error("authoritative_variant_missing");
      if (current.status !== "ready") {
        const loaded = await loadProductionWishlist(true);
        if (loaded.status !== "ready") throw new Error("wishlist_unavailable");
      }
      const fresh = snapshot.items.some((item) => item.variant_id === variantId);
      if (fresh) {
        await removeWishlistVariant(variantId);
        await loadProductionWishlist(true);
      } else {
        const items = await addWishlistVariant(variantId);
        publish({ status: "ready", items, error: null });
      }
    },
  };
}

function legacyWishlistProductIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("sole-store");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { state?: { wishlist?: unknown } };
    if (!Array.isArray(parsed.state?.wishlist)) return [];
    return parsed.state.wishlist.filter(
      (value): value is number => typeof value === "number" && Number.isInteger(value) && value > 0,
    );
  } catch {
    return [];
  }
}

function clearLegacyWishlist() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem("sole-store");
    if (!raw) return;
    const parsed = JSON.parse(raw) as { state?: { wishlist?: unknown }; [key: string]: unknown };
    if (!parsed.state) return;
    parsed.state.wishlist = [];
    window.localStorage.setItem("sole-store", JSON.stringify(parsed));
  } catch {
    // A malformed legacy fixture is ignored instead of becoming production authority.
  }
}

export async function migrateLegacyWishlist(catalog: Shoe[]): Promise<number> {
  const productIds = legacyWishlistProductIds();
  if (!productIds.length) return 0;
  const variants = catalog
    .filter((shoe) => productIds.includes(shoe.id))
    .map(representativeVariantId)
    .filter((id): id is number => id !== null);
  if (!variants.length) return 0;

  const result = await migrateWishlistVariants([...new Set(variants)]);
  publish({ status: "ready", items: result.data, error: null });
  clearLegacyWishlist();
  return result.accepted_variant_ids.length;
}
