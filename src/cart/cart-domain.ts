import { SHOES, type Shoe } from "@/data/shoes";

export interface CartItem {
  id: number;
  size: number;
  qty: number;
}

export type CartItemStatus = "ready" | "missing-product" | "invalid-size" | "unavailable";

export interface ResolvedCartItem extends CartItem {
  key: string;
  shoe: Shoe | null;
  status: CartItemStatus;
  blockingMessage: string | null;
  unitPrice: number | null;
}

const toPositiveInteger = (value: unknown) => {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return Math.floor(numeric);
};

const toFiniteSize = (value: unknown) => {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return numeric;
};

export function sanitizePersistedCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];

  const merged = new Map<string, CartItem>();
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object") continue;
    const record = candidate as Record<string, unknown>;
    const id = toPositiveInteger(record.id);
    const size = toFiniteSize(record.size);
    const qty = toPositiveInteger(record.qty);
    if (id === null || size === null || qty === null) continue;

    const key = `${id}:${size}`;
    const existing = merged.get(key);
    merged.set(key, { id, size, qty: (existing?.qty ?? 0) + qty });
  }

  return [...merged.values()];
}

export function isCartSelectionValid(id: number, size: number) {
  const shoe = SHOES.find((candidate) => candidate.id === id);
  return Boolean(shoe && !shoe.isSoldOut && shoe.sizes.includes(size));
}

export function resolveCartItem(item: CartItem): ResolvedCartItem {
  const shoe = SHOES.find((candidate) => candidate.id === item.id) ?? null;
  const key = `${item.id}:${item.size}`;

  if (!shoe) {
    return {
      ...item,
      key,
      shoe: null,
      status: "missing-product",
      blockingMessage: "این محصول دیگر در Dataset فعلی پیدا نمی‌شود.",
      unitPrice: null,
    };
  }

  if (!shoe.sizes.includes(item.size)) {
    return {
      ...item,
      key,
      shoe,
      status: "invalid-size",
      blockingMessage: "سایز ذخیره‌شده دیگر در Dataset این محصول وجود ندارد.",
      unitPrice: null,
    };
  }

  if (shoe.isSoldOut) {
    return {
      ...item,
      key,
      shoe,
      status: "unavailable",
      blockingMessage: "این محصول در Dataset فعلی ناموجود ثبت شده است.",
      unitPrice: null,
    };
  }

  return {
    ...item,
    key,
    shoe,
    status: "ready",
    blockingMessage: null,
    unitPrice: shoe.sale_price ?? shoe.price,
  };
}

export function resolveCart(cart: CartItem[]) {
  return cart.map(resolveCartItem);
}

export function getCartQuantityCount(cart: CartItem[]) {
  return cart.reduce((total, item) => total + item.qty, 0);
}

export function getCartSubtotal(cart: CartItem[]) {
  return resolveCart(cart).reduce(
    (total, item) => total + (item.status === "ready" && item.unitPrice ? item.unitPrice * item.qty : 0),
    0,
  );
}

export function cartHasBlockingIssues(cart: CartItem[]) {
  return resolveCart(cart).some((item) => item.status !== "ready");
}
