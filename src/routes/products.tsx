import * as DialogPrimitive from "@radix-ui/react-dialog";
import { zodValidator } from "@tanstack/zod-adapter";
import { createFileRoute } from "@tanstack/react-router";
import { Flame, Grid3x3, LayoutList, SlidersHorizontal, Sparkles, Tag, X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  CATALOG_MAX_PRICE,
  type CatalogSearch,
  catalogSearchSchema,
  filterCatalog,
  hasCatalogFilters,
  parseSizeParam,
  serialiseSizes,
} from "@/catalog/catalog-state";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { QuickViewDialog } from "@/components/catalog/QuickViewDialog";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Navbar } from "@/components/Navbar";
import { ShoeCard } from "@/components/ShoeCard";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/button";
import { EmptyState, IconButton, SearchInput } from "@/components/ui/commerce-primitives";
import { CATEGORIES, SHOES, type Shoe } from "@/data/shoes";

export const Route = createFileRoute("/products")({
  validateSearch: zodValidator(catalogSearchSchema),
  head: () => ({
    meta: [
      { title: "کاتالوگ کفش — SOLE" },
      {
        name: "description",
        content: "مرور و فیلتر داده نمایشی محصولات SOLE بر اساس برند، دسته، سایز و قیمت.",
      },
      { property: "og:title", content: "کاتالوگ کفش — SOLE" },
    ],
    links: [{ rel: "canonical", href: "/products" }],
  }),
  component: ProductsPage,
});

const QUICK_FILTERS = [
  { id: "all" as const, label: "همه", icon: Tag },
  { id: "new" as const, label: "جدید", icon: Sparkles },
  { id: "sale" as const, label: "تخفیف‌دار", icon: Tag },
  { id: "limited" as const, label: "لیمیتد", icon: Flame },
];

function ProductsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [quickViewShoe, setQuickViewShoe] = useState<Shoe | null>(null);
  const [localQuery, setLocalQuery] = useState(search.q ?? "");

  useEffect(() => setLocalQuery(search.q ?? ""), [search.q]);

  const selectedSizes = useMemo(() => parseSizeParam(search.sizes), [search.sizes]);
  const products = useMemo(() => filterCatalog(SHOES, search), [search]);
  const activeFilters = hasCatalogFilters(search);

  const updateSearch = (patch: Partial<CatalogSearch>, options: { replace?: boolean } = {}) => {
    navigate({
      replace: options.replace,
      search: (previous) => ({ ...previous, ...patch }) as never,
    });
  };

  const clearFilters = () => {
    setLocalQuery("");
    navigate({
      search: {
        sort: search.sort,
        quick: "all",
        view: search.view,
      } as never,
    });
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateSearch({ q: localQuery.trim() || undefined });
  };

  const setSizeFilters = (sizes: number[]) => {
    updateSearch({ sizes: serialiseSizes(sizes) });
  };

  const categoryLabel = CATEGORIES.find((item) => item.id === search.category)?.fa;

  return (
    <div className="min-h-screen bg-ink text-foreground">
      <Navbar />

      <header className="relative overflow-hidden border-b border-border px-4 pb-7 pt-10 sm:px-6 sm:pt-12">
        <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(circle_at_1px_1px,#c8f135_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="relative mx-auto max-w-[1400px]">
          <p className="eyebrow text-neon">Catalog</p>
          <h1 className="mt-3 font-display text-4xl font-black uppercase leading-none sm:text-6xl lg:text-7xl">
            انتخاب <span className="text-neon">کفش</span>
          </h1>
          <p className="mt-3 max-w-2xl font-fa text-sm leading-7 text-muted-foreground sm:text-base">
            این صفحه از Dataset نمایشی پروژه استفاده می‌کند. فیلترها، مرتب‌سازی و نوع نمایش در نشانی
            صفحه ذخیره می‌شوند.
          </p>

          <form
            onSubmit={submitSearch}
            className="mt-6 grid max-w-2xl gap-2 sm:grid-cols-[1fr_auto]"
          >
            <label htmlFor="catalog-search" className="sr-only">
              جستجو در کاتالوگ
            </label>
            <SearchInput
              id="catalog-search"
              data-testid="catalog-search"
              value={localQuery}
              onChange={(event) => setLocalQuery(event.currentTarget.value)}
              onClear={() => {
                setLocalQuery("");
                updateSearch({ q: undefined });
              }}
              placeholder="برند، مدل، رنگ، شناسه یا برچسب"
              autoComplete="off"
              className="bg-surface"
            />
            <Button type="submit">جستجو</Button>
          </form>

          <div
            role="group"
            aria-label="فیلترهای سریع"
            className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1"
          >
            {QUICK_FILTERS.map((item) => {
              const Icon = item.icon;
              const active = search.quick === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => updateSearch({ quick: item.id })}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 font-fa text-sm transition-colors ${
                    active
                      ? "border-neon bg-neon font-bold text-ink"
                      : "border-border bg-surface hover:border-neon"
                  }`}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {activeFilters ? (
            <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="فیلترهای فعال">
              {search.brand ? (
                <FilterChip
                  label={`برند ${search.brand}`}
                  onRemove={() => updateSearch({ brand: undefined })}
                />
              ) : null}
              {categoryLabel ? (
                <FilterChip
                  label={categoryLabel}
                  onRemove={() => updateSearch({ category: undefined })}
                />
              ) : null}
              {search.q ? (
                <FilterChip
                  label={`جستجو: ${search.q}`}
                  onRemove={() => {
                    setLocalQuery("");
                    updateSearch({ q: undefined });
                  }}
                />
              ) : null}
              {selectedSizes.map((size) => (
                <FilterChip
                  key={size}
                  label={`سایز ${size}`}
                  onRemove={() => setSizeFilters(selectedSizes.filter((item) => item !== size))}
                />
              ))}
              {search.priceMax && search.priceMax < CATALOG_MAX_PRICE ? (
                <FilterChip
                  label={`تا ${new Intl.NumberFormat("fa-IR").format(search.priceMax)} تومان`}
                  onRemove={() => updateSearch({ priceMax: undefined })}
                />
              ) : null}
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                پاک‌کردن همه
              </Button>
            </div>
          ) : null}
        </div>
      </header>

      <section className="px-4 py-8 sm:px-6">
        <div className="mx-auto grid max-w-[1400px] gap-8 lg:grid-cols-[17.5rem_minmax(0,1fr)]">
          <aside className="hidden lg:block" aria-label="فیلتر محصولات">
            <div className="sticky top-28 rounded-2xl border border-border bg-surface p-5">
              <CatalogFilters
                brand={search.brand}
                category={search.category}
                sizes={selectedSizes}
                priceMax={search.priceMax ?? CATALOG_MAX_PRICE}
                onBrandChange={(brand) => updateSearch({ brand })}
                onCategoryChange={(category) => updateSearch({ category })}
                onSizesChange={setSizeFilters}
                onPriceMaxChange={(priceMax) =>
                  updateSearch(
                    { priceMax: priceMax === CATALOG_MAX_PRICE ? undefined : priceMax },
                    { replace: true },
                  )
                }
                onClear={clearFilters}
              />
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="lg:hidden"
                  onClick={() => setFilterDialogOpen(true)}
                  data-testid="mobile-filter-trigger"
                >
                  <SlidersHorizontal aria-hidden="true" className="size-4" />
                  فیلترها
                </Button>
                <p
                  className="font-fa text-sm text-muted-foreground"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <span className="font-mono-num text-foreground">{products.length}</span> محصول
                  نمایشی
                </p>
              </div>

              <div className="flex flex-1 items-center justify-end gap-2 sm:flex-initial">
                <div
                  role="group"
                  aria-label="نوع نمایش"
                  className="hidden rounded-full border border-border bg-surface p-1 sm:flex"
                >
                  <IconButton
                    label="نمایش شبکه‌ای"
                    size="sm"
                    variant={search.view === "grid" ? "default" : "ghost"}
                    aria-pressed={search.view === "grid"}
                    onClick={() => updateSearch({ view: "grid" })}
                    className="rounded-full"
                  >
                    <Grid3x3 aria-hidden="true" className="size-4" />
                  </IconButton>
                  <IconButton
                    label="نمایش فهرستی"
                    size="sm"
                    variant={search.view === "list" ? "default" : "ghost"}
                    aria-pressed={search.view === "list"}
                    onClick={() => updateSearch({ view: "list" })}
                    className="rounded-full"
                  >
                    <LayoutList aria-hidden="true" className="size-4" />
                  </IconButton>
                </div>

                <label htmlFor="catalog-sort" className="sr-only">
                  مرتب‌سازی محصولات
                </label>
                <select
                  id="catalog-sort"
                  data-testid="catalog-sort"
                  value={search.sort}
                  onChange={(event) =>
                    updateSearch({ sort: event.currentTarget.value as CatalogSearch["sort"] })
                  }
                  className="min-h-11 min-w-0 rounded-full border border-border bg-surface px-4 font-fa text-sm outline-none focus-visible:border-neon focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="newest">جدیدترین</option>
                  <option value="price-asc">قیمت: کم به زیاد</option>
                  <option value="price-desc">قیمت: زیاد به کم</option>
                  <option value="popular">بیشترین بازخورد داده</option>
                </select>
              </div>
            </div>

            {products.length ? (
              <div
                data-testid="catalog-results"
                className={
                  search.view === "grid"
                    ? "grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-3"
                    : "space-y-4"
                }
              >
                {products.map((shoe, index) => (
                  <ShoeCard
                    key={shoe.id}
                    shoe={shoe}
                    index={index}
                    variant={search.view}
                    onQuickView={setQuickViewShoe}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="محصولی با این فیلترها پیدا نشد"
                description="فیلترها را تغییر دهید یا همه آن‌ها را پاک کنید."
                action={
                  <Button type="button" onClick={clearFilters}>
                    نمایش همه محصولات
                  </Button>
                }
                className="min-h-72 border border-dashed border-border bg-surface"
              />
            )}
          </div>
        </div>
      </section>

      <DialogPrimitive.Root open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-overlay backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 motion-reduce:animate-none" />
          <DialogPrimitive.Content
            data-testid="mobile-filter-dialog"
            className="fixed inset-y-0 start-0 z-[var(--z-modal)] w-[min(92vw,25rem)] overflow-y-auto border-e border-border bg-surface-elevated p-5 shadow-[var(--shadow-overlay)] outline-none"
          >
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <DialogPrimitive.Title className="font-fa text-xl font-bold">
                  فیلتر محصولات
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-1 font-fa text-sm text-muted-foreground">
                  انتخاب‌ها فوراً در URL ذخیره می‌شوند.
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close asChild>
                <IconButton label="بستن فیلترها" variant="ghost">
                  <X aria-hidden="true" className="size-5" />
                </IconButton>
              </DialogPrimitive.Close>
            </div>

            <CatalogFilters
              brand={search.brand}
              category={search.category}
              sizes={selectedSizes}
              priceMax={search.priceMax ?? CATALOG_MAX_PRICE}
              onBrandChange={(brand) => updateSearch({ brand })}
              onCategoryChange={(category) => updateSearch({ category })}
              onSizesChange={setSizeFilters}
              onPriceMaxChange={(priceMax) =>
                updateSearch(
                  { priceMax: priceMax === CATALOG_MAX_PRICE ? undefined : priceMax },
                  { replace: true },
                )
              }
              onClear={clearFilters}
              onApply={() => setFilterDialogOpen(false)}
            />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <QuickViewDialog
        shoe={quickViewShoe}
        open={quickViewShoe !== null}
        onOpenChange={(open) => {
          if (!open) setQuickViewShoe(null);
        }}
      />

      <Footer />
      <MobileBottomNav />
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-neon bg-neon/10 px-3 font-fa text-xs text-foreground transition-colors hover:bg-neon hover:text-ink"
    >
      <span>{label}</span>
      <X aria-hidden="true" className="size-3.5" />
      <span className="sr-only">حذف فیلتر</span>
    </button>
  );
}
