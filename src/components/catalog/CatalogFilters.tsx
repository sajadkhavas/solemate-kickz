import { RotateCcw } from "lucide-react";

import {
  CATALOG_MAX_PRICE,
  CATALOG_MIN_PRICE,
  CATALOG_PRICE_STEP,
  CATALOG_SIZES,
} from "@/catalog/catalog-state";
import { Button } from "@/components/ui/button";
import { BRANDS, CATEGORIES, SHOES } from "@/data/shoes";

interface CatalogFiltersProps {
  brand?: string;
  category?: string;
  sizes: number[];
  priceMax: number;
  onBrandChange: (value?: string) => void;
  onCategoryChange: (value?: string) => void;
  onSizesChange: (value: number[]) => void;
  onPriceMaxChange: (value: number) => void;
  onClear: () => void;
  onApply?: () => void;
}

export function CatalogFilters({
  brand,
  category,
  sizes,
  priceMax,
  onBrandChange,
  onCategoryChange,
  onSizesChange,
  onPriceMaxChange,
  onClear,
  onApply,
}: CatalogFiltersProps) {
  const toggleSize = (size: number) => {
    onSizesChange(
      sizes.includes(size) ? sizes.filter((item) => item !== size) : [...sizes, size],
    );
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
            <span className="font-mono-num text-xs opacity-70">{SHOES.length}</span>
          </button>
          {BRANDS.map((item) => {
            const count = SHOES.filter((shoe) => shoe.brand === item).length;
            if (!count) return null;
            const active = brand === item;
            return (
              <button
                key={item}
                type="button"
                aria-pressed={active}
                onClick={() => onBrandChange(active ? undefined : item)}
                className={`flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-sm transition-colors ${
                  active ? "bg-neon font-bold text-ink" : "hover:bg-surface-2"
                }`}
              >
                <bdi dir="ltr">{item}</bdi>
                <span className="font-mono-num text-xs opacity-70">{count}</span>
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
          {CATEGORIES.map((item) => {
            const active = category === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => onCategoryChange(active ? undefined : item.id)}
                className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 font-fa text-sm transition-colors ${
                  active ? "bg-neon font-bold text-ink" : "hover:bg-surface-2"
                }`}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.fa}
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
            return (
              <button
                key={size}
                type="button"
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
          تا <span className="font-mono-num">{new Intl.NumberFormat("fa-IR").format(priceMax)}</span> تومان
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
