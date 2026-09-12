import { Link } from "@tanstack/react-router";
import { ArrowLeft, BadgePercent, Flame, Sparkles, type LucideIcon } from "lucide-react";
import { useMemo, useRef, useState, type KeyboardEvent } from "react";

import { HomeImage } from "@/components/sections/HomeImage";
import { formatPrice, SHOES, type Shoe } from "@/data/shoes";

type MerchandisingMode = "new" | "sale" | "limited";

interface MerchandisingModeConfig {
  id: MerchandisingMode;
  label: string;
  eyebrow: string;
  icon: LucideIcon;
}

interface MerchandisingCardProps {
  shoe: Shoe;
  mode: MerchandisingMode;
  featured?: boolean;
  compact?: boolean;
}

const MODES: readonly MerchandisingModeConfig[] = [
  {
    id: "new",
    label: "جدید",
    eyebrow: "NEW IN",
    icon: Sparkles,
  },
  {
    id: "sale",
    label: "کاهش قیمت",
    eyebrow: "PRICE DROP",
    icon: BadgePercent,
  },
  {
    id: "limited",
    label: "محدود",
    eyebrow: "LIMITED",
    icon: Flame,
  },
];

function hasVerifiedSale(shoe: Shoe): boolean {
  return (
    typeof shoe.sale_price === "number" &&
    Number.isFinite(shoe.sale_price) &&
    Number.isFinite(shoe.price) &&
    shoe.sale_price > 0 &&
    shoe.price > 0 &&
    shoe.sale_price < shoe.price
  );
}

function discountPercent(shoe: Shoe): number {
  if (!hasVerifiedSale(shoe)) {
    return 0;
  }

  return Math.round(((shoe.price - shoe.sale_price!) / shoe.price) * 100);
}

function productsForMode(mode: MerchandisingMode): Shoe[] {
  switch (mode) {
    case "sale":
      return SHOES.filter(hasVerifiedSale)
        .slice()
        .sort((a, b) => discountPercent(b) - discountPercent(a));

    case "limited":
      return SHOES.filter((shoe) => shoe.isLimited);

    case "new":
    default:
      return SHOES.filter((shoe) => shoe.isNew);
  }
}

function statusLabel(shoe: Shoe, mode: MerchandisingMode): string {
  if (shoe.isSoldOut) {
    return "ناموجود در داده فعلی";
  }

  if (mode === "sale") {
    return `${discountPercent(shoe).toLocaleString("fa-IR")}٪ کاهش ثبت‌شده`;
  }

  if (mode === "limited") {
    return "برچسب محدود در داده پروژه";
  }

  return "برچسب جدید در داده پروژه";
}

