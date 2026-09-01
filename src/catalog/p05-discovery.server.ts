import { z } from "zod";

import type { CatalogSearch } from "@/catalog/catalog-state";
import type {
  BackInStockResult,
  CatalogFacets,
  DiscoveryResult,
  DiscoveryShoe,
} from "@/catalog/discovery-types";
import type { ResponsiveImageSource, ResponsiveProductMedia } from "@/catalog/responsive-media";

const categoryIds = [
  "running",
  "basketball",
  "lifestyle",
  "skateboarding",
  "trail",
  "luxury",
] as const;

const categorySchema = z.object({
  id: z.number().int().positive(),
  slug: z.enum(categoryIds),
  name: z.string().min(1),
});

const mediaSourceSchema = z.object({
  recipe: z.string().min(1),
  url: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  format: z.literal("webp"),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
});

const mediaSchema = z.object({
  asset_uuid: z.string().uuid(),
  role: z.string().min(1),
  sort_order: z.number().int().nonnegative(),
  alt_text: z.string().nullable(),
  sources: z.array(mediaSourceSchema).min(1),
});

const variantSchema = z.object({
  id: z.number().int().positive(),
  sku: z.string().min(1),
  title: z.string().min(1),
  size: z.string().nullable(),
  color: z.string().nullable(),
  price_minor: z.number().int().nonnegative(),
  compare_at_price_minor: z.number().int().nonnegative().nullable(),
  currency: z.string().length(3),
  available_quantity: z.number().int().nonnegative(),
  availability: z.enum(["in_stock", "out_of_stock"]),
  media: z.array(mediaSchema),
});

const sizeGuideSchema = z
  .object({
    source_label: z.string().min(1),
    source_url: z.string().url().nullable(),
    measurement_unit: z.literal("mm"),
    width_profile: z.enum(["narrow", "standard", "wide"]),
    verified_at: z.string().nullable(),
    entries: z.array(
      z.object({
        eu_size: z.string().min(1),
        foot_length_min_mm: z.number().int().min(180).max(340),
        foot_length_max_mm: z.number().int().min(180).max(340),
        label: z.string().nullable(),
      }),
    ),
  })
  .nullable();

const decisionSupportSchema = z.object({
  availability: z.object({
    state: z.enum(["in_stock", "out_of_stock"]),
    available_quantity: z.number().int().nonnegative(),
    available_sizes: z.array(z.string()),
  }),
  pricing: z.object({
    currency: z.string().length(3).nullable(),
    min_price_minor: z.number().int().nonnegative().nullable(),
    max_price_minor: z.number().int().nonnegative().nullable(),
  }),
  comparison: z.object({
    brand: z.string().nullable(),
    category: z.string().nullable(),
    colorway: z.string().nullable(),
    sizes: z.array(z.string()),
    variant_count: z.number().int().nonnegative(),
  }),
  social_proof: z.object({
    state: z.literal("unavailable"),
    average_rating: z.null(),
    review_count: z.literal(0),
    evidence: z.null(),
  }),
  delivery: z.object({ state: z.literal("unverified"), message: z.null() }),
  returns: z.object({ state: z.literal("unverified"), message: z.null() }),
});

const productSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  brand: z.string().min(1).nullable(),
  colorway: z.string().nullable(),
  tags: z.array(z.string()),
  published_at: z.string().nullable(),
  merchandising_priority: z.number().int(),
  category: categorySchema.nullable(),
  collections: z.array(
    z.object({ id: z.number().int().positive(), slug: z.string(), name: z.string() }),
  ),
  media: z.array(mediaSchema),
  variants: z.array(variantSchema).min(1),
  size_guide: sizeGuideSchema,
  decision_support: decisionSupportSchema,
});

const facetSchema = z.object({
  value: z.string(),
  label: z.string().optional(),
  count: z.number().int().nonnegative(),
});

const pageSchema = z.object({
  data: z.array(productSchema),
  links: z.object({ next: z.string().url().nullable() }),
  meta: z.object({
    current_page: z.number().int().positive(),
    last_page: z.number().int().positive(),
    total: z.number().int().nonnegative(),
  }),
  facets: z.object({
    brands: z.array(facetSchema),
    categories: z.array(facetSchema),
    sizes: z.array(facetSchema),
    availability: z.array(z.enum(["in_stock", "out_of_stock"])),
  }),
  recovery: z
    .object({ original_query: z.string(), suggested_query: z.string().nullable() })
    .nullable(),
});

const collectionSchema = z.object({ data: z.array(productSchema) });
const backInStockSchema = z.object({
  status: z.literal("registered"),
  notification_delivery: z.literal("deferred_to_p09"),
});

