import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Star, Eye } from "lucide-react";
import { toast } from "sonner";
import { formatPrice, type Shoe } from "@/data/shoes";
import { useStore } from "@/store";

interface Props {
  shoe: Shoe;
  index?: number;
  variant?: "grid" | "list";
}

export function ShoeCard({ shoe, index = 0, variant = "grid" }: Props) {
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const isWishlisted = useStore((s) => s.wishlist.includes(shoe.id));
  const addToCart = useStore((s) => s.addToCart);
  const setCartOpen = useStore((s) => s.setCartOpen);

  const discount = shoe.sale_price
    ? Math.round(((shoe.price - shoe.sale_price) / shoe.price) * 100)
    : 0;

  const handleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(shoe.id);
    toast(isWishlisted ? "از علاقه‌مندی حذف شد" : "به علاقه‌مندی اضافه شد ♡");
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (shoe.isSoldOut) return;
    const size = shoe.sizes[Math.floor(shoe.sizes.length / 2)];
    addToCart(shoe.id, size, 1);
    toast.success(`${shoe.name} به سبد اضافه شد 🛒`);
    setCartOpen(true);
  };

  if (variant === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.4, delay: (index % 6) * 0.05 }}
      >
        <Link
          to="/product/$id"
          params={{ id: String(shoe.id) }}
          className="group grid grid-cols-[120px_1fr_auto] sm:grid-cols-[160px_1fr_auto] gap-4 p-3 bg-surface border border-border rounded-2xl hover:border-neon/60 transition-colors items-center"
        >
          <div className="relative aspect-square rounded-xl overflow-hidden bg-surface-2">
            <img src={shoe.image} alt={shoe.name} loading="lazy" className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${shoe.isSoldOut ? "grayscale opacity-50" : ""}`} />
            {shoe.isNew && <span className="absolute top-1.5 left-1.5 bg-neon text-ink eyebrow px-1.5 py-0.5 rounded-full">NEW</span>}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs">
              <span className="eyebrow text-muted-foreground">{shoe.brand}</span>
              <span className="flex items-center gap-0.5"><Star size={11} className="fill-neon text-neon" /><span className="font-mono-num">{shoe.rating}</span></span>
            </div>
            <h3 className="font-display font-bold text-base sm:text-lg leading-tight mt-1 group-hover:text-neon transition-colors truncate">{shoe.name}</h3>
            <p className="text-xs text-muted-foreground truncate">{shoe.colorway}</p>
            <div className="flex gap-1 mt-2">
              {shoe.colors.slice(0, 4).map((c, i) => (
                <span key={i} className="w-3 h-3 rounded-full border border-border" style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="text-right">
              <div className="font-mono-num font-bold text-sm text-neon">{formatPrice(shoe.sale_price ?? shoe.price)}</div>
              {shoe.sale_price && <div className="font-mono-num text-[10px] text-muted-foreground line-through">{formatPrice(shoe.price)}</div>}
            </div>
            <div className="flex gap-1">
              <button onClick={handleWish} className="w-8 h-8 rounded-full border border-border hover:border-neon grid place-items-center" aria-label="Wishlist">
                <Heart size={13} className={isWishlisted ? "fill-neon text-neon" : ""} />
              </button>
              <button onClick={handleAdd} disabled={shoe.isSoldOut} className="w-8 h-8 rounded-full bg-neon text-ink grid place-items-center hover:scale-110 transition disabled:opacity-30" aria-label="Add">
                <ShoppingBag size={13} />
              </button>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: (index % 4) * 0.07, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6 }}
      className="group relative bg-surface border border-border rounded-2xl overflow-hidden hover:border-neon/60 hover:shadow-[0_20px_50px_-20px_rgba(200,241,53,0.25)] transition-all"
    >
      <Link to="/product/$id" params={{ id: String(shoe.id) }} className="block">
        <div className="relative aspect-square bg-gradient-to-br from-surface-2 to-ink overflow-hidden">
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
            {shoe.isNew && <span className="bg-neon text-ink eyebrow px-2 py-0.5 rounded-full">NEW</span>}
            {shoe.isLimited && <span className="bg-neon-orange text-white eyebrow px-2 py-0.5 rounded-full">LIMITED</span>}
            {shoe.sale_price && <span className="bg-purple-hype text-white eyebrow px-2 py-0.5 rounded-full">-{discount}%</span>}
          </div>

          <button
            onClick={handleWish}
            className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full backdrop-blur flex items-center justify-center transition-colors ${
              isWishlisted ? "bg-neon text-ink" : "bg-ink/60 hover:bg-neon hover:text-ink"
            }`}
            aria-label="Save"
          >
            <Heart size={14} className={isWishlisted ? "fill-current" : ""} />
          </button>

          <img
            src={shoe.image}
            alt={`${shoe.brand} ${shoe.name}`}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${shoe.isSoldOut ? "grayscale opacity-60" : ""}`}
          />
          {shoe.images[1] && !shoe.isSoldOut && (
            <img
              src={shoe.images[1]}
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
          )}

          {shoe.isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display font-black text-2xl tracking-widest text-white border-2 border-white px-4 py-1 -rotate-12">
                SOLD OUT
              </span>
            </div>
          )}

          <div className="absolute inset-x-3 bottom-3 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <span className="flex-1 bg-white text-ink eyebrow py-2.5 rounded-full text-center inline-flex items-center justify-center gap-1.5">
              <Eye size={13} /> Quick View
            </span>
            <button
              onClick={handleAdd}
              disabled={shoe.isSoldOut}
              className="w-10 h-10 rounded-full bg-neon text-ink grid place-items-center hover:scale-110 transition disabled:opacity-30"
              aria-label="Add"
            >
              <ShoppingBag size={14} />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="eyebrow text-muted-foreground">{shoe.brand}</span>
            <div className="flex items-center gap-1 text-xs">
              <Star size={12} className="fill-neon text-neon" />
              <span className="font-mono-num">{shoe.rating}</span>
              <span className="text-muted-foreground">({shoe.reviews})</span>
            </div>
          </div>

          <h3 className="font-display font-bold text-base leading-tight truncate group-hover:text-neon transition-colors">
            {shoe.name}
          </h3>
          <p className="text-xs text-muted-foreground mb-3 truncate">{shoe.colorway}</p>

          <div className="flex gap-1 mb-3">
            {shoe.colors.slice(0, 4).map((c, i) => (
              <span key={i} className="w-3.5 h-3.5 rounded-full border border-border" style={{ background: c }} />
            ))}
          </div>

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
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
