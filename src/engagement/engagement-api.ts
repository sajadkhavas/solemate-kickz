import { z } from "zod";

const wishlistItemSchema = z.object({
  id: z.number().int().positive(),
  variant_id: z.number().int().positive(),
  product_id: z.number().int().positive(),
  product_slug: z.string().nullable(),
  product_name: z.string().nullable(),
  variant_title: z.string().nullable(),
  size: z.string().nullable(),
  color: z.string().nullable(),
  price_minor: z.number().int().nonnegative(),
  currency: z.string(),
  available_quantity: z.number().int().nonnegative(),
  added_at: z.string().nullable(),
});

const preferenceSchema = z.object({
  channel: z.enum(["email", "sms", "push"]),
  enabled: z.boolean(),
  daily_cap: z.number().int().min(1).max(20),
  quiet_start: z.string().nullable(),
  quiet_end: z.string().nullable(),
  timezone: z.string(),
});

const deliveryAttemptSchema = z.object({
  channel: z.string(),
  status: z.string(),
  reason: z.string(),
  provider: z.string().nullable(),
  attempted_at: z.string().nullable(),
});

const notificationSignalSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  status: z.string(),
  facts: z.record(z.unknown()),
  created_at: z.string().nullable(),
  delivery_attempts: z.array(deliveryAttemptSchema),
});

const loyaltyEntrySchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["earn", "redeem", "release", "expire"]),
  points_delta: z.number().int(),
  reason: z.string(),
  available_at: z.string().nullable(),
  expires_at: z.string().nullable(),
  created_at: z.string().nullable(),
});

const loyaltySchema = z.object({
  balance: z.number().int(),
  history: z.array(loyaltyEntrySchema),
  terms: z.object({
    cash_value: z.literal(false),
    server_authoritative: z.literal(true),
    earning_rate_published: z.literal(false),
  }),
});

const wishlistMigrationSchema = z.object({
  data: z.array(wishlistItemSchema),
  accepted_variant_ids: z.array(z.number().int().positive()),
});

export class EngagementApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "EngagementApiError";
  }
}

async function fetchEngagement(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(`/api/engagement/${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    throw new EngagementApiError(`Engagement request failed (${response.status})`, response.status);
  }
  return response;
}

async function request<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const response = await fetchEngagement(path, init);
  const payload = await response.json();
  return schema.parse(payload.data);
}

async function requestVoid(path: string, init: RequestInit): Promise<void> {
  await fetchEngagement(path, init);
}

export type WishlistItem = z.infer<typeof wishlistItemSchema>;
export type NotificationPreference = z.infer<typeof preferenceSchema>;
export type NotificationSignal = z.infer<typeof notificationSignalSchema>;
export type LoyaltySnapshot = z.infer<typeof loyaltySchema>;
export type NotificationChannel = NotificationPreference["channel"];

export const getWishlist = () => request("wishlist", z.array(wishlistItemSchema));
export const addWishlistVariant = (variantId: number) =>
  request(`wishlist/${variantId}`, z.array(wishlistItemSchema), { method: "PUT" });
export const removeWishlistVariant = (variantId: number) =>
  requestVoid(`wishlist/${variantId}`, { method: "DELETE" });
export async function migrateWishlistVariants(variantIds: number[]) {
  const response = await fetchEngagement("wishlist/migrate", {
    method: "POST",
    body: JSON.stringify({ variant_ids: variantIds }),
  });
  return wishlistMigrationSchema.parse(await response.json());
}
export const getNotificationPreferences = () =>
  request("notification-preferences", z.array(preferenceSchema));
export const updateNotificationPreference = (
  channel: NotificationChannel,
  input: Pick<
    NotificationPreference,
    "enabled" | "daily_cap" | "quiet_start" | "quiet_end" | "timezone"
  >,
) =>
  request(`notification-preferences/${channel}`, preferenceSchema, {
    method: "PUT",
    body: JSON.stringify(input),
  });
export const unsubscribeNotificationChannel = (channel: NotificationChannel) =>
  request(`notification-preferences/${channel}`, preferenceSchema, { method: "DELETE" });
export const getNotificationSignals = () =>
  request("notification-signals", z.array(notificationSignalSchema));
export const getLoyalty = () => request("loyalty", loyaltySchema);
