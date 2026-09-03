export const ANALYTICS_POLICY_VERSION = "2026-09-03";
export const ANALYTICS_TAXONOMY_VERSION = 1;

export type AnalyticsRoute =
  | "home"
  | "catalog"
  | "product"
  | "cart"
  | "checkout"
  | "account"
  | "wishlist"
  | "orders"
  | "content"
  | "other";

export type ClientAnalyticsEvent =
  | "catalog_view"
  | "product_view"
  | "checkout_view"
  | "client_error"
  | "rum_lcp"
  | "rum_inp"
  | "rum_cls"
  | "rum_ttfb";

export type AnalyticsConsent = {
  granted: boolean;
  policy_version: string | null;
  occurred_at: string | null;
};

export function routeTemplate(pathname: string): AnalyticsRoute {
  if (pathname === "/") return "home";
  if (pathname === "/products") return "catalog";
  if (pathname.startsWith("/product/")) return "product";
  if (pathname === "/cart") return "cart";
  if (pathname === "/checkout") return "checkout";
  if (pathname === "/wishlist") return "wishlist";
  if (pathname.startsWith("/account")) return "account";
  if (pathname.startsWith("/pages/")) return "content";
  return "other";
}
