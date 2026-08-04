import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Footer } from "@/components/sections/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Navbar } from "@/components/Navbar";
import { BRANDS, BRAND_LOGO_SLUGS, SHOES } from "@/data/shoes";

export const Route = createFileRoute("/brands")({
  head: () => ({
    meta: [
      { title: "برندهای نمونه — SOLE" },
      {
        name: "description",
        content: "مرور برندها و محصولات موجود در داده نمایشی فرانت‌اند SOLE.",
      },
      { property: "og:title", content: "برندهای نمونه — SOLE" },
      {
        property: "og:description",
        content: "برندهای موجود در داده نمایشی فرانت‌اند SOLE.",
      },
    ],
  }),
  component: BrandsPage,
});

function BrandsPage() {
  const [query, setQuery] = useState("");
  const list = useMemo(() => {
    const term = query.trim().toLowerCase();
    return BRANDS.map((brand) => ({
      name: brand,
      count: SHOES.filter((shoe) => shoe.brand === brand).length,
      slug: BRAND_LOGO_SLUGS[brand],
      sample: SHOES.find((shoe) => shoe.brand === brand)?.image,
    }))
      .filter((brand) => !term || brand.name.toLowerCase().includes(term))
      .sort((first, second) => second.count - first.count);
  }, [query]);

  const featured = list.slice(0, 4);
  const rest = list.slice(4);

  return (
    <div className="min-h-screen bg-ink text-foreground">
      <Navbar />

      <main className="outline-none">
        <section className="relative overflow-hidden border-b border-border px-6 pb-10 pt-12">
          <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,#c8f135_1px,transparent_0)] [background-size:24px_24px]" />
          <div className="relative mx-auto max-w-[1400px]">
            <div className="eyebrow mb-3 text-neon">Demo dataset</div>
            <h1 className="font-display text-5xl font-black uppercase leading-none md:text-7xl">
              برندهای <span className="text-neon">نمونه</span>
            </h1>
            <p className="mt-3 max-w-xl font-fa text-muted-foreground">
              این فهرست فقط برندهای موجود در Dataset نمایشی پروژه را نشان می‌دهد و موجودی یا همکاری
              تجاری واقعی را اثبات نمی‌کند.
            </p>

            <label className="mt-6 flex min-h-11 max-w-md items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 focus-within:border-neon">
              <Search aria-hidden="true" size={16} className="text-muted-foreground" />
              <span className="sr-only">جستجوی برند نمونه</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="جستجوی برند نمونه..."
                className="min-w-0 flex-1 bg-transparent font-fa text-sm outline-none"
              />
            </label>
          </div>
        </section>

        {featured.length > 0 ? (
          <section aria-labelledby="featured-brands-heading" className="px-6 py-12">
            <div className="mx-auto max-w-[1400px]">
              <h2 id="featured-brands-heading" className="eyebrow mb-4 text-neon">
                برندهای پرتکرار در داده نمونه
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {featured.map((brand, index) => (
                  <motion.div
                    key={brand.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="motion-reduce:transform-none"
                  >
                    <Link
                      to="/products"
                      search={{ brand: brand.name } as never}
                      className="group relative block aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-neon"
                      aria-label={`مشاهده محصولات نمونه ${brand.name}`}
                    >
                      {brand.sample ? (
                        <img
                          src={brand.sample}
                          alt=""
                          width={640}
                          height={800}
                          className="absolute inset-0 h-full w-full object-cover opacity-30 transition-all duration-700 group-hover:scale-110 group-hover:opacity-50 motion-reduce:transition-none"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
                      <div className="absolute inset-0 flex flex-col justify-between p-5">
                        <div className="flex items-center justify-between gap-3">
                          {brand.slug ? (
                            <img
                              src={`https://cdn.simpleicons.org/${brand.slug}/ffffff`}
                              alt=""
                              width={96}
                              height={32}
                              className="h-8 w-auto max-w-[60%] object-contain"
                            />
                          ) : (
                            <div className="font-display text-2xl font-black">{brand.name}</div>
                          )}
                          <span className="font-mono-num text-xs text-muted-foreground">
                            {brand.count} مدل
                          </span>
                        </div>
                        <div>
                          <div className="font-display text-3xl font-black transition-colors group-hover:text-neon">
                            {brand.name}
                          </div>
                          <div className="eyebrow mt-1 text-muted-foreground transition-colors group-hover:text-neon">
                            مشاهده نمونه‌ها ←
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section aria-labelledby="all-brands-heading" className="px-6 pb-20">
          <div className="mx-auto max-w-[1400px]">
            <h2 id="all-brands-heading" className="eyebrow mb-4 text-neon">
              همه برندهای داده نمونه ({list.length})
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {rest.map((brand, index) => (
                <motion.div
                  key={brand.name}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: (index % 12) * 0.03 }}
                  className="motion-reduce:transform-none"
                >
                  <Link
                    to="/products"
                    search={{ brand: brand.name } as never}
                    className="group relative flex min-h-[130px] flex-col items-center justify-center rounded-2xl border border-border bg-surface p-5 text-center transition-colors hover:border-neon"
                    aria-label={`مشاهده محصولات نمونه ${brand.name}`}
                  >
                    {brand.slug ? (
                      <img
                        src={`https://cdn.simpleicons.org/${brand.slug}/ffffff`}
                        alt=""
                        loading="lazy"
                        width={96}
                        height={40}
                        className="h-10 w-auto max-w-[80%] object-contain opacity-80 transition-opacity group-hover:opacity-100"
                      />
                    ) : (
                      <div className="font-display text-base font-bold leading-tight transition-colors group-hover:text-neon md:text-lg">
                        {brand.name}
                      </div>
                    )}
                    <div className="mt-3 font-mono-num text-xs text-muted-foreground">
                      {brand.count} مدل نمونه
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            {list.length === 0 ? (
              <div className="py-16 text-center font-fa text-muted-foreground" role="status">
                برندی در داده نمونه پیدا نشد
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
