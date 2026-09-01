import { z } from "zod";

const itemSchema = z.object({
  variant_id: z.number().int().positive(),
  product_slug: z.string(),
  product_name: z.string(),
  sku: z.string(),
  variant_title: z.string(),
  size: z.string().nullable(),
  quantity: z.number().int().positive(),
  available_quantity: z.number().int().nonnegative(),
  unit_price_minor: z.number().int().nonnegative(),
  line_total_minor: z.number().int().nonnegative(),
  currency: z.string().length(3),
  status: z.enum(["ready", "unavailable"]),
});
const cartSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  items: z.array(itemSchema),
  summary: z.object({
    subtotal_minor: z.number().int().nonnegative(),
    currency: z.string().length(3),
    checkout_ready: z.boolean(),
  }),
  expires_at: z.string().nullable(),
});
const orderSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  currency: z.string().length(3),
  subtotal_minor: z.number().int().nonnegative(),
  discount_minor: z.number().int().nonnegative(),
  shipping_minor: z.number().int().nonnegative(),
  total_minor: z.number().int().nonnegative(),
  reservation_expires_at: z.string().nullable(),
  created_at: z.string().nullable(),
  items: z.array(
    z.object({
      sku: z.string(),
      product_name: z.string(),
      variant_title: z.string(),
      size: z.string().nullable(),
      quantity: z.number().int().positive(),
      unit_price_minor: z.number().int().nonnegative(),
      line_total_minor: z.number().int().nonnegative(),
    }),
  ),
});

export type CommerceCart = z.infer<typeof cartSchema>;
export type CommerceOrder = z.infer<typeof orderSchema>;

async function request<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/commerce/${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const error = new Error(`Commerce request failed (${response.status})`);
    Object.assign(error, { status: response.status });
    throw error;
  }
  return schema.parse((await response.json()).data);
}

export const getCommerceCart = () => request("cart", cartSchema);
export const putCommerceCartItem = async (variantId: number, quantity: number) => {
  await getCommerceCart();
  return request(`cart/items/${variantId}`, cartSchema, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
  });
};
export const deleteCommerceCartItem = (variantId: number) =>
  request(`cart/items/${variantId}`, cartSchema, { method: "DELETE" });
export const createCommerceOrder = (addressId: number, idempotencyKey: string) =>
  request("checkout", orderSchema, {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ address_id: addressId }),
  });
export async function getCommerceOrders(): Promise<CommerceOrder[]> {
  const response = await fetch("/api/commerce/orders", {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  if (!response.ok)
    throw Object.assign(new Error("Orders unavailable"), { status: response.status });
  return z.array(orderSchema).parse((await response.json()).data);
}
