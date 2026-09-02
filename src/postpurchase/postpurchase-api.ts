import { z } from "zod";

const trustContentSchema = z.object({
  slug: z.string(),
  kind: z.enum(["faq", "policy", "help"]),
  title: z.string(),
  body: z.string(),
  version: z.number().int().positive(),
  provenance_url: z.string().url(),
  approved_at: z.string(),
});
const supportEventSchema = z.object({
  type: z.string(),
  body: z.string().nullable(),
  at: z.string().nullable(),
});
const supportCaseSchema = z.object({
  id: z.string().uuid(),
  subject: z.string(),
  category: z.string(),
  priority: z.string(),
  status: z.string(),
  sla_due_at: z.string().nullable(),
  events: z.array(supportEventSchema),
});
const trackingSchema = z.object({
  order_id: z.string().uuid(),
  order_status: z.string(),
  shipment: z
    .object({
      status: z.string(),
      provider: z.string(),
      tracking_number: z.string().nullable(),
      shipped_at: z.string().nullable(),
      delivered_at: z.string().nullable(),
    })
    .nullable(),
  events: z.array(
    z.object({
      type: z.enum(["order", "shipment"]),
      status: z.string(),
      reason: z.string(),
      at: z.string().nullable(),
    }),
  ),
});
const communicationSchema = z.object({
  id: z.string().uuid(),
  template: z.string(),
  channel: z.string(),
  status: z.string(),
  payload: z.record(z.unknown()),
  sent_at: z.string().nullable(),
  failed_at: z.string().nullable(),
});

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
  if (!response.ok)
    throw Object.assign(new Error(`Post-purchase request failed (${response.status})`), {
      status: response.status,
    });
  return schema.parse((await response.json()).data);
}

export type TrustContent = z.infer<typeof trustContentSchema>;
export type SupportCase = z.infer<typeof supportCaseSchema>;
export type OrderTracking = z.infer<typeof trackingSchema>;
export const getTrustContent = () => request("trust/content", z.array(trustContentSchema));
export const getSupportCases = () => request("support/cases", z.array(supportCaseSchema));
export const createSupportCase = (input: {
  subject: string;
  category: string;
  message: string;
  order_id?: string;
}) => request("support/cases", supportCaseSchema, { method: "POST", body: JSON.stringify(input) });
export const addSupportMessage = (caseId: string, message: string) =>
  request(`support/cases/${caseId}/messages`, supportCaseSchema, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
export const getOrderTracking = (orderId: string) =>
  request(`orders/${orderId}/tracking`, trackingSchema);
export const getCommunications = () => request("communications", z.array(communicationSchema));
export const submitVerifiedReview = (input: {
  order_item_id: number;
  rating: number;
  title?: string;
  body: string;
}) =>
  request(
    "reviews",
    z.object({
      id: z.string().uuid(),
      status: z.literal("pending"),
      verified_purchase: z.literal(true),
    }),
    { method: "POST", body: JSON.stringify(input) },
  );
