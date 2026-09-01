import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { ProductionCheckoutPage } from "@/commerce/ProductionCheckoutPage";

const paymentCallbackSchema = z.object({
  payment_attempt: z.string().uuid().optional().catch(undefined),
  Authority: z.string().max(120).optional().catch(undefined),
  Status: z.string().max(20).optional().catch(undefined),
});

export const Route = createFileRoute("/checkout")({
  validateSearch: (search) => paymentCallbackSchema.parse(search),
  head: () => ({
    meta: [{ title: "ثبت سفارش — SOLE" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: ProductionCheckoutRoute,
});

function ProductionCheckoutRoute() {
  return <ProductionCheckoutPage paymentCallback={Route.useSearch()} />;
}
