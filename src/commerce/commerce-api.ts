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
const shippingQuoteSchema = z.object({
  id: z.string().uuid(),
  provider: z.string().min(1),
  service_code: z.string().min(1),
  label: z.string().min(1),
  currency: z.string().length(3),
  amount_minor: z.number().int().nonnegative(),
  eta_min_days: z.number().int().nonnegative().nullable(),
  eta_max_days: z.number().int().nonnegative().nullable(),
  expires_at: z.string().min(1),
});
const paymentSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  provider: z.string().min(1),
  status: z.enum(["initiating", "pending", "paid", "failed"]),
  currency: z.string().length(3),
  amount_minor: z.number().int().nonnegative(),
  redirect_url: z.string().url().nullable(),
  reference_id: z.string().nullable(),
  verified_at: z.string().nullable(),
});
const orderSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["awaiting_payment", "paid", "processing", "fulfilled", "cancelled", "expired"]),
  currency: z.string().length(3),
  subtotal_minor: z.number().int().nonnegative(),
  discount_minor: z.number().int().nonnegative(),
  shipping_minor: z.number().int().nonnegative(),
  shipping_provider: z.string().nullable(),
  shipping_service_code: z.string().nullable(),
  total_minor: z.number().int().nonnegative(),
  reservation_expires_at: z.string().nullable(),
  created_at: z.string().nullable(),
  payment: z
    .object({
      id: z.string().uuid(),
      provider: z.string(),
      status: z.string(),
      reference_id: z.string().nullable(),
    })
    .nullable(),
  shipment: z
    .object({
      id: z.string().uuid(),
      status: z.string(),
      tracking_number: z.string().nullable(),
    })
    .nullable(),
  return: z
    .object({
      id: z.string().uuid(),
      status: z.string(),
    })
    .nullable(),
  refunds: z.array(
    z.object({
      id: z.string().uuid(),
      status: z.string(),
      amount_minor: z.number().int().positive(),
    }),
  ),
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
const returnSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  status: z.string(),
  reason: z.string(),
  reason_text: z.string().nullable(),
  requested_at: z.string().nullable(),
  approved_at: z.string().nullable(),
  received_at: z.string().nullable(),
  closed_at: z.string().nullable(),
});
const refundSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  status: z.string(),
  amount_minor: z.number().int().positive(),
  reason: z.string(),
  provider_reference: z.string().nullable(),
  requested_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  failed_at: z.string().nullable(),
});

export type CommerceCart = z.infer<typeof cartSchema>;
export type CommerceShippingQuote = z.infer<typeof shippingQuoteSchema>;
export type CommercePayment = z.infer<typeof paymentSchema>;
export type CommerceOrder = z.infer<typeof orderSchema>;
export type CommerceReturn = z.infer<typeof returnSchema>;
export type CommerceRefund = z.infer<typeof refundSchema>;

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
    let message = `Commerce request failed (${response.status})`;
    try {
      const body = (await response.json()) as { message?: unknown };
      if (typeof body.message === "string" && body.message.trim()) message = body.message;
    } catch {
      // A structured error body is optional; status remains authoritative.
    }
    const error = new Error(message);
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
export const getCommerceShippingQuotes = (addressId: number) =>
  request("shipping/quotes", z.array(shippingQuoteSchema), {
    method: "POST",
    body: JSON.stringify({ address_id: addressId }),
  });
export const createCommerceOrder = (
  addressId: number,
  shippingQuoteId: string,
  idempotencyKey: string,
) =>
  request("checkout", orderSchema, {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ address_id: addressId, shipping_quote_id: shippingQuoteId }),
  });
export const initiateCommercePayment = (orderId: string, idempotencyKey: string) =>
  request(`orders/${orderId}/payments`, paymentSchema, {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
  });
export const verifyCommercePayment = (paymentId: string, authority: string, status: string) =>
  request(`payments/${paymentId}/verify`, paymentSchema, {
    method: "POST",
    body: JSON.stringify({ authority, status }),
  });
export const reconcileCommercePayment = (paymentId: string) =>
  request(`payments/${paymentId}/reconcile`, paymentSchema, { method: "POST" });
export const requestCommerceReturn = (orderId: string, reason: string, reasonText?: string) =>
  request(`orders/${orderId}/returns`, returnSchema, {
    method: "POST",
    body: JSON.stringify({ reason, reason_text: reasonText?.trim() || null }),
  });
export const requestCommerceRefund = (orderId: string, idempotencyKey: string, reason: string) =>
  request(`orders/${orderId}/refunds`, refundSchema, {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ reason }),
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
