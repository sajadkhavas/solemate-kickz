import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { CATEGORIES, SHOES } from "@/data/shoes";

export function Categories() {
  return (
    <section className="py-24 px-6 bg-surface/40">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-12 flex items-end justify-between flex-wrap gap-4">
          <h2 className="font-display font-black text-5xl md:text-6xl lg:text-7xl uppercase leading-none">
            Shop by<br /><span className="text-neon">Vibe</span>
          </h2>
          <p className="font-fa text-muted-foreground max-w-sm">
            هر کفش یه روحیه داره. روحیه‌ت رو پیدا کن.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[260px]">
          {CATEGORIES.map((cat, i) => {
            const count = SHOES.filter(s => s.category === cat.id).length;
            const tall = i === 0 || i === 3;
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className={tall ? "md:row-span-2" : ""}
              >
                <Link
                  to="/products"
                  search={{ category: cat.id } as never}
                  className="group relative block rounded-3xl overflow-hidden bg-surface border border-border h-full"
                >
                  <img
                    src={cat.image}
                    alt={cat.label}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at 70% 30%, ${cat.accent}50, transparent 60%)` }}
                  />
                  <div className="relative h-full p-6 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <span className="text-4xl drop-shadow-lg">{cat.icon}</span>
                      <span className="eyebrow text-white/80 font-mono-num bg-ink/40 backdrop-blur px-2 py-1 rounded-full">{count} styles</span>
                    </div>
                    <div>
                      <h3
                        className="font-display font-black text-3xl md:text-4xl uppercase leading-none mb-2 group-hover:translate-x-1 transition-transform drop-shadow-lg"
                        style={{ color: cat.accent }}
                      >
                        {cat.label}
                      </h3>
                      <p className="font-fa text-sm text-white/80">{cat.fa}</p>
                      <div className="flex items-center gap-2 mt-4 eyebrow text-neon opacity-0 group-hover:opacity-100 transition-opacity">
                        Explore <ArrowUpRight size={14} />
                      </div>
                    </div>
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
