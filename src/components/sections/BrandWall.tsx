import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

import { BRANDS, SHOES } from "@/data/shoes";

export function BrandWall() {
  return (
    <section id="brands" className="px-6 py-24">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-12">
          <div className="eyebrow mb-3 text-neon">The Family</div>
          <h2 className="font-display text-4xl font-black uppercase leading-none md:text-6xl">
            Our Brands
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {BRANDS.map((brand, index) => {
            const count = SHOES.filter((shoe) => shoe.brand === brand).length;

            return (
              <motion.div
                key={brand}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.03 }}
              >
                <Link
                  to="/products"
                  search={{ brand, sort: "newest" }}
                  className="group relative flex min-h-[120px] flex-col items-center justify-center rounded-2xl border border-border bg-surface p-5 text-center transition-colors hover:border-neon"
                  aria-label={`مشاهده محصولات نمونه برند ${brand}`}
                >
                  <div className="font-display text-base font-black leading-tight tracking-tight transition-colors group-hover:text-neon md:text-lg">
                    {brand}
                  </div>
                  <div className="mt-3 font-mono-num text-xs text-muted-foreground">
                    {count} مدل نمونه
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
