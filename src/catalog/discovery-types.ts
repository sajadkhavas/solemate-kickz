import type { ResponsiveShoe } from "@/catalog/responsive-media";

export type CatalogFacetValue = {
  value: string;
  label?: string;
  count: number;
};

export type CatalogFacets = {
  brands: CatalogFacetValue[];
  categories: CatalogFacetValue[];
  sizes: CatalogFacetValue[];
  availability: Array<"in_stock" | "out_of_stock">;
};

export type DiscoveryVariant = {
  id: number;
  sku: string;
  size: number | null;
  color: string | null;
  price: number;
  compareAtPrice?: number;
  availableQuantity: number;
  availability: "in_stock" | "out_of_stock";
};

export type DecisionSupport = {
  availability: {
    state: "in_stock" | "out_of_stock";
    availableQuantity: number;
    availableSizes: number[];
  };
  pricing: {
    currency: "IRR" | null;
    minPrice: number | null;
    maxPrice: number | null;
  };
  comparison: {
    brand: string | null;
    category: string | null;
    colorway: string | null;
    sizes: number[];
    variantCount: number;
  };
  socialProof: {
    state: "unavailable";
    averageRating: null;
    reviewCount: 0;
    evidence: null;
  };
  delivery: {
    state: "unverified";
    message: null;
  };
  returns: {
    state: "unverified";
    message: null;
  };
};

export type DiscoveryShoe = ResponsiveShoe & {
  slug?: string;
  merchandisingPriority?: number;
  variants?: DiscoveryVariant[];
  decisionSupport?: DecisionSupport;
};

export type DiscoveryResult = {
  products: DiscoveryShoe[];
  facets: CatalogFacets;
  recovery: {
    originalQuery: string;
    suggestedQuery: string | null;
  } | null;
  total: number;
  currentPage: number;
  lastPage: number;
  state: "ready" | "unavailable";
};

export type BackInStockResult =
  | { status: "registered"; notificationDelivery: "deferred_to_p09" }
  | { status: "already_available" }
  | { status: "invalid" }
  | { status: "unavailable" };
