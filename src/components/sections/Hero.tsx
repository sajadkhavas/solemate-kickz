import { motion } from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SHOES } from "@/data/shoes";
import heroShoe from "@/assets/hero-shoe.jpg";
import { ShoeViewer3D } from "@/components/ShoeViewer3D";

const HEADLINE_WORDS = ["Air", "Jordan", "1", "Retro", "High", "OG"];

export function Hero() {
  const featured = { ...SHOES[1], image: heroShoe };

  return (
    <section className="relative min-h-[100svh] overflow-hidden grain bg-ink">
      {/* Glow orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-neon/20 blur-[120px] animate-pulse-glow" />

      {/* Floating neon particles — pure CSS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="hero-particle"
            style={{
              left: `${(i * 83) % 100}%`,
              top: `${(i * 47) % 100}%`,
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              opacity: 0.15 + (i % 3) * 0.05,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${8 + (i % 5)}s`,
            }}
          />
        ))}
      </div>

      {/* Giant background text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
        <div className="font-display font-black text-white/[0.04] leading-none text-[22vw] tracking-tighter">
          STEP
        </div>
        <div className="font-display font-black text-white/[0.04] leading-none text-[22vw] tracking-tighter -mt-[6vw]">
          FURTHER
        </div>
      </div>

      <div className="relative max-w-[1400px] mx-auto px-6 pt-16 pb-24 min-h-[calc(100svh-64px)] grid lg:grid-cols-[45%_55%] gap-8 items-center">
        {/* Left: text */}
        <div className="relative z-10 order-2 lg:order-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{
              opacity: 1,
              x: 0,
              boxShadow: [
                "0 0 0px rgba(200,241,53,0)",
                "0 0 20px rgba(200,241,53,0.6)",
                "0 0 0px rgba(200,241,53,0)",
              ],
            }}
            transition={{
              opacity: { duration: 0.6 },
              x: { duration: 0.6 },
              boxShadow: { repeat: Infinity, duration: 2.5, ease: "easeInOut" },
            }}
            className="eyebrow text-neon mb-5 inline-flex items-center gap-3 rounded-full border border-neon/40 px-3 py-1"
          >
            <span className="w-2 h-2 rounded-full bg-neon" />
            NEW DROP · 2025
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
            }}
            className="font-display font-black uppercase leading-[0.9] text-5xl sm:text-6xl lg:text-7xl xl:text-8xl"
          >
            {HEADLINE_WORDS.map((w, i) => (
              <motion.span
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
                }}
                className={
                  "inline-block me-3 " + (w === "Retro" ? "text-neon" : "")
                }
              >
                {w}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="font-fa text-lg text-muted-foreground mt-6 max-w-md"
          >
            شیکاگو بازگشت. رنگ‌بندی افسانه‌ای، حالا با کیفیت بازسازی شده. فقط برای کسایی که میدونن.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.85 }}
            className="flex flex-wrap gap-3 mt-8"
          >
            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link to="/products" className="btn-hype">
                Shop Now <ArrowRight size={16} />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link to="/products" className="btn-ghost-neon">
                Explore All
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="flex items-center gap-6 mt-10 text-xs eyebrow text-muted-foreground"
          >
            <span><span className="text-neon font-mono-num text-base">۲۳۲+</span> مدل موجود</span>
            <span className="w-px h-4 bg-border" />
            <span><span className="text-neon font-mono-num text-base">۱۸</span> برند جهانی</span>
          </motion.div>
        </div>

        {/* Right: 3D viewer */}
        <motion.div
          initial={{ opacity: 0, x: 60, rotateY: -15 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 order-1 lg:order-2"
          style={{ perspective: 1200, transformStyle: "preserve-3d" }}
        >
          <ShoeViewer3D fallbackImage={featured.image} alt={featured.name} />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground">
        <span className="eyebrow text-[10px]">Scroll</span>
        <ArrowDown size={14} className="animate-bounce" />
      </div>
    </section>
  );
}
