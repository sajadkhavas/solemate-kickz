import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { Shoe } from "@/data/shoes";
import type {
  ResponsiveImageSource,
  ResponsiveProductMedia,
  ResponsiveShoe,
} from "@/catalog/responsive-media";

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
  media: z.array(mediaSchema),
});

const productSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  brand: z.string().min(1),
  colorway: z.string().nullable(),
  tags: z.array(z.string()),
  published_at: z.string().nullable(),
  category: categorySchema,
  collections: z.array(z.object({ id: z.number().int().positive(), slug: z.string(), name: z.string() })),
  media: z.array(mediaSchema),
  variants: z.array(variantSchema).min(1),
});

const pageSchema = z.object({
  data: z.array(productSchema),
  links: z.object({
    next: z.string().url().nullable(),
  }),
});

type ApiProduct = z.infer<typeof productSchema>;
type ApiMedia = z.infer<typeof mediaSchema>;

function apiBaseUrl(): string | null {
  const raw = process.env.SOLE_API_URL?.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") return null;
    return url.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
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

export function mapApiProduct(product: ApiProduct): ResponsiveShoe | null {
  if (!categoryIds.includes(product.category.slug)) return null;
  if (product.variants.some((variant) => variant.currency !== "IRR")) return null;

  const variants = [...product.variants].sort((a, b) => a.price_minor - b.price_minor || a.id - b.id);
  const priceVariant = variants[0];
  if (!priceVariant) return null;

  const productMedia = mediaFor(product.media);
  const variantMedia = mediaFor(variants.flatMap((variant) => variant.media));
  const responsiveMedia = productMedia.length ? productMedia : variantMedia;
  const images = responsiveMedia.map((media) => media.src);
  const sizes = [...new Set(variants.map((variant) => Number(variant.size)).filter(Number.isFinite))].sort(
    (a, b) => a - b,
  );
  const compareAt = priceVariant.compare_at_price_minor;
  const hasDiscount = compareAt !== null && compareAt > priceVariant.price_minor;
  const tags = product.tags.map((tag) => tag.trim()).filter(Boolean);

  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    colorway: product.colorway ?? "",
    price: Math.round((hasDiscount ? compareAt : priceVariant.price_minor) / 10),
    sale_price: hasDiscount ? Math.round(priceVariant.price_minor / 10) : undefined,
    image: images[0] ?? "",
    images,
    category: product.category.slug,
    sizes,
    isNew: tags.includes("new"),
    isLimited: tags.includes("limited"),
    isSoldOut: variants.every((variant) => variant.available_quantity <= 0),
    rating: 0,
    reviews: 0,
    colors: [],
    sku: priceVariant.sku,
    tags,
    responsiveMedia,
  } satisfies ResponsiveShoe;
}

export const getProductionCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const root = apiBaseUrl();
  if (!root) return [] as ResponsiveShoe[];

  const api = root.endsWith("/api") ? root : `${root}/api`;
  const products: ResponsiveShoe[] = [];

  for (let page = 1; page <= 50; page += 1) {
    let response: Response;
    try {
      response = await fetch(`${api}/v1/catalog/products?per_page=100&page=${page}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      return [] as ResponsiveShoe[];
    }

    if (!response.ok) return [] as ResponsiveShoe[];

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return [] as ResponsiveShoe[];
    }

    const parsed = pageSchema.safeParse(payload);
    if (!parsed.success) return [] as ResponsiveShoe[];

    products.push(
      ...parsed.data.data
        .map(mapApiProduct)
        .filter((product): product is ResponsiveShoe => product !== null),
    );

    if (parsed.data.links.next === null) return products;
  }

  return [] as ResponsiveShoe[];
});

export async function catalogForRuntime(fixtures: Shoe[]): Promise<Shoe[]> {
  if (!import.meta.env.PROD) return fixtures;
  return getProductionCatalog();
}
