import { motion } from "framer-motion";
import { BRANDS, BRAND_LOGO_SLUGS, SHOES } from "@/data/shoes";

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
            const count = SHOES.filter(s => s.brand === brand).length || Math.floor(((i * 7) % 25) + 5);
            const slug = BRAND_LOGO_SLUGS[brand];
            return (
              <motion.a
                key={brand}
                href="#"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.03 }}
                className="group relative bg-surface border border-border rounded-2xl p-5 hover:border-neon transition-all flex flex-col items-center justify-center min-h-[120px] text-center"
              >
                {slug ? (
                  <img
                    src={`https://cdn.simpleicons.org/${slug}/ffffff`}
                    alt={`${brand} logo`}
                    loading="lazy"
                    className="h-10 w-auto max-w-[80%] object-contain opacity-90 group-hover:opacity-100 group-hover:[filter:brightness(0)_saturate(100%)_invert(91%)_sepia(50%)_saturate(1000%)_hue-rotate(15deg)] transition-all"
                  />
                ) : (
                  <div className="font-display font-bold text-base md:text-lg leading-tight group-hover:text-neon transition-colors">
                    {brand}
                  </div>
                )}
                <div className="font-mono-num text-xs text-muted-foreground mt-3">
                  {count} styles
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
