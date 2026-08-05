import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import hypeImage from "@/assets/hype-1.jpg";
import { HomeImage } from "@/components/sections/HomeImage";
import { SHOES, formatPrice } from "@/data/shoes";

export function HypeSection() {
  const highlighted = SHOES.find((shoe) => shoe.id === 3);

  return (
    <section
      data-testid="home-editorial"
      aria-labelledby="home-editorial-title"
      className="border-b border-border bg-gradient-to-br from-ink via-surface/45 to-ink py-[var(--space-section)]"
    >
      <div className="page-container-wide grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
        <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] border border-border bg-surface sm:min-h-[480px]">
          <HomeImage
            src={highlighted?.image ?? hypeImage}
            alt={
              highlighted
                ? `تصویر محصول نمونه ${highlighted.brand} ${highlighted.name}`
                : "تصویر Editorial کفش SOLE"
            }
            width={900}
            height={900}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
            fallbackClassName="absolute inset-0 flex items-center justify-center bg-surface-elevated p-8 text-center font-fa text-sm text-muted-foreground"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent"
          />
          {highlighted ? (
            <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-ink/80 p-4 backdrop-blur sm:inset-x-6 sm:bottom-6 sm:p-5">
              <p className="eyebrow text-neon">نمونه منتخب از داده پروژه</p>
              <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-display text-2xl font-black">
                    <bdi dir="ltr">
                      {highlighted.brand} {highlighted.name}
                    </bdi>
                  </p>
                  <p className="font-display text-sm text-muted-foreground">
                    <bdi dir="ltr">{highlighted.colorway}</bdi>
                  </p>
                </div>
                <div className="text-end">
                  <p className="font-mono-num text-sm font-bold" dir="ltr">
                    {formatPrice(highlighted.sale_price ?? highlighted.price)}
                  </p>
                  <p className="font-fa text-[0.7rem] text-muted-foreground">قیمت نمایشی</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="max-w-2xl">
          <p className="eyebrow mb-4 text-neon-orange">SOLE / EDITORIAL</p>
          <h2
            id="home-editorial-title"
            className="font-fa text-[clamp(2.25rem,6vw,5.75rem)] font-black leading-[1.08] tracking-[-0.035em]"
          >
            از عملکرد تا استایل روزمره
          </h2>
          <p className="mt-6 font-fa text-lg leading-9 text-muted-foreground">
            یک انتخاب خوب از نیاز واقعی شروع می‌شود: دویدن، بسکتبال، خیابان یا استفاده روزمره. SOLE
            این مسیرها را بدون شلوغی بصری کنار هم قرار می‌دهد تا محصول، نه افکت، نقطه شروع تصمیم
            باشد.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/products"
              search={{ category: "lifestyle", sort: "newest" }}
              className="btn-hype w-full sm:w-auto"
              data-testid="home-editorial-cta"
              data-f3-touch-target="true"
            >
              کشف Lifestyle
              <ArrowLeft aria-hidden="true" size={17} />
            </Link>
            <Link
              to="/about"
              className="btn-ghost-neon w-full sm:w-auto"
              data-f3-touch-target="true"
            >
              درباره SOLE
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