type ApiProduct = z.infer<typeof productSchema>;
type ApiMedia = z.infer<typeof mediaSchema>;

function apiRoot(): string | null {
  const raw = process.env.SOLE_API_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") return null;
    const root = url.toString().replace(/\/+$/, "");
    return root.endsWith("/api") ? root : `${root}/api`;
  } catch {
    return null;
  }
}

function endpoint(path: string): string | null {
  const root = apiRoot();
  return root ? `${root}${path}` : null;
}

function mediaFor(media: ApiMedia[]): ResponsiveProductMedia[] {
  return [...media]
    .sort((a, b) => a.sort_order - b.sort_order || a.role.localeCompare(b.role))
    .map((item) => {
      const sources: ResponsiveImageSource[] = [...item.sources]
        .sort((a, b) => a.width - b.width)
        .map((source) => ({
          url: source.url,
          width: source.width,
          height: source.height,
          format: source.format,
          sha256: source.sha256,
        }));
      const largest = sources.at(-1);
      if (!largest) return null;
      return {
        assetUuid: item.asset_uuid,
        role: item.role,
        sortOrder: item.sort_order,
        altText: item.alt_text ?? "",
        src: largest.url,
        srcSet: sources.map((source) => `${source.url} ${source.width}w`).join(", "),
        sources,
      };
    })
    .filter((item): item is ResponsiveProductMedia => item !== null);
}

function toman(minor: number | null): number | null {
  return minor === null || minor % 10 !== 0 ? null : minor / 10;
}

function mapProduct(product: ApiProduct): DiscoveryShoe | null {
  if (!product.category || !categoryIds.includes(product.category.slug)) return null;
  if (!product.brand?.trim()) return null;
  if (product.variants.some((variant) => variant.currency !== "IRR")) return null;
  if (
    product.variants.some(
      (variant) =>
        variant.price_minor % 10 !== 0 ||
        (variant.compare_at_price_minor !== null && variant.compare_at_price_minor % 10 !== 0),
    )
  ) {
    return null;
  }

  const variants = [...product.variants].sort(
    (a, b) => a.price_minor - b.price_minor || a.id - b.id,
  );
  const priceVariant = variants[0];
  if (!priceVariant) return null;
  const media = mediaFor(product.media);
  const variantMedia = mediaFor(variants.flatMap((variant) => variant.media));
  const responsiveMedia = media.length ? media : variantMedia;
  if (!responsiveMedia.length) return null;

  const images = responsiveMedia.map((item) => item.src);
  const sizes = [
    ...new Set(variants.map((variant) => Number(variant.size)).filter(Number.isFinite)),
  ].sort((a, b) => a - b);
  const compareAt = priceVariant.compare_at_price_minor;
  const hasDiscount = compareAt !== null && compareAt > priceVariant.price_minor;
  const tags = product.tags.map((tag) => tag.trim()).filter(Boolean);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand.trim(),
    colorway: product.colorway ?? "",
    price: (hasDiscount ? compareAt : priceVariant.price_minor) / 10,
    sale_price: hasDiscount ? priceVariant.price_minor / 10 : undefined,
    image: images[0],
    images,
    category: product.category.slug,
    sizes,
    isNew: tags.includes("new"),
    isLimited: tags.includes("limited"),
    isSoldOut: product.decision_support.availability.state === "out_of_stock",
    rating: 0,
    reviews: 0,
    colors: [],
    sku: priceVariant.sku,
    tags,
    responsiveMedia,
    merchandisingPriority: product.merchandising_priority,
    variants: variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      size:
        variant.size === null || !Number.isFinite(Number(variant.size))
          ? null
          : Number(variant.size),
      color: variant.color,
      price: variant.price_minor / 10,
      compareAtPrice:
        variant.compare_at_price_minor === null ? undefined : variant.compare_at_price_minor / 10,
      availableQuantity: variant.available_quantity,
      availability: variant.availability,
    })),
    decisionSupport: {
      availability: {
        state: product.decision_support.availability.state,
        availableQuantity: product.decision_support.availability.available_quantity,
        availableSizes: product.decision_support.availability.available_sizes
          .map(Number)
          .filter(Number.isFinite),
      },
      pricing: {
        currency: product.decision_support.pricing.currency === "IRR" ? "IRR" : null,
        minPrice: toman(product.decision_support.pricing.min_price_minor),
        maxPrice: toman(product.decision_support.pricing.max_price_minor),
      },
      comparison: {
        brand: product.decision_support.comparison.brand,
        category: product.decision_support.comparison.category,
        colorway: product.decision_support.comparison.colorway,
        sizes: product.decision_support.comparison.sizes.map(Number).filter(Number.isFinite),
        variantCount: product.decision_support.comparison.variant_count,
      },
      socialProof: {
        state: "unavailable",
        averageRating: null,
        reviewCount: 0,
        evidence: null,
      },
      delivery: { state: "unverified", message: null },
      returns: { state: "unverified", message: null },
    },
    sizeGuide: product.size_guide
      ? {
          sourceLabel: product.size_guide.source_label,
          sourceUrl: product.size_guide.source_url,
          verifiedAt: product.size_guide.verified_at,
          widthProfile: product.size_guide.width_profile,
          entries: product.size_guide.entries.map((entry) => ({
            euSize: entry.eu_size,
            footLengthMinMm: entry.foot_length_min_mm,
            footLengthMaxMm: entry.foot_length_max_mm,
            label: entry.label,
          })),
        }
      : undefined,
  };
}

