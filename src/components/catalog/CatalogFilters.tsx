import { RotateCcw } from "lucide-react";

import {
  CATALOG_MAX_PRICE,
  CATALOG_MIN_PRICE,
  CATALOG_PRICE_STEP,
  CATALOG_SIZES,
} from "@/catalog/catalog-state";
import type { CatalogFacets } from "@/catalog/discovery-types";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/data/shoes";

interface CatalogFiltersProps {
  brand?: string;
  category?: string;
  sizes: number[];
  priceMax: number;
  availability: "all" | "in_stock" | "out_of_stock";
  facets: CatalogFacets;
  total: number;
  onBrandChange: (value?: string) => void;
  onCategoryChange: (value?: string) => void;
  onSizesChange: (value: number[]) => void;
  onAvailabilityChange: (value: "all" | "in_stock" | "out_of_stock") => void;
  onPriceMaxChange: (value: number) => void;
  onClear: () => void;
  onApply?: () => void;
}

export function CatalogFilters({
  brand,
  category,
  sizes,
  priceMax,
  availability,
  facets,
  total,
  onBrandChange,
  onCategoryChange,
  onSizesChange,
  onAvailabilityChange,
  onPriceMaxChange,
  onClear,
  onApply,
}: CatalogFiltersProps) {
  const toggleSize = (size: number) => {
    onSizesChange(sizes.includes(size) ? sizes.filter((item) => item !== size) : [...sizes, size]);
  };

  return (
    <div data-testid="catalog-filters" className="space-y-7">
      <fieldset>
        <legend className="eyebrow mb-3 text-neon">برند</legend>
        <div className="max-h-64 space-y-1 overflow-y-auto pe-1">
          <button
            type="button"
            aria-pressed={!brand}
            onClick={() => onBrandChange(undefined)}
            className={`flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-sm transition-colors ${
              !brand ? "bg-neon font-bold text-ink" : "hover:bg-surface-2"
            }`}
          >
            <span className="font-fa">همه برندها</span>
            <span className="font-mono-num text-xs opacity-70">{total}</span>
          </button>
          {facets.brands.map((item) => {
            const active = brand === item.value;
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={active}
                onClick={() => onBrandChange(active ? undefined : item.value)}
                className={`flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-sm transition-colors ${
                  active ? "bg-neon font-bold text-ink" : "hover:bg-surface-2"
                }`}
              >
                <bdi dir="ltr">{item.value}</bdi>
                <span className="font-mono-num text-xs opacity-70">{item.count}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-3 text-neon">دسته‌بندی</legend>
        <div className="space-y-1">
          <button
            type="button"
            aria-pressed={!category}
            onClick={() => onCategoryChange(undefined)}
            className={`flex min-h-11 w-full items-center rounded-lg px-3 font-fa text-sm transition-colors ${
              !category ? "bg-neon font-bold text-ink" : "hover:bg-surface-2"
            }`}
          >
            همه دسته‌ها
          </button>
          {facets.categories.map((item) => {
            const fallback = CATEGORIES.find((categoryItem) => categoryItem.id === item.value);
            const active = category === item.value;
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={active}
                onClick={() => onCategoryChange(active ? undefined : item.value)}
                className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-3 font-fa text-sm transition-colors ${
                  active ? "bg-neon font-bold text-ink" : "hover:bg-surface-2"
                }`}
              >
                <span>{item.label ?? fallback?.fa ?? item.value}</span>
                <span className="font-mono-num text-xs opacity-70">{item.count}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-3 text-neon">موجودی</legend>
        <div className="grid gap-2">
          {[
            ["all", "همه محصولات"],
            ["in_stock", "فقط موجود"],
            ["out_of_stock", "فقط ناموجود"],
          ].map(([value, label]) => {
            const state = value as "all" | "in_stock" | "out_of_stock";
            const active = availability === state;
            return (
              <button
                key={state}
                type="button"
                aria-pressed={active}
                onClick={() => onAvailabilityChange(state)}
                className={`min-h-11 rounded-lg border px-3 text-start font-fa text-sm transition-colors ${
                  active
                    ? "border-neon bg-neon font-bold text-ink"
                    : "border-border bg-background hover:border-neon"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-3 text-neon">سایز</legend>
        <div className="grid grid-cols-4 gap-2">
          {CATALOG_SIZES.map((size) => {
            const active = sizes.includes(size);
            const facet = facets.sizes.find((item) => Number(item.value) === size);
            return (
              <button
                key={size}
                type="button"
                data-testid="catalog-size-filter"
                data-size={size}
                aria-label={`فیلتر سایز ${size}${facet ? `، ${facet.count} محصول` : ""}`}
                aria-pressed={active}
                onClick={() => toggleSize(size)}
                className={`min-h-11 rounded-lg border font-mono-num text-sm transition-colors ${
                  active
                    ? "border-neon bg-neon font-bold text-ink"
                    : "border-border bg-background hover:border-neon"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-3 text-neon">حداکثر قیمت</legend>
        <input
          type="range"
          aria-label="حداکثر قیمت محصولات"
          min={CATALOG_MIN_PRICE}
          max={CATALOG_MAX_PRICE}
          step={CATALOG_PRICE_STEP}
          value={priceMax}
          onChange={(event) => onPriceMaxChange(Number(event.currentTarget.value))}
          className="min-h-11 w-full accent-[var(--neon)]"
        />
        <output className="mt-1 block font-fa text-sm text-muted-foreground">
          تا{" "}
          <span className="font-mono-num">{new Intl.NumberFormat("fa-IR").format(priceMax)}</span>{" "}
          تومان
        </output>
      </fieldset>

      <div className="grid gap-2">
        {onApply ? (
          <Button type="button" data-testid="apply-mobile-filters" onClick={onApply}>
            نمایش نتایج
          </Button>
        ) : null}
        <Button type="button" variant="outline" onClick={onClear}>
          <RotateCcw aria-hidden="true" className="size-4" />
          پاک‌کردن فیلترها
        </Button>
      </div>
    </div>
  );
}
