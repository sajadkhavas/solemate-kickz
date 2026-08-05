import { Link } from "@tanstack/react-router";
import { ArrowLeft, Boxes, Info } from "lucide-react";

import heroShoe from "@/assets/hero-shoe.jpg";
import { ShoeViewer3D } from "@/components/ShoeViewer3D";
import { SHOES } from "@/data/shoes";

export function Hero() {
  const featured = SHOES.find((shoe) => shoe.id === 2) ?? SHOES[0];
  const featuredName = featured?.name ?? "SOLE sneaker showcase";
  const featuredBrand = featured?.brand ?? "SOLE";

  return (
    <section
      data-testid="home-hero"
      aria-labelledby="home-hero-title"
      className="relative isolate overflow-hidden border-b border-border bg-ink"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_42%,rgba(200,241,53,0.15),transparent_34%),radial-gradient(circle_at_16%_18%,rgba(143,86,200,0.12),transparent_30%)]"
      />

      <div className="page-container-wide grid min-h-[calc(100svh-4rem)] items-center gap-10 py-10 sm:py-14 lg:min-h-[720px] lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:gap-14 lg:py-16">
        <div className="relative z-10 max-w-2xl">
          <p className="eyebrow mb-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface/80 px-4 text-neon">
            <Boxes aria-hidden="true" size={16} />
            SOLE · ویترین نمایشی کفش
          </p>

          <h1
            id="home-hero-title"
            className="font-fa text-[clamp(2.5rem,7vw,6.75rem)] font-black leading-[1.08] tracking-[-0.04em] text-foreground"
          >
            مدل مناسب را پیدا کن؛
            <span className="mt-2 block text-neon">بعد استایلش کن.</span>
          </h1>

          <p className="mt-6 max-w-xl font-fa text-base leading-8 text-muted-foreground sm:text-lg">
            صفحه اصلی SOLE مسیر کوتاهی از معرفی برند تا کاتالوگ، دسته‌ها و صفحه محصول می‌سازد.
            اطلاعات تجاری و قیمت‌های فعلی برای نمایش رابط کاربری هستند.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/products"
              search={{ sort: "newest" }}
              data-testid="hero-primary-cta"
              data-f3-touch-target="true"
              className="btn-hype w-full sm:w-auto"
            >
              مشاهده کاتالوگ
              <ArrowLeft aria-hidden="true" size={18} />
            </Link>
            <Link
              to="/brands"
              data-testid="hero-secondary-cta"
              data-f3-touch-target="true"
              className="btn-ghost-neon w-full sm:w-auto"
            >
              کشف برندها
            </Link>
          </div>

          <div className="mt-8 flex max-w-xl items-start gap-3 rounded-xl border border-border bg-surface/70 p-4 text-sm text-muted-foreground">
            <Info aria-hidden="true" className="mt-1 shrink-0 text-neon" size={18} />
            <p className="font-fa leading-7">
              این نسخه یک storefront نمایشی است؛ سفارش واقعی، موجودی زنده و وعده ارسال در آن فعال
              نیست.
            </p>
          </div>
        </div>

        <div className="relative min-w-0" data-testid="hero-media">
          <div
            className="absolute inset-x-[12%] bottom-[8%] h-16 rounded-[50%] bg-black/70 blur-2xl"
            aria-hidden="true"
          />
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-surface via-ink to-surface-elevated p-3 sm:p-5">
            <ShoeViewer3D
              fallbackImage={heroShoe}
              alt={`نمای محصول نمونه ${featuredBrand} ${featuredName}`}
              priority
            />
            <div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-end justify-between gap-4 rounded-2xl border border-white/10 bg-ink/80 p-4 backdrop-blur sm:inset-x-6 sm:bottom-6">
              <div className="min-w-0">
                <p className="eyebrow text-neon">نمونه منتخب پروژه</p>
                <p className="mt-1 truncate font-display text-xl font-black sm:text-2xl">
                  <bdi dir="ltr">{featuredBrand}</bdi>
                </p>
                <p className="truncate font-display text-sm text-muted-foreground sm:text-base">
                  <bdi dir="ltr">{featuredName}</bdi>
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-border bg-surface px-3 py-2 font-fa text-xs text-muted-foreground">
                داده نمایشی
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
