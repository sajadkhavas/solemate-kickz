import { Link } from "@tanstack/react-router";
import { ArrowLeft, BadgePercent, Flame, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { HomeImage } from "@/components/sections/HomeImage";
import { formatPrice, SHOES, type Shoe } from "@/data/shoes";

type MerchandisingMode = "new" | "sale" | "limited";

const MODES = [
  { id: "new" as const, label: "جدید", eyebrow: "NEW IN", icon: Sparkles },
  { id: "sale" as const, label: "کاهش قیمت", eyebrow: "PRICE DROP", icon: BadgePercent },
  { id: "limited" as const, label: "محدود", eyebrow: "LIMITED", icon: Flame },
];

function hasVerifiedSale(shoe: Shoe) {
  return (
    typeof shoe.sale_price === "number" &&
    shoe.sale_price > 0 &&
    shoe.price > 0 &&
    shoe.sale_price < shoe.price
  );
}

function discountPercent(shoe: Shoe) {
  if (!hasVerifiedSale(shoe)) return 0;
  return Math.round(((shoe.price - shoe.sale_price!) / shoe.price) * 100);
}

function productsForMode(mode: MerchandisingMode) {
  if (mode === "sale") {
    return SHOES.filter(hasVerifiedSale)
      .slice()
      .sort((a, b) => discountPercent(b) - discountPercent(a));
  }

  if (mode === "limited") return SHOES.filter((shoe) => shoe.isLimited);
  return SHOES.filter((shoe) => shoe.isNew);
}

function statusLabel(shoe: Shoe, mode: MerchandisingMode) {
  if (shoe.isSoldOut) return "ناموجود در داده فعلی";
  if (mode === "sale") return `${discountPercent(shoe)}٪ کاهش ثبت‌شده`;
  if (mode === "limited") return "برچسب محدود در داده پروژه";
  return "برچسب جدید در داده پروژه";
}

function MerchandisingCard({
  shoe,
  mode,
  featured = false,
}: {
  shoe: Shoe;
  mode: MerchandisingMode;
  featured?: boolean;
}) {
  const sale = hasVerifiedSale(shoe);
  const currentPrice = sale ? shoe.sale_price! : shoe.price;

  return (
    <article
      className={`group overflow-hidden rounded-2xl border border-border bg-surface ${
        featured ? "lg:grid lg:grid-cols-[1.15fr_0.85fr]" : ""
      }`}
    >
      <Link
        to="/product/$id"
        params={{ id: String(shoe.id) }}
        className="contents"
        aria-label={`مشاهده محصول نمونه ${shoe.brand} ${shoe.name}`}
      >
        <div
          className={`relative overflow-hidden bg-surface-elevated ${
            featured ? "aspect-[4/3] lg:aspect-auto lg:min-h-[420px]" : "aspect-square"
          }`}
        >
          <HomeImage
            src={shoe.image}
            alt={`${shoe.brand} ${shoe.name}، ${shoe.colorway}`}
            width={featured ? 960 : 640}
            height={featured ? 780 : 640}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025] motion-reduce:transition-none"
            fallbackClassName="flex h-full w-full items-center justify-center bg-surface-elevated p-6 text-center font-fa text-sm text-muted-foreground"
          />
          <div className="absolute inset-x-3 top-3 flex flex-wrap items-center justify-between gap-2 sm:inset-x-4 sm:top-4">
            <span className="rounded-full border border-white/15 bg-ink/85 px-3 py-1.5 font-fa text-xs text-white backdrop-blur">
              {statusLabel(shoe, mode)}
            </span>
            {shoe.isSoldOut ? (
              <span className="rounded-full bg-white px-3 py-1.5 font-fa text-xs font-bold text-ink">
                ناموجود
              </span>
            ) : null}
          </div>
        </div>

        <div className={`flex flex-col ${featured ? "p-6 sm:p-8 lg:p-9" : "p-4 sm:p-5"}`}>
          <p className="eyebrow text-neon">
            <bdi dir="ltr">{shoe.brand}</bdi>
          </p>
          <h3
            className={`mt-2 font-display font-black leading-tight text-foreground group-hover:text-neon ${
              featured ? "text-3xl sm:text-4xl" : "text-xl"
            }`}
          >
            <bdi dir="ltr">{shoe.name}</bdi>
          </h3>
          <p className="mt-1 font-display text-sm text-muted-foreground">
            <bdi dir="ltr">{shoe.colorway}</bdi>
          </p>

          {featured ? (
            <div className="mt-6 grid grid-cols-2 gap-3 border-y border-border py-5 font-fa text-sm text-muted-foreground">
              <div>
                <span className="block text-xs">سایزهای ثبت‌شده</span>
                <strong className="mt-1 block font-mono-num text-base text-foreground" dir="ltr">
                  {shoe.sizes.length}
                </strong>
              </div>
              <div>
                <span className="block text-xs">وضعیت</span>
                <strong className="mt-1 block text-sm text-foreground">
                  {shoe.isSoldOut ? "ناموجود" : "قابل انتخاب در دمو"}
                </strong>
              </div>
            </div>
          ) : null}

          <div
            className={`mt-auto flex items-end justify-between gap-4 ${featured ? "pt-7" : "pt-5"}`}
          >
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
            <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-3 font-fa text-sm font-bold text-foreground group-hover:border-neon group-hover:text-neon">
              جزئیات
              <ArrowLeft aria-hidden="true" size={16} />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function MerchandisingShowcase() {
  const [mode, setMode] = useState<MerchandisingMode>("new");
  const products = useMemo(() => productsForMode(mode).slice(0, 4), [mode]);
  const activeMode = MODES.find((item) => item.id === mode) ?? MODES[0];
  const ActiveIcon = activeMode.icon;

  return (
    <section
      data-testid="home-merchandising"
      aria-labelledby="home-merchandising-title"
      className="border-b border-border py-[var(--space-section)]"
    >
      <div className="page-container-wide">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end sm:mb-10">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3 text-neon">MERCHANDISING / PROJECT DATA</p>
            <h2
              id="home-merchandising-title"
              className="font-fa text-[clamp(2rem,5vw,4.5rem)] font-black leading-tight"
            >
              چند مسیر، یک کاتالوگ
            </h2>
            <p className="mt-3 max-w-xl font-fa leading-7 text-muted-foreground">
              محصول‌ها بر اساس وضعیت واقعی Dataset فعلی دوباره چیده می‌شوند؛ نه بر اساس فروش، Review
              یا محبوبیت ساختگی.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="نوع چینش محصولات صفحه اصلی"
            className="flex w-fit max-w-full gap-2 overflow-x-auto rounded-full border border-border bg-surface p-1"
          >
            {MODES.map((item) => {
              const Icon = item.icon;
              const selected = mode === item.id;

              return (
                <button
                  key={item.id}
                  id={`home-merch-tab-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="home-merch-panel"
                  data-testid={`home-merch-tab-${item.id}`}
                  data-f3-touch-target="true"
                  onClick={() => setMode(item.id)}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 font-fa text-sm transition-colors ${
                    selected
                      ? "bg-neon font-bold text-ink"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon aria-hidden="true" size={16} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          id="home-merch-panel"
          role="tabpanel"
          aria-labelledby={`home-merch-tab-${mode}`}
          data-testid="home-merch-panel"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface/60 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-neon/10 text-neon">
                <ActiveIcon aria-hidden="true" size={18} />
              </span>
              <div>
                <p className="eyebrow text-neon">{activeMode.eyebrow}</p>
                <p className="font-fa text-sm text-muted-foreground">
                  {productsForMode(mode).length} مدل مطابق این وضعیت در داده فعلی
                </p>
              </div>
            </div>
            <Link
              to="/products"
              search={{ quick: mode, sort: "newest" }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-fa text-sm font-bold text-neon"
              data-f3-touch-target="true"
            >
              مشاهده همه
              <ArrowLeft aria-hidden="true" size={16} />
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <MerchandisingCard shoe={products[0]} mode={mode} featured />
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 lg:grid-rows-3">
                {products.slice(1).map((shoe) => (
                  <div
                    key={shoe.id}
                    className="lg:[&>article]:grid lg:[&>article]:grid-cols-[170px_1fr]"
                  >
                    <MerchandisingCard shoe={shoe} mode={mode} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              role="status"
              className="rounded-2xl border border-border bg-surface p-8 text-center font-fa text-muted-foreground"
            >
              برای این وضعیت، محصول معتبری در Dataset فعلی وجود ندارد.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
