import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SHOES } from "@/data/shoes";
import { ShoeCard } from "@/components/ShoeCard";

export function FeaturedDrops() {
  const featured = SHOES.filter(s => s.isNew || s.isLimited).slice(0, 8);

  return (
    <section className="py-24 px-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-end justify-between gap-6 mb-12 flex-wrap">
          <div>
            <div className="eyebrow text-neon mb-3">⚡ Hot Right Now</div>
            <h2 className="font-display font-black text-5xl md:text-6xl lg:text-7xl uppercase leading-none">
              Just <span className="text-neon">Dropped</span>
            </h2>
            <p className="font-fa text-muted-foreground mt-3">محدود. تازه. واقعی.</p>
          </div>
          <Link to="/products" className="font-display font-bold uppercase tracking-wider text-sm flex items-center gap-2 text-neon hover:gap-3 transition-all">
            View All <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {featured.map((s, i) => <ShoeCard key={s.id} shoe={s} index={i} />)}
        </div>
      </div>
    </section>
  );
}
