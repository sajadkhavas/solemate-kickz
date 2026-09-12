import { Link } from "@tanstack/react-router";
import { ArrowLeft, BadgePercent, Flame, Grid3x3, Sparkles, type LucideIcon } from "lucide-react";

import { SHOES, type Shoe } from "@/data/shoes";

type QuickShopId = "new" | "sale" | "limited" | "lifestyle";

interface QuickShopPath {
  id: QuickShopId;
  label: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
  count: number;
  search:
    | {
        quick: "new" | "sale" | "limited";
        sort: "newest";
      }
    | {
        category: "lifestyle";
        sort: "newest";
      };
}

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

const PATHS: readonly QuickShopPath[] = [
  {
    id: "new",
    label: "تازه‌های ویترین",
    eyebrow: "NEW IN",
    description: "مدل‌هایی که در Dataset فعلی پروژه با وضعیت جدید ثبت شده‌اند.",
    icon: Sparkles,
    count: SHOES.filter((shoe) => shoe.isNew).length,
    search: {
      quick: "new",
      sort: "newest",
    },
  },
  {
    id: "sale",
    label: "کاهش قیمت",
    eyebrow: "PRICE DROP",
    description: "فقط محصولاتی که قیمت کاهش‌یافته در داده فعلی دارند؛ بدون تخفیف ساختگی.",
    icon: BadgePercent,
    count: SHOES.filter(hasVerifiedSale).length,
    search: {
      quick: "sale",
      sort: "newest",
    },
  },
  {
    id: "limited",
    label: "مدل‌های محدود",
    eyebrow: "LIMITED",
    description: "مدل‌هایی که در Dataset پروژه با برچسب محدود مشخص شده‌اند.",
    icon: Flame,
    count: SHOES.filter((shoe) => shoe.isLimited).length,
    search: {
      quick: "limited",
      sort: "newest",
    },
  },
  {
    id: "lifestyle",
    label: "استایل روزمره",
    eyebrow: "LIFESTYLE",
    description: "ورود مستقیم به انتخاب‌های روزمره و خیابانی موجود در کاتالوگ.",
    icon: Grid3x3,
    count: SHOES.filter((shoe) => shoe.category === "lifestyle").length,
    search: {
      category: "lifestyle",
      sort: "newest",
    },
  },
];

function formatCount(count: number): string {
  return count.toLocaleString("fa-IR");
}

export function QuickShopPaths() {
  return (
    <section
      data-testid="home-quick-shop"
      aria-labelledby="home-quick-shop-title"
      className="border-b border-border bg-surface/30 py-8 sm:py-10"
    >
      <div className="page-container-wide">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2 text-neon">SHOP FASTER</p>
            <h2 id="home-quick-shop-title" className="font-fa text-2xl font-black sm:text-3xl">
              سریع‌تر به انتخابت برس
            </h2>
          </div>
          <Link
            to="/products"
            data-f3-touch-target="true"
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-fa text-sm font-bold text-neon transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            همه مسیرها
            <ArrowLeft aria-hidden="true" size={16} />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {PATHS.map((item) => {
            const Icon = item.icon;
            const hasResults = item.count > 0;
            const formattedCount = formatCount(item.count);

            return (
              <Link
                key={item.id}
                to="/products"
                search={item.search}
                data-testid={`home-quick-shop-${item.id}`}
                data-f3-touch-target="true"
                aria-label={`${item.label}، ${formattedCount} مدل`}
                className="group relative min-h-[190px] overflow-hidden rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-neon/70 focus-visible:border-neon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:p-6"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -end-10 -top-10 size-36 rounded-full bg-neon/0 blur-3xl transition-colors duration-300 group-hover:bg-neon/10 group-focus-visible:bg-neon/10 motion-reduce:transition-none"
                />
                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-ink text-neon">
                      <Icon aria-hidden="true" size={19} />
                    </span>

                    <span className="font-fa text-sm font-bold text-muted-foreground">
                      {formattedCount} مدل
                    </span>
                  </div>

                  <div className="mt-auto pt-7">
                    <p className="eyebrow text-neon">{item.eyebrow}</p>
                    <h3 className="mt-2 font-fa text-xl font-black text-foreground transition-colors group-hover:text-neon group-focus-visible:text-neon">
                      {item.label}
                    </h3>
                    <p className="mt-2 font-fa text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                    <span
                      className={`mt-4 inline-flex min-h-11 items-center gap-2 font-fa text-sm font-bold transition-colors ${
                        hasResults
                          ? "text-foreground group-hover:text-neon group-focus-visible:text-neon"
                          : "text-muted-foreground"
                      }`}
                    >
                      {hasResults ? "مشاهده انتخاب‌ها" : "فعلاً موردی موجود نیست"}

                      {hasResults ? <ArrowLeft aria-hidden="true" size={16} /> : null}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
