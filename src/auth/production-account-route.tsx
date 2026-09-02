import { createFileRoute } from "@tanstack/react-router";

import { ProductionAccountPage, type ProductionAccountSection } from "@/auth/ProductionAccountPage";
import { ProductionOrdersPage } from "@/commerce/ProductionOrdersPage";
import { ProductionLoyaltyPage } from "@/engagement/ProductionLoyaltyPage";
import { ProductionSupportPage } from "@/postpurchase/ProductionSupportPage";

const SECTIONS = ["overview", "profile", "addresses", "orders", "support", "loyalty"] as const;
type P09AccountSection = ProductionAccountSection | "loyalty";

type AccountSearch = {
  section: P09AccountSection;
  order?: string;
};

export const Route = createFileRoute("/account")({
  validateSearch: (search: Record<string, unknown>): AccountSearch => ({
    section: SECTIONS.includes(search.section as P09AccountSection)
      ? (search.section as P09AccountSection)
      : "overview",
    order: typeof search.order === "string" && search.order.trim() ? search.order : undefined,
  }),
  head: () => ({
    meta: [
      { title: "حساب من — SOLE" },
      {
        name: "description",
        content: "پروفایل، آدرس، سفارش، پشتیبانی و امتیازهای سرورمحور حساب مشتری SOLE.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccountRouteComponent,
});

function AccountRouteComponent() {
  const { section, order } = Route.useSearch();
  if (section === "orders") return <ProductionOrdersPage orderId={order} />;
  if (section === "support") return <ProductionSupportPage />;
  if (section === "loyalty") return <ProductionLoyaltyPage />;
  return <ProductionAccountPage section={section as ProductionAccountSection} orderId={order} />;
}
