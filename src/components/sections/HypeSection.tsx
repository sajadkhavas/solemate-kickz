import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SHOES } from "@/data/shoes";

export function HypeSection() {
  // Pull the three hero-rendered limited drops by id (Yeezy Zebra, AJ4 Bred, AJ11 Space Jam)
  const limited = [3, 16, 22]
    .map(id => SHOES.find(s => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <section className="relative py-32 px-6 overflow-hidden bg-gradient-to-br from-ink via-purple-hype/20 to-ink grain">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,92,0,0.2),transparent_50%)]" />

      <div className="relative max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="eyebrow text-neon-orange mb-4">⚠️ Limited Stock</div>
          <h2 className="font-display font-black uppercase leading-[0.85] text-6xl md:text-8xl">
            Don't<br />
            Sleep<br />
            <span className="text-neon-orange">On It.</span>
          </h2>
          <p className="font-fa text-lg text-muted-foreground mt-6 max-w-md">
            کلکسیون محدود. اگه میخوای، الان باید اقدام کنی. بعد از این، فقط حسرت میمونه.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 mt-8 bg-neon-orange text-white font-display font-bold uppercase tracking-wider px-7 py-3.5 rounded-full hover:bg-white hover:text-ink transition-all"
          >
            See Limited Drops <ArrowRight size={16} />
          </Link>
        </motion.div>

        <div className="relative h-[400px] md:h-[500px]">
          {limited.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: 60, rotate: 0 }}
              whileInView={{ opacity: 1, x: 0, rotate: (i - 1) * 8 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute w-48 md:w-64 bg-surface rounded-2xl overflow-hidden shadow-2xl border border-border"
              style={{
                top: `${i * 18}%`,
                left: `${i * 22}%`,
                zIndex: 3 - i,
              }}
            >
              <img src={s.image} alt={s.name} loading="lazy" className="w-full aspect-square object-cover" />
              <div className="p-3">
                <div className="eyebrow text-neon">{s.brand}</div>
                <div className="font-display font-bold text-sm truncate">{s.name}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
