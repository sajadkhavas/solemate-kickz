import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { CATEGORIES, SHOES } from "@/data/shoes";
import { HomeImage } from "@/components/sections/HomeImage";

export function Categories() {
  return (
    <section
      data-testid="home-categories"
      aria-labelledby="home-categories-title"
      className="border-b border-border bg-surface/35 py-[var(--space-section)]"
    >
      <div className="page-container-wide">
        <div className="mb-9 grid gap-4 lg:grid-cols-[1fr_0.75fr] lg:items-end">
          <div>
            <p className="eyebrow mb-3 text-neon">CATEGORY DISCOVERY</p>
            <h2
              id="home-categories-title"
              className="font-fa text-[clamp(2rem,5vw,4.5rem)] font-black leading-tight"
            >
              بر اساس کاربرد پیدا کن
            </h2>
          </div>
          <p className="max-w-xl font-fa leading-7 text-muted-foreground lg:justify-self-end">
            دسته‌ها مستقیماً به فیلتر معتبر کاتالوگ متصل‌اند و تعداد هرکدام فقط از Dataset فعلی
            محاسبه می‌شود.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {CATEGORIES.map((category) => {
            const count = SHOES.filter((shoe) => shoe.category === category.id).length;

            return (
              <Link
                key={category.id}
                to="/products"
                search={{ category: category.id, sort: "newest" }}
                data-testid={`home-category-${category.id}`}
                data-f3-touch-target="true"
                className="group relative min-h-[300px] overflow-hidden rounded-2xl border border-border bg-surface focus-visible:outline-offset-4 sm:min-h-[340px]"
                aria-label={`مشاهده دسته ${category.fa} با ${count} مدل در داده نمایشی`}
              >
                <HomeImage
                  src={category.image}
                  alt={`نمای دسته ${category.fa}`}
                  width={720}
                  height={840}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
                  fallbackClassName="absolute inset-0 flex items-center justify-center bg-surface-elevated p-6 text-center font-fa text-sm text-muted-foreground"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-transparent"
                />
                <div className="relative flex h-full min-h-[300px] flex-col justify-end p-5 sm:min-h-[340px] sm:p-6">
                  <div className="mb-auto flex items-start justify-between gap-3">
                    <span className="rounded-full border border-white/15 bg-ink/75 px-3 py-1.5 font-fa text-xs text-white backdrop-blur">
                      {count} مدل در داده نمایشی
                    </span>
                    <span aria-hidden="true" className="text-3xl">
                      {category.icon}
                    </span>
                  </div>
                  <p className="eyebrow text-neon">
                    <bdi dir="ltr">{category.label}</bdi>
                  </p>
                  <h3 className="mt-2 font-fa text-3xl font-black leading-tight text-white">
                    {category.fa}
                  </h3>
                  <span className="mt-4 inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-white/20 bg-ink/70 px-4 font-fa text-sm text-white">
                    ورود به دسته
                    <ArrowLeft aria-hidden="true" size={16} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
