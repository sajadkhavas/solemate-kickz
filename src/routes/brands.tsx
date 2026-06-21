import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { BRANDS, BRAND_LOGO_SLUGS, SHOES } from "@/data/shoes";

export const Route = createFileRoute("/brands")({
  head: () => ({
    meta: [
      { title: "Brands — SOLE" },
      { name: "description", content: "همه برندهای SOLE — از Nike و Jordan تا Off-White و Stone Island." },
      { property: "og:title", content: "Brands — SOLE" },
      { property: "og:description", content: "تمام برندهای موجود در فروشگاه SOLE." },
    ],
  }),
  component: BrandsPage,
});

function BrandsPage() {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return BRANDS
      .map((b) => ({
        name: b,
        count: SHOES.filter((s) => s.brand === b).length,
        slug: BRAND_LOGO_SLUGS[b],
        sample: SHOES.find((s) => s.brand === b)?.image,
      }))
      .filter((b) => !term || b.name.toLowerCase().includes(term))
      .sort((a, b) => b.count - a.count);
  }, [q]);

  const featured = list.slice(0, 4);
  const rest = list.slice(4);

  return (
    <div className="bg-ink text-foreground min-h-screen">
      <Navbar />

      <section className="px-6 pt-12 pb-10 border-b border-border relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,#c8f135_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="max-w-[1400px] mx-auto relative">
          <div className="eyebrow text-neon mb-3">The Family</div>
          <h1 className="font-display font-black uppercase text-5xl md:text-7xl leading-none">
            Our <span className="text-neon">Brands</span>
          </h1>
          <p className="font-fa text-muted-foreground mt-3 max-w-xl">
            از کلاسیک‌های Nike و Jordan تا تکنیکال‌های Salomon و لاکچری‌های Off-White — همه زیر یک سقف.
          </p>

          <div className="mt-6 max-w-md flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-2.5 focus-within:border-neon">
            <Search size={16} className="text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جستجوی برند..."
              className="bg-transparent outline-none flex-1 text-sm font-fa"
            />
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="px-6 py-12">
          <div className="max-w-[1400px] mx-auto">
            <div className="eyebrow text-neon mb-4">Featured</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featured.map((b, i) => (
                <motion.div
                  key={b.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                >
                  <Link
                    to="/products"
                    search={{ brand: b.name } as never}
                    className="group block relative overflow-hidden rounded-2xl border border-border bg-surface hover:border-neon transition aspect-[4/5]"
                  >
                    {b.sample && (
                      <img
                        src={b.sample}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all duration-700"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
                    <div className="absolute inset-0 p-5 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        {b.slug ? (
                          <img src={`https://cdn.simpleicons.org/${b.slug}/ffffff`} alt={`${b.name} logo`} className="h-8" />
                        ) : (
                          <div className="font-display font-black text-2xl">{b.name}</div>
                        )}
                        <span className="font-mono-num text-xs text-muted-foreground">{b.count} styles</span>
                      </div>
                      <div>
                        <div className="font-display font-black text-3xl group-hover:text-neon transition-colors">{b.name}</div>
                        <div className="eyebrow text-muted-foreground mt-1 group-hover:text-neon transition-colors">Shop →</div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All brands grid */}
      <section className="px-6 pb-20">
        <div className="max-w-[1400px] mx-auto">
          <div className="eyebrow text-neon mb-4">All Brands ({list.length})</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {rest.map((b, i) => (
              <motion.div
                key={b.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: (i % 12) * 0.03 }}
              >
                <Link
                  to="/products"
                  search={{ brand: b.name } as never}
                  className="group relative bg-surface border border-border rounded-2xl p-5 hover:border-neon transition-all flex flex-col items-center justify-center min-h-[130px] text-center"
                >
                  {b.slug ? (
                    <img
                      src={`https://cdn.simpleicons.org/${b.slug}/ffffff`}
                      alt={`${b.name} logo`}
                      loading="lazy"
                      className="h-10 w-auto max-w-[80%] object-contain opacity-80 group-hover:opacity-100 transition"
                    />
                  ) : (
                    <div className="font-display font-bold text-base md:text-lg leading-tight group-hover:text-neon transition-colors">
                      {b.name}
                    </div>
                  )}
                  <div className="font-mono-num text-xs text-muted-foreground mt-3">{b.count} styles</div>
                </Link>
              </motion.div>
            ))}
          </div>
          {list.length === 0 && (
            <div className="text-center py-16 text-muted-foreground font-fa">برندی پیدا نشد</div>
          )}
        </div>
      </section>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