function queryString(search: CatalogSearch): string {
  const params = new URLSearchParams();
  if (search.q) params.set("q", search.q);
  if (search.brand) params.set("brand", search.brand);
  if (search.category) params.set("category", search.category);
  if (search.sizes !== undefined) params.set("size", String(search.sizes));
  if (search.priceMax !== undefined) params.set("price_max_minor", String(search.priceMax * 10));
  if (search.availability !== "all") params.set("availability", search.availability);
  if (search.quick !== "all") params.set("quick", search.quick);
  params.set(
    "sort",
    search.sort === "price-asc"
      ? "price_asc"
      : search.sort === "price-desc"
        ? "price_desc"
        : search.sort === "popular"
          ? "merchandising"
          : "newest",
  );
  params.set("per_page", "24");
  params.set("page", String(search.page));
  return params.toString();
}

function unavailable(): DiscoveryResult {
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

export async function fetchProductionDiscovery(search: CatalogSearch): Promise<DiscoveryResult> {
  const url = endpoint(`/v1/catalog/products?${queryString(search)}`);
  if (!url) return unavailable();
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return unavailable();
    const parsed = pageSchema.safeParse(await response.json());
    if (!parsed.success) return unavailable();
    const products = parsed.data.data
      .map(mapProduct)
      .filter((item): item is DiscoveryShoe => item !== null);
    const facets: CatalogFacets = parsed.data.facets;
    return {
      products,
      facets,
      recovery: parsed.data.recovery
        ? {
            originalQuery: parsed.data.recovery.original_query,
            suggestedQuery: parsed.data.recovery.suggested_query,
          }
        : null,
      total: parsed.data.meta.total,
      currentPage: parsed.data.meta.current_page,
      lastPage: parsed.data.meta.last_page,
      state: "ready",
    };
  } catch {
    return unavailable();
  }
}

export async function fetchProductionCatalogP05(): Promise<DiscoveryShoe[]> {
  const products: DiscoveryShoe[] = [];
  for (let page = 1; page <= 50; page += 1) {
    const url = endpoint(`/v1/catalog/products?sort=newest&per_page=48&page=${page}`);
    if (!url) return [];
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return [];
      const parsed = pageSchema.safeParse(await response.json());
      if (!parsed.success) return [];
      products.push(
        ...parsed.data.data.map(mapProduct).filter((item): item is DiscoveryShoe => item !== null),
      );
      if (parsed.data.links.next === null) return products;
    } catch {
      return [];
    }
  }
  return [];
}

export async function fetchProductionRelated(slug: string): Promise<DiscoveryShoe[]> {
  const url = endpoint(`/v1/catalog/products/${encodeURIComponent(slug)}/related`);
  if (!url) return [];
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return [];
    const parsed = collectionSchema.safeParse(await response.json());
    if (!parsed.success) return [];
    return parsed.data.data.map(mapProduct).filter((item): item is DiscoveryShoe => item !== null);
  } catch {
    return [];
  }
}

export async function registerProductionBackInStock(input: {
  slug: string;
  variantId: number;
  email: string;
  consent: true;
}): Promise<BackInStockResult> {
  const url = endpoint(`/v1/catalog/products/${encodeURIComponent(input.slug)}/back-in-stock`);
  if (!url) return { status: "unavailable" };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        variant_id: input.variantId,
        email: input.email,
        consent: true,
        consent_version: "p05-v1",
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 409) return { status: "already_available" };
    if (response.status === 422) return { status: "invalid" };
    if (!response.ok) return { status: "unavailable" };
    const parsed = backInStockSchema.safeParse(await response.json());
    if (!parsed.success) return { status: "unavailable" };
    return { status: "registered", notificationDelivery: parsed.data.notification_delivery };
  } catch {
    return { status: "unavailable" };
  }
}
