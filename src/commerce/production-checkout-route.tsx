import { createFileRoute } from "@tanstack/react-router";
import { ProductionCheckoutPage } from "@/commerce/ProductionCheckoutPage";
export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [{ title: "ثبت سفارش — SOLE" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: ProductionCheckoutPage,
});
