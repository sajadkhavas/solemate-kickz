import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { BRANDS, SHOES } from "@/data/shoes";

export function BrandWall() {
  const brands = BRANDS.map((brand) => ({
    brand,
    count: SHOES.filter((shoe) => shoe.brand === brand).length,
  }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand));

  return (
    <section
      id="brands"
      data-testid="home-brands"
      aria-labelledby="home-brands-title"
      className="border-b border-border py-[var(--space-section)]"
    >
      <div className="page-container-wide">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow mb-3 text-neon">BRAND DISCOVERY</p>
            <h2
              id="home-brands-title"
              className="font-fa text-[clamp(2rem,5vw,4.5rem)] font-black leading-tight"
            >
              برندهای حاضر در Dataset
            </h2>
            <p className="mt-3 max-w-2xl font-fa leading-7 text-muted-foreground">
              لوگوی جعلی یا CDN شکننده استفاده نشده است؛ نام متنی هر برند، Fallback اصلی و قابل
              دسترس این بخش است.
            </p>
          </div>
          <Link
            to="/brands"
            className="inline-flex min-h-11 items-center gap-2 rounded-full font-fa text-sm font-bold text-neon"
            data-f3-touch-target="true"
          >
            صفحه برندها
            <ArrowLeft aria-hidden="true" size={16} />
          </Link>
        </div>

        {brands.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {brands.map(({ brand, count }, index) => (
              <Link
                key={brand}
                to="/products"
                search={{ brand, sort: "newest" }}
                data-testid={index === 0 ? "home-brand-link-first" : undefined}
                data-f3-touch-target="true"
                className="group flex min-h-28 flex-col justify-between rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-neon sm:min-h-32 sm:p-5"
                aria-label={`مشاهده ${count} مدل نمایشی برند ${brand}`}
              >
                <span className="font-display text-lg font-black leading-tight text-foreground group-hover:text-neon sm:text-xl">
                  <bdi dir="ltr">{brand}</bdi>
                </span>
                <span className="mt-5 font-fa text-xs leading-5 text-muted-foreground">
                  {count} مدل در داده نمایشی
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p
            role="status"
            className="rounded-2xl border border-border bg-surface p-8 text-center font-fa text-muted-foreground"
          >
            برند قابل نمایشی در Dataset فعلی وجود ندارد.
          </p>
        )}
      </div>
    </section>
  );
}