function MerchandisingCard({
  shoe,
  mode,
  featured = false,
  compact = false,
}: MerchandisingCardProps) {
  const sale = hasVerifiedSale(shoe);
  const currentPrice = sale ? shoe.sale_price! : shoe.price;

  const linkLayout = featured
    ? "lg:grid lg:grid-cols-[1.15fr_minmax(0,0.85fr)]"
    : compact
      ? "lg:grid lg:grid-cols-[170px_minmax(0,1fr)]"
      : "";

  const imageLayout = featured
    ? "aspect-[4/3] lg:aspect-auto lg:min-h-[420px]"
    : compact
      ? "aspect-square lg:aspect-auto lg:h-full lg:min-h-[150px]"
      : "aspect-square";

  const contentPadding = featured
    ? "p-6 sm:p-8 lg:p-9"
    : compact
      ? "p-4 sm:p-5 lg:p-4"
      : "p-4 sm:p-5";

  return (
    <article className="group h-full overflow-hidden rounded-2xl border border-border bg-surface">
      <Link
        to="/product/$id"
        params={{ id: String(shoe.id) }}
        aria-label={`مشاهده محصول نمونه ${shoe.brand} ${shoe.name}`}
        data-f3-touch-target="true"
        className={`block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${linkLayout}`}
      >
        <div className={`relative min-w-0 overflow-hidden bg-surface-elevated ${imageLayout}`}>
          <HomeImage
            src={shoe.image}
            alt={`${shoe.brand} ${shoe.name}، ${shoe.colorway}`}
            width={featured ? 960 : 640}
            height={featured ? 780 : 640}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025] group-focus-visible:scale-[1.025] motion-reduce:transition-none"
            fallbackClassName="flex h-full w-full items-center justify-center bg-surface-elevated p-6 text-center font-fa text-sm text-muted-foreground"
          />

          <div className="absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
            <span className="rounded-full border border-white/15 bg-ink/85 px-3 py-1.5 font-fa text-xs text-white backdrop-blur">
              {statusLabel(shoe, mode)}
            </span>
          </div>
        </div>

        <div className={`flex min-w-0 flex-col ${contentPadding}`}>
          <p className="eyebrow text-neon">
            <bdi dir="ltr">{shoe.brand}</bdi>
          </p>

          <h3
            className={`mt-2 font-display font-black leading-tight text-foreground transition-colors group-hover:text-neon group-focus-visible:text-neon ${
              featured ? "text-3xl sm:text-4xl" : compact ? "text-lg sm:text-xl" : "text-xl"
            }`}
          >
            <bdi dir="ltr">{shoe.name}</bdi>
          </h3>

          <p className="mt-1 truncate font-display text-sm text-muted-foreground">
            <bdi dir="ltr">{shoe.colorway}</bdi>
          </p>

          {featured ? (
            <div className="mt-6 grid grid-cols-2 gap-3 border-y border-border py-5 font-fa text-sm text-muted-foreground">
              <div>
                <span className="block text-xs">سایزهای ثبت‌شده</span>

                <strong className="mt-1 block font-mono-num text-base text-foreground">
                  {shoe.sizes.length.toLocaleString("fa-IR")}
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
            className={`mt-auto flex items-end justify-between gap-3 ${featured ? "pt-7" : "pt-5"}`}
          >
            <div className="min-w-0">
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

            <span className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-border px-3 font-fa text-sm font-bold text-foreground transition-colors group-hover:border-neon group-hover:text-neon group-focus-visible:border-neon group-focus-visible:text-neon">
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

  const tabRefs = useRef<Partial<Record<MerchandisingMode, HTMLButtonElement | null>>>({});

  const modeProducts = useMemo(() => productsForMode(mode), [mode]);

  const products = modeProducts.slice(0, 4);

  const activeMode = MODES.find((item) => item.id === mode) ?? MODES[0];

  const ActiveIcon = activeMode.icon;

  const selectMode = (nextMode: MerchandisingMode, focusTab = false): void => {
    setMode(nextMode);

    if (focusTab && typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        tabRefs.current[nextMode]?.focus();
      });
    }
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentMode: MerchandisingMode,
  ): void => {
    const currentIndex = MODES.findIndex((item) => item.id === currentMode);

    if (currentIndex < 0) {
      return;
    }

    let nextIndex: number;

    switch (event.key) {
      case "ArrowLeft":
        nextIndex = (currentIndex + 1) % MODES.length;
        break;

      case "ArrowRight":
        nextIndex = (currentIndex - 1 + MODES.length) % MODES.length;
        break;

      case "Home":
        nextIndex = 0;
        break;

      case "End":
        nextIndex = MODES.length - 1;
        break;

      default:
        return;
    }

    event.preventDefault();

    const nextMode = MODES[nextIndex];

    if (!nextMode) {
      return;
    }

    selectMode(nextMode.id, true);
  };

  return (
    <section
      data-testid="home-merchandising"
      aria-labelledby="home-merchandising-title"
      className="border-b border-border py-[var(--space-section)]"
    >
      <div className="page-container-wide">
        <div className="mb-8 grid gap-6 sm:mb-10 lg:grid-cols-[1fr_auto] lg:items-end">
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
            aria-orientation="horizontal"
            className="flex w-fit max-w-full gap-2 overflow-x-auto rounded-full border border-border bg-surface p-1"
          >
            {MODES.map((item) => {
              const Icon = item.icon;
              const selected = mode === item.id;

              return (
                <button
                  key={item.id}
                  ref={(element) => {
                    tabRefs.current[item.id] = element;
                  }}
                  id={`home-merch-tab-${item.id}`}
                  type="button"
                  role="tab"
                  tabIndex={selected ? 0 : -1}
                  aria-selected={selected}
                  aria-controls="home-merch-panel"
                  data-testid={`home-merch-tab-${item.id}`}
                  data-f3-touch-target="true"
                  onClick={() => selectMode(item.id)}
                  onKeyDown={(event) => handleTabKeyDown(event, item.id)}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 font-fa text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon ${
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
          tabIndex={0}
          aria-labelledby={`home-merch-tab-${mode}`}
          data-testid="home-merch-panel"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface/60 px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-neon/10 text-neon">
                <ActiveIcon aria-hidden="true" size={18} />
              </span>

              <div className="min-w-0">
                <p className="eyebrow text-neon">{activeMode.eyebrow}</p>

                <p className="font-fa text-sm text-muted-foreground">
                  {modeProducts.length.toLocaleString("fa-IR")} مدل مطابق این وضعیت در داده فعلی
                </p>
              </div>
            </div>

            <Link
              to="/products"
              search={{
                quick: mode,
                sort: "newest",
              }}
              data-f3-touch-target="true"
              className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-fa text-sm font-bold text-neon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon"
            >
              مشاهده همه
              <ArrowLeft aria-hidden="true" size={16} />
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <MerchandisingCard shoe={products[0]} mode={mode} featured />

              {products.length > 1 ? (
                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 lg:grid-rows-3">
                  {products.slice(1).map((shoe) => (
                    <MerchandisingCard key={shoe.id} shoe={shoe} mode={mode} compact />
                  ))}
                </div>
              ) : null}
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
