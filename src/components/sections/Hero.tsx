import { motion } from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SHOES } from "@/data/shoes";
import heroShoe from "@/assets/hero-shoe.jpg";

export function Hero() {
  const featured = { ...SHOES[1], image: heroShoe }; // Air Jordan 1 Chicago

  return (
    <section className="relative min-h-[100svh] overflow-hidden grain bg-ink">
      {/* Glow orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-neon/20 blur-[120px] animate-pulse-glow" />

      {/* Giant background text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
        <div className="font-display font-black text-white/[0.04] leading-none text-[22vw] tracking-tighter">
          STEP
        </div>
        <div className="font-display font-black text-white/[0.04] leading-none text-[22vw] tracking-tighter -mt-[6vw]">
          FURTHER
        </div>
      </div>

      <div className="relative max-w-[1400px] mx-auto px-6 pt-16 pb-24 min-h-[calc(100svh-64px)] grid lg:grid-cols-2 gap-8 items-center">
        {/* Left: text */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="eyebrow text-neon mb-5 flex items-center gap-3"
          >
            <span className="w-8 h-px bg-neon" />
            NEW DROP · 2025
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-black uppercase leading-[0.9] text-5xl sm:text-6xl lg:text-7xl xl:text-8xl"
          >
            Air Jordan<br />
            <span className="text-neon">1 Retro</span><br />
            High OG
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="font-fa text-lg text-muted-foreground mt-6 max-w-md"
          >
            شیکاگو بازگشت. رنگ‌بندی افسانه‌ای، حالا با کیفیت بازسازی شده. فقط برای کسایی که میدونن.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="flex flex-wrap gap-3 mt-8"
          >
            <Link to="/products" className="btn-hype">
              Shop Now <ArrowRight size={16} />
            </Link>
            <Link to="/products" className="btn-ghost-neon">
              Explore All
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center gap-6 mt-10 text-xs eyebrow text-muted-foreground"
          >
            <span><span className="text-neon font-mono-num text-base">۲۳۲+</span> مدل موجود</span>
            <span className="w-px h-4 bg-border" />
            <span><span className="text-neon font-mono-num text-base">۱۸</span> برند جهانی</span>
          </motion.div>
        </div>

        {/* Right: floating shoe */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex items-center justify-center"
          style={{ perspective: 1000 }}
        >
          <div className="absolute inset-0 bg-gradient-radial from-neon/30 via-transparent to-transparent blur-3xl" />
          <div className="relative animate-float" style={{ transformStyle: "preserve-3d" }}>
            <img
              src={featured.image}
              alt={featured.name}
              className="w-full max-w-[520px] aspect-square object-cover rounded-3xl shadow-[0_40px_120px_-20px_rgba(200,241,53,0.4)]"
            />
            {/* Floating price tag */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, type: "spring" }}
              className="absolute -bottom-4 -left-4 bg-neon text-ink px-5 py-3 rounded-2xl shadow-xl rotate-[-6deg]"
            >
              <div className="eyebrow opacity-70">From</div>
              <div className="font-mono-num font-bold text-lg">۷,۲۰۰,۰۰۰</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1, type: "spring" }}
              className="absolute -top-3 -right-3 bg-neon-orange text-white px-4 py-2 rounded-full eyebrow rotate-[8deg]"
            >
              Limited
            </motion.div>
          </div>
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
