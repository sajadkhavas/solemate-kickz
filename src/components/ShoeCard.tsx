import { motion } from "framer-motion";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { formatPrice, type Shoe } from "@/data/shoes";

export function ShoeCard({ shoe, index = 0 }: { shoe: Shoe; index?: number }) {
  const discount = shoe.sale_price
    ? Math.round(((shoe.price - shoe.sale_price) / shoe.price) * 100)
    : 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: (index % 4) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6 }}
      className="group relative bg-surface border border-border rounded-2xl overflow-hidden hover:border-neon/60 transition-colors"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gradient-to-br from-surface-2 to-ink overflow-hidden">
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          {shoe.isNew && (
            <span className="bg-neon text-ink eyebrow px-2 py-0.5 rounded-full">NEW</span>
          )}
          {shoe.isLimited && (
            <span className="bg-neon-orange text-white eyebrow px-2 py-0.5 rounded-full">LIMITED</span>
          )}
          {shoe.sale_price && (
            <span className="bg-purple-hype text-white eyebrow px-2 py-0.5 rounded-full">-{discount}%</span>
          )}
        </div>

        <button
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-ink/60 backdrop-blur flex items-center justify-center hover:bg-neon hover:text-ink transition-colors"
          aria-label="Save"
        >
          <Heart size={14} />
        </button>

        <img
          src={shoe.image}
          alt={`${shoe.brand} ${shoe.name}`}
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${
            shoe.isSoldOut ? "grayscale opacity-60" : ""
          }`}
        />

        {shoe.isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display font-black text-2xl tracking-widest text-white border-2 border-white px-4 py-1 -rotate-12">
              SOLD OUT
            </span>
          </div>
        )}

        {/* Quick view overlay */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <button className="w-full bg-white text-ink eyebrow py-2.5 rounded-full hover:bg-neon transition-colors">
            Quick View
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="eyebrow text-muted-foreground">{shoe.brand}</span>
          <div className="flex items-center gap-1 text-xs">
            <Star size={12} className="fill-neon text-neon" />
            <span className="font-mono-num">{shoe.rating}</span>
            <span className="text-muted-foreground">({shoe.reviews})</span>
          </div>
        </div>

        <h3 className="font-display font-bold text-base leading-tight truncate">
          {shoe.name}
        </h3>
        <p className="text-xs text-muted-foreground mb-3 truncate">{shoe.colorway}</p>

        {/* Colors */}
        <div className="flex gap-1 mb-3">
          {shoe.colors.slice(0, 4).map((c, i) => (
            <span
              key={i}
              className="w-3.5 h-3.5 rounded-full border border-border"
              style={{ background: c }}
            />
          ))}
        </div>

        {/* Price + CTA */}
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="font-mono-num font-semibold text-sm text-foreground truncate">
              {formatPrice(shoe.sale_price ?? shoe.price)}
            </div>
            {shoe.sale_price && (
              <div className="font-mono-num text-xs text-muted-foreground line-through truncate">
                {formatPrice(shoe.price)}
              </div>
            )}
          </div>
          <button
            disabled={shoe.isSoldOut}
            className="shrink-0 w-9 h-9 rounded-full bg-neon text-ink flex items-center justify-center hover:scale-110 transition disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Add to cart"
          >
            <ShoppingBag size={15} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
