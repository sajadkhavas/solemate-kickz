import { createFileRoute, Link } from "@tanstack/react-router";
import { SearchX, Shapes } from "lucide-react";
import { useMemo, useState } from "react";

import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/button";
import { EmptyState, SearchInput } from "@/components/ui/commerce-primitives";
import { BRANDS, BRAND_LOGO_SLUGS, SHOES } from "@/data/shoes";

export const Route = createFileRoute("/brands")({
  head: () => ({
    meta: [
      { title: "برندهای Dataset — SOLE" },
      {
        name: "description",
        content: "فهرست یکتای برندهای موجود در داده نمایشی SOLE همراه با تعداد رکوردهای واقعی Dataset.",
      },
      { property: "og:title", content: "برندهای Dataset — SOLE" },
      {
        property: "og:description",
        content: "مرور برندهایی که واقعاً در Dataset نمایشی Repository حضور دارند.",
      },
    ],
  }),
  component: BrandsPage,
});

const BRAND_RECORDS = [...new Set(BRANDS)]
  .map((name) => {
    const products = SHOES.filter((shoe) => shoe.brand === name);
    return {
      name,
      count: products.length,
      sample: products[0]?.image,
      logoSlug: BRAND_LOGO_SLUGS[name],
    };
  })
  .sort((first, second) => second.count - first.count || first.name.localeCompare(second.name));

function BrandsPage() {
  const [query, setQuery] = useState("");
  const filteredBrands = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("en");
    if (!term) return BRAND_RECORDS;
    return BRAND_RECORDS.filter((brand) => brand.name.toLocaleLowerCase("en").includes(term));
  }, [query]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="outline-none">
        <section className="border-b border-border px-[var(--space-page-gutter)] py-12 md:py-16">
          <div className="mx-auto max-w-[80rem]">
            <div className="max-w-3xl">
              <div className="eyebrow mb-3 text-primary">Dataset inventory</div>
              <h1 className="font-display text-[length:var(--text-h1)] font-black leading-[1.05] tracking-tight">
                برندهای موجود در داده نمونه
              </h1>
              <p className="mt-5 max-w-2xl font-fa leading-8 text-muted-foreground">
                این صفحه فقط نام‌هایی را نمایش می‌دهد که در Dataset فعلی Repository وجود دارند.
                حضور یک نام در این فهرست به معنای همکاری، نمایندگی، موجودی تجاری یا اصالت‌سنجی
                فروشگاه نیست.
              </p>
            </div>

            <div className="mt-8 max-w-xl">
              <label htmlFor="brand-search" className="mb-2 block text-sm font-medium">
                جستجو میان برندهای Dataset
              </label>
              <SearchInput
                id="brand-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onClear={() => setQuery("")}
                clearLabel="پاک‌کردن جستجوی برند"
                placeholder="برای نمونه: Nike یا Adidas"
                autoComplete="off"
                inputMode="search"
                dir="auto"
                aria-describedby="brand-search-status"
              />
              <p
                id="brand-search-status"
                className="mt-2 text-sm text-muted-foreground"
                aria-live="polite"
              >
                {filteredBrands.length} برند از {BRAND_RECORDS.length} برند Dataset نمایش داده می‌شود.
              </p>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="brand-grid-heading"
          className="px-[var(--space-page-gutter)] py-[var(--space-section)]"
        >
          <div className="mx-auto max-w-[80rem]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="eyebrow mb-2 text-primary">Browse</div>
                <h2 id="brand-grid-heading" className="text-2xl font-bold md:text-3xl">
                  فهرست یکتای برندها
                </h2>
              </div>
              <p className="max-w-lg font-fa text-sm leading-6 text-muted-foreground">
                تعداد مدل هر کارت مستقیماً از رکوردهای فعلی <bdi dir="ltr">SHOES</bdi> محاسبه شده
                است.
              </p>
            </div>

            {BRAND_RECORDS.length === 0 ? (
              <EmptyState
                className="mt-8"
                icon={<Shapes className="size-9" />}
                title="هیچ برندی در Dataset وجود ندارد"
                description="برای نمایش این صفحه باید ابتدا داده محصول معتبر به Repository اضافه شود."
              />
            ) : filteredBrands.length === 0 ? (
              <EmptyState
                className="mt-8"
                icon={<SearchX className="size-9" />}
                title="برندی با این عبارت پیدا نشد"
                description="عبارت جستجو را کوتاه‌تر کنید یا فهرست کامل برندهای Dataset را دوباره نمایش دهید."
                action={
                  <Button type="button" variant="outline" onClick={() => setQuery("")}>
                    پاک‌کردن جستجو
                  </Button>
                }
              />
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filteredBrands.map((brand) => (
                  <BrandCard key={brand.name} brand={brand} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}

type BrandRecord = (typeof BRAND_RECORDS)[number];

function BrandCard({ brand }: { brand: BrandRecord }) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <Link
      to="/products"
      search={{ brand: brand.name } as never}
      data-brand-name={brand.name}
      data-product-count={brand.count}
      className="group relative isolate flex min-h-56 overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface p-5 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary focus-visible:outline-none motion-reduce:transform-none motion-reduce:transition-none"
      aria-label={`مشاهده ${brand.count} مدل نمونه از ${brand.name}`}
    >
      {brand.sample ? (
        <img
          src={brand.sample}
          alt=""
          width={640}
          height={640}
          loading="lazy"
          onError={(event) => event.currentTarget.remove()}
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-15 transition-opacity duration-200 group-hover:opacity-25 motion-reduce:transition-none"
        />
      ) : null}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/80 to-transparent" />

      <div className="flex w-full flex-col justify-between gap-8">
        <BrandMark name={brand.name} logoSlug={brand.logoSlug} failed={logoFailed} onFail={() => setLogoFailed(true)} />
        <div>
          <h3 dir="ltr" className="text-left font-display text-2xl font-black leading-tight">
            {brand.name}
          </h3>
          <p className="mt-2 font-fa text-sm text-muted-foreground">
            <bdi dir="ltr" className="font-mono-num text-foreground">
              {brand.count}
            </bdi>{" "}
            مدل در داده نمونه
          </p>
          <span className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-primary">
            مشاهده در کاتالوگ
          </span>
        </div>
      </div>
    </Link>
  );
}

function BrandMark({
  name,
  logoSlug,
  failed,
  onFail,
}: {
  name: string;
  logoSlug?: string;
  failed: boolean;
  onFail: () => void;
}) {
  if (logoSlug && !failed) {
    return (
      <div className="flex size-14 items-center justify-center rounded-[var(--radius-lg)] border border-border bg-background/80 p-3">
        <img
          src={`https://cdn.simpleicons.org/${logoSlug}/c8f135`}
          alt=""
          width={40}
          height={40}
          loading="lazy"
          onError={onFail}
          className="h-full w-full object-contain"
        />
        <span className="sr-only">نشان {name}</span>
      </div>
    );
  }

  return (
    <div
      dir="ltr"
      aria-label={`نشان متنی ${name}`}
      className="flex min-h-14 w-fit min-w-14 items-center justify-center rounded-[var(--radius-lg)] border border-border bg-background/80 px-3 font-display text-lg font-black text-primary"
    >
      {name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 3)}
    </div>
  );
}
