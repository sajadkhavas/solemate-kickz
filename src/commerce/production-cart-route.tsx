import { createFileRoute } from "@tanstack/react-router";
import { ProductionCartPage } from "@/commerce/ProductionCartPage";
export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [{ title: "سبد خرید — SOLE" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: ProductionCartPage,
});
