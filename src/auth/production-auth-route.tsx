import { createFileRoute } from "@tanstack/react-router";

import { ProductionAuthPage } from "@/auth/ProductionAuthPage";

type AuthSearch = { complete?: "phone" };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    complete: search.complete === "phone" ? "phone" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "ورود امن — SOLE" },
      { name: "description", content: "ورود امن مشتری SOLE با Google و تکمیل شماره همراه." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthRouteComponent,
});

function AuthRouteComponent() {
  const search = Route.useSearch() as AuthSearch;
  return <ProductionAuthPage completePhone={search.complete === "phone"} />;
}
