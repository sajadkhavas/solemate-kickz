import { fallback } from "@tanstack/zod-adapter";
import { z } from "zod";

import { normalizeSearchText } from "@/components/navigation/search-utils";
import type { Shoe } from "@/data/shoes";

export const CATALOG_MAX_PRICE = 20_000_000;
export const CATALOG_MIN_PRICE = 1_000_000;
export const CATALOG_PRICE_STEP = 500_000;
export const CATALOG_SIZES = [39, 40, 41, 42, 43, 44, 45, 46] as const;
export const CATALOG_QUERY_MAX_LENGTH = 120;
const CATALOG_FILTER_TEXT_MAX_LENGTH = 80;

export const catalogSearchSchema = z.object({
  brand: fallback(
    z.string().trim().min(1).max(CATALOG_FILTER_TEXT_MAX_LENGTH).optional(),
    undefined,
  ),
  category: fallback(
    z.string().trim().min(1).max(CATALOG_FILTER_TEXT_MAX_LENGTH).optional(),
    undefined,
  ),
  q: fallback(z.string().trim().max(CATALOG_QUERY_MAX_LENGTH).optional(), undefined),
  sort: fallback(z.enum(["newest", "price-asc", "price-desc", "popular"]), "newest").default(
    "newest",
  ),
  sizes: fallback(z.union([z.string(), z.number().int()]).optional(), undefined),
  priceMax: fallback(
    z.coerce.number().int().min(CATALOG_MIN_PRICE).max(CATALOG_MAX_PRICE).optional(),
    undefined,
  ),
  availability: fallback(z.enum(["all", "in_stock", "out_of_stock"]), "all").default("all"),
  quick: fallback(z.enum(["all", "new", "sale", "limited"]), "all").default("all"),
  view: fallback(z.enum(["grid", "list"]), "grid").default("grid"),
  page: fallback(z.coerce.number().int().min(1), 1).default(1),
});

export type CatalogSearch = z.infer<typeof catalogSearchSchema>;

export function parseSizeParam(value?: string | number): number[] {
  if (value === undefined || value === null || value === "") return [];
  return [...new Set(String(value).split(",").map(Number))]
    .filter((size) => CATALOG_SIZES.includes(size as (typeof CATALOG_SIZES)[number]))
    .sort((a, b) => a - b);
}

export function serialiseSizes(values: number[]): string | number | undefined {
  const sizes = [...new Set(values)]
    .filter((size) => CATALOG_SIZES.includes(size as (typeof CATALOG_SIZES)[number]))
    .sort((a, b) => a - b);
  if (!sizes.length) return undefined;
  return sizes.length === 1 ? sizes[0] : sizes.join(",");
}

const productPrice = (shoe: Shoe) => shoe.sale_price ?? shoe.price;

export function filterCatalog(shoes: Shoe[], search: CatalogSearch): Shoe[] {
  const selectedSizes = parseSizeParam(search.sizes);
  const maximumPrice = search.priceMax ?? CATALOG_MAX_PRICE;
  const query = normalizeSearchText(search.q ?? "");

  return shoes
    .filter((shoe) => {
      if (search.brand && shoe.brand !== search.brand) return false;
      if (search.category && shoe.category !== search.category) return false;
      if (selectedSizes.length && !selectedSizes.some((size) => shoe.sizes.includes(size))) {
        return false;
      }
      if (productPrice(shoe) > maximumPrice) return false;
      if (search.availability === "in_stock" && shoe.isSoldOut) return false;
      if (search.availability === "out_of_stock" && !shoe.isSoldOut) return false;
      if (search.quick === "new" && !shoe.isNew) return false;
      if (search.quick === "sale" && !shoe.sale_price) return false;
      if (search.quick === "limited" && !shoe.isLimited) return false;
      if (query) {
        const text = normalizeSearchText(
          [shoe.brand, shoe.name, shoe.colorway, shoe.sku, ...shoe.tags].join(" "),
        );
        if (!text.includes(query)) return false;
      }
      return true;
    })
    .sort((first, second) => {
      if (search.sort === "price-asc") return productPrice(first) - productPrice(second);
      if (search.sort === "price-desc") return productPrice(second) - productPrice(first);
      if (search.sort === "popular") {
        return second.reviews - first.reviews || second.rating - first.rating;
      }
      return Number(second.isNew) - Number(first.isNew) || second.id - first.id;
    });
}

export function hasCatalogFilters(search: CatalogSearch) {
  return Boolean(
    search.brand ||
    search.category ||
    search.q ||
    parseSizeParam(search.sizes).length ||
    (search.priceMax && search.priceMax < CATALOG_MAX_PRICE) ||
    search.availability !== "all" ||
    search.quick !== "all",
  );
}
