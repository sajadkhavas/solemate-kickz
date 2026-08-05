import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef } from "react";

import { formatPrice, SHOES, type Shoe } from "@/data/shoes";
import { HomeImage } from "@/components/sections/HomeImage";

const FEATURED_IDS = [2, 3, 16, 22] as const;

function hasVerifiedSale(shoe: Shoe) {
  return (
    typeof shoe.sale_price === "number" &&
    shoe.sale_price > 0 &&
    shoe.price > 0 &&
    shoe.sale_price < shoe.price
  );
}

function FeaturedCard({ shoe, index }: { shoe: Shoe; index: number }) {
  const sale = hasVerifiedSale(shoe);
  const currentPrice = sale ? shoe.sale_price! : shoe.price;

  return (
    <article
      className="min-w-[82%] snap-start overflow-hidden rounded-2xl border border-border bg-surface sm:min-w-[47%] lg:min-w-0"
      data-testid={index === 0 ? "home-featured-card-first" : undefined}
    >
      <Link
        to="/product/$id"
        params={{ id: String(shoe.id) }}
        className="group block h-full rounded-2xl"
        aria-label={`مشاهده محصول نمونه ${shoe.brand} ${shoe.name}`}
        data-f3-touch-target="true"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-elevated">
          <HomeImage
            src={shoe.image}
            alt={`${shoe.brand} ${shoe.name}، ${shoe.colorway}`}
            width={720}
            height={540}
            loading="lazy"
            decoding="async"
            data-testid={index === 0 ? "home-product-image" : undefined}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
            fallbackClassName="flex h-full w-full items-center justify-center bg-surface-elevated p-6 text-center font-fa text-sm text-muted-foreground"
          />
          <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
            <span className="rounded-full border border-white/15 bg-ink/85 px-3 py-1.5 font-fa text-xs text-white backdrop-blur">
              محصول نمونه
            </span>
            {sale ? (
              <span className="rounded-full bg-sale px-3 py-1.5 font-fa text-xs font-bold text-ink">
                قیمت کاهش‌یافته در داده پروژه
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex min-h-[176px] flex-col p-4 sm:p-5">
          <p className="eyebrow text-neon">
            <bdi dir="ltr">{shoe.brand}</bdi>
          </p>
          <h3 className="mt-2 font-display text-xl font-black leading-tight text-foreground group-hover:text-neon">
            <bdi dir="ltr">{shoe.name}</bdi>
          </h3>
          <p className="mt-1 font-display text-sm text-muted-foreground">
            <bdi dir="ltr">{shoe.colorway}</bdi>
          </p>

          <div className="mt-auto flex items-end justify-between gap-4 pt-5">
            <div>
              <p className="font-mono-num text-base font-bold text-foreground" dir="ltr">
                {formatPrice(currentPrice)}
              </p>
              {sale ? (
                <p className="font-mono-num text-xs text-muted-foreground line-through" dir="ltr">
                  {formatPrice(shoe.price)}
                </p>
              ) : null}
              <p className="mt-1 font-fa text-[0.7rem] text-muted-foreground">قیمت نمایشی</p>
            </div>
            <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-3 font-fa text-sm text-foreground group-hover:border-neon">
              جزئیات
              <ArrowLeft aria-hidden="true" size={16} />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function FeaturedDrops() {
  const railRef = useRef<HTMLDivElement | null>(null);
  const featured = FEATURED_IDS.map((id) => SHOES.find((shoe) => shoe.id === id)).filter(
    (shoe): shoe is Shoe => Boolean(shoe),
  );

  const scrollRail = (direction: "next" | "previous") => {
    const rail = railRef.current;
    if (!rail) return;
    const amount = Math.max(rail.clientWidth * 0.78, 260);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollBy({
      left: direction === "next" ? -amount : amount,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <section
      data-testid="home-featured"
      aria-labelledby="home-featured-title"
      className="border-b border-border py-[var(--space-section)]"
    >
      <div className="page-container-wide">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5 sm:mb-10">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3 text-neon">FEATURED / PROJECT DATA</p>
            <h2
              id="home-featured-title"
              className="font-fa text-[clamp(2rem,5vw,4.5rem)] font-black leading-tight"
            >
              منتخب‌های ویترین
            </h2>
            <p className="mt-3 max-w-xl font-fa leading-7 text-muted-foreground">
              چهار محصولی که تصویر پایدار و محلی در Repository دارند؛ بدون امتیاز، Review یا ادعای
              محبوبیت ساختگی.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollRail("previous")}
              aria-label="حرکت به محصولات قبلی"
              aria-controls="home-featured-rail"
              data-f3-touch-target="true"
              className="grid size-11 place-items-center rounded-full border border-border bg-surface hover:border-neon"
            >
              <ArrowRight aria-hidden="true" size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollRail("next")}
              aria-label="حرکت به محصولات بعدی"
              aria-controls="home-featured-rail"
              data-f3-touch-target="true"
              className="grid size-11 place-items-center rounded-full border border-border bg-surface hover:border-neon"
            >
              <ArrowLeft aria-hidden="true" size={18} />
            </button>
            <Link
              to="/products"
              search={{ sort: "newest" }}
              className="ms-1 hidden min-h-11 items-center gap-2 rounded-full px-3 font-fa text-sm font-bold text-neon sm:inline-flex"
              data-f3-touch-target="true"
            >
              همه محصولات
              <ArrowLeft aria-hidden="true" size={16} />
            </Link>
          </div>
        </div>

        {featured.length > 0 ? (
          <div
            ref={railRef}
            id="home-featured-rail"
            data-testid="home-product-rail"
            role="region"
            aria-label="محصولات منتخب SOLE"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                scrollRail("next");
              }
              if (event.key === "ArrowRight") {
                event.preventDefault();
                scrollRail("previous");
              }
            }}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4 [scrollbar-color:var(--color-border)_transparent] [scrollbar-width:thin] lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0"
          >
            {featured.map((shoe, index) => (
              <FeaturedCard key={shoe.id} shoe={shoe} index={index} />
            ))}
          </div>
        ) : (
          <div
            role="status"
            data-testid="home-featured-empty"
            className="rounded-2xl border border-border bg-surface p-8 text-center font-fa text-muted-foreground"
          >
            در حال حاضر محصول معتبری برای این بخش در داده پروژه وجود ندارد.
          </div>
        )}

        <Link
          to="/products"
          search={{ sort: "newest" }}
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full font-fa text-sm font-bold text-neon sm:hidden"
          data-f3-touch-target="true"
        >
          مشاهده همه محصولات
          <ArrowLeft aria-hidden="true" size={16} />
        </Link>
      </div>
    </section>
  );
}
