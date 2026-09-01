import { filterCatalog, type CatalogSearch } from "@/catalog/catalog-state";
import type {
  BackInStockResult,
  CatalogFacets,
  DiscoveryResult,
  DiscoveryShoe,
} from "@/catalog/discovery-types";
import type { ResponsiveShoe } from "@/catalog/responsive-media";
import { CATEGORIES, type Shoe } from "@/data/shoes";

function fixtureFacets(fixtures: Shoe[]): CatalogFacets {
  const brands = [...new Set(fixtures.map((shoe) => shoe.brand))]
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, count: fixtures.filter((shoe) => shoe.brand === value).length }));
  const categories = CATEGORIES.map((item) => ({
    value: item.id,
    label: item.fa,
    count: fixtures.filter((shoe) => shoe.category === item.id).length,
  })).filter((item) => item.count > 0);
  const sizes = [...new Set(fixtures.flatMap((shoe) => shoe.sizes))]
    .sort((a, b) => a - b)
    .map((value) => ({
      value: String(value),
      count: fixtures.filter((shoe) => shoe.sizes.includes(value)).length,
    }));

  return { brands, categories, sizes, availability: ["in_stock", "out_of_stock"] };
}

function unavailableDiscovery(): DiscoveryResult {
  return {
    products: [],
    facets: { brands: [], categories: [], sizes: [], availability: ["in_stock", "out_of_stock"] },
    recovery: null,
    total: 0,
    currentPage: 1,
    lastPage: 1,
    state: "unavailable",
  };
}

export async function discoverCatalogForRuntime(
  search: CatalogSearch,
  fixtures: Shoe[],
): Promise<DiscoveryResult> {
  if (!import.meta.env.PROD) {
    const products = filterCatalog(fixtures, search) as DiscoveryShoe[];
    return {
      products,
      facets: fixtureFacets(fixtures),
      recovery: null,
      total: products.length,
      currentPage: 1,
      lastPage: 1,
      state: "ready",
    };
  }

  if (import.meta.env.SSR) {
    const { fetchProductionDiscovery } = await import("@/catalog/p05-discovery.server");
    return fetchProductionDiscovery(search);
  }

  try {
    const params = new URLSearchParams();
    if (search.q) params.set("q", search.q);
    if (search.brand) params.set("brand", search.brand);
    if (search.category) params.set("category", search.category);
    if (search.sizes !== undefined) params.set("sizes", String(search.sizes));
    if (search.priceMax !== undefined) params.set("priceMax", String(search.priceMax));
    if (search.availability !== "all") params.set("availability", search.availability);
    if (search.quick) params.set("quick", search.quick);
    if (search.sort) params.set("sort", search.sort);
    params.set("page", String(search.page));

    const response = await fetch(`/api/catalog?${params.toString()}`, {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    if (!response.ok) return unavailableDiscovery();
    return (await response.json()) as DiscoveryResult;
  } catch {
    return unavailableDiscovery();
  }
}

async function fetchClientCatalog(): Promise<ResponsiveShoe[]> {
  try {
    const response = await fetch("/api/catalog?mode=all", {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    if (!response.ok) return [];
    const payload: unknown = await response.json();
    return Array.isArray(payload) ? (payload as ResponsiveShoe[]) : [];
  } catch {
    return [];
  }
}

export async function catalogForRuntime(fixtures: Shoe[]): Promise<Shoe[]> {
  if (!import.meta.env.PROD) return fixtures;

  if (import.meta.env.SSR) {
    const { fetchProductionCatalogP05 } = await import("@/catalog/p05-discovery.server");
    return fetchProductionCatalogP05();
  }

  return fetchClientCatalog();
}

export async function relatedCatalogForRuntime(
  shoe: DiscoveryShoe,
  catalog: Shoe[],
): Promise<Shoe[]> {
  if (!import.meta.env.PROD) {
    return catalog
      .filter(
        (candidate) =>
          candidate.id !== shoe.id &&
          (candidate.brand === shoe.brand || candidate.category === shoe.category),
      )
      .slice(0, 4);
  }

  if (!shoe.slug) return [];
  if (import.meta.env.SSR) {
    const { fetchProductionRelated } = await import("@/catalog/p05-discovery.server");
    return fetchProductionRelated(shoe.slug);
  }

  try {
    const response = await fetch(`/api/catalog?mode=related&slug=${encodeURIComponent(shoe.slug)}`, {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    if (!response.ok) return [];
    const payload: unknown = await response.json();
    return Array.isArray(payload) ? (payload as Shoe[]) : [];
  } catch {
    return [];
  }
}

export async function registerBackInStockForRuntime(input: {
  slug: string;
  variantId: number;
  email: string;
  consent: true;
}): Promise<BackInStockResult> {
  if (!import.meta.env.PROD) return { status: "unavailable" };

  try {
    const response = await fetch("/api/catalog", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ action: "back_in_stock", ...input }),
    });
    if (!response.ok && response.status !== 409 && response.status !== 422) {
      return { status: "unavailable" };
    }
    return (await response.json()) as BackInStockResult;
  } catch {
    return { status: "unavailable" };
  }
}

// P02 remains a separately auditable backend-catalog boundary even though P05 is the
// active storefront mapper. Keeping this callable avoids silently deleting the accepted contract.
export async function fetchP02CatalogContract(): Promise<ResponsiveShoe[]> {
  const { fetchProductionCatalog } = await import("@/catalog/production-catalog.server");
  return fetchProductionCatalog();
}
