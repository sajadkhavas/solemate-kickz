import { createFileRoute } from "@tanstack/react-router";

import { ProductionAccountPage, type ProductionAccountSection } from "@/auth/ProductionAccountPage";
import { ProductionOrdersPage } from "@/commerce/ProductionOrdersPage";
import { ProductionSupportPage } from "@/postpurchase/ProductionSupportPage";

const SECTIONS = ["overview", "profile", "addresses", "orders", "support"] as const;

type AccountSearch = {
  section: ProductionAccountSection;
  order?: string;
};

export const Route = createFileRoute("/account")({
  validateSearch: (search: Record<string, unknown>): AccountSearch => ({
    section: SECTIONS.includes(search.section as ProductionAccountSection)
      ? (search.section as ProductionAccountSection)
      : "overview",
    order: typeof search.order === "string" && search.order.trim() ? search.order : undefined,
  }),
  head: () => ({
    meta: [
      { title: "حساب من — SOLE" },
      {
        name: "description",
        content: "پروفایل، آدرس، سفارش، پرداخت، ارسال و کنترل‌های حریم خصوصی حساب مشتری SOLE.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccountRouteComponent,
});

function AccountRouteComponent() {
  const { section, order } = Route.useSearch();
  if (section === "orders") return <ProductionOrdersPage orderId={order} />;
  if ((section as string) === "support") return <ProductionSupportPage />;
  return <ProductionAccountPage section={section} orderId={order} />;
}
