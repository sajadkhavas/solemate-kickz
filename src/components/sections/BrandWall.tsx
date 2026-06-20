import { motion } from "framer-motion";
import { BRANDS, SHOES } from "@/data/shoes";

export function BrandWall() {
  return (
    <section id="brands" className="py-24 px-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-12">
          <div className="eyebrow text-neon mb-3">The Family</div>
          <h2 className="font-display font-black text-4xl md:text-6xl uppercase leading-none">
            Our Brands
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {BRANDS.map((brand, i) => {
            const count = SHOES.filter(s => s.brand === brand).length;
            return (
              <motion.a
                key={brand}
                href="#"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.03 }}
                className="group relative bg-surface border border-border rounded-2xl p-5 hover:border-neon hover:bg-neon hover:text-ink transition-all"
              >
                <div className="font-display font-bold text-base md:text-lg leading-tight">
                  {brand}
                </div>
                <div className="font-mono-num text-xs opacity-60 mt-1">
                  {count || Math.floor(Math.random() * 30 + 5)} styles
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
