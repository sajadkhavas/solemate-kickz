import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Eye, Heart, ShoppingBag } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { type Shoe, formatPrice } from "@/data/shoes";
import { useSharedTransition } from "@/hooks/useSharedTransition";
import { useStore } from "@/store";

interface Props {
  shoe: Shoe;
  index?: number;
  variant?: "grid" | "list";
}

function buildVariants(shoe: Shoe) {
  const labels = ["Original", "Alt", "Rare", "Limited"];
  return shoe.colors.slice(0, 4).map((color, index) => ({
    color,
    label: labels[index] ?? `V${index + 1}`,
    image: shoe.images[index] ?? shoe.image,
  }));
}

export function ShoeCard({ shoe, index = 0, variant = "grid" }: Props) {
  const toggleWishlist = useStore((state) => state.toggleWishlist);
  const isWishlisted = useStore((state) => state.wishlist.includes(shoe.id));
  const addToCart = useStore((state) => state.addToCart);
  const setCartOpen = useStore((state) => state.setCartOpen);
  const { saveRect } = useSharedTransition();

  const imageRef = useRef<HTMLImageElement | null>(null);
  const variants = buildVariants(shoe);
  const [activeVariant, setActiveVariant] = useState(0);
  const activeImage = variants[activeVariant]?.image ?? shoe.image;

  const discount = shoe.sale_price
    ? Math.round(((shoe.price - shoe.sale_price) / shoe.price) * 100)
    : 0;

  const handleWish = () => {
    toggleWishlist(shoe.id);
    toast(isWishlisted ? "از علاقه‌مندی حذف شد" : "به علاقه‌مندی اضافه شد ♡");
  };

  const handleAdd = () => {
    if (shoe.isSoldOut) return;
    const size = shoe.sizes[Math.floor(shoe.sizes.length / 2)];
    addToCart(shoe.id, size, 1);
    toast.success(`${shoe.name} به سبد اضافه شد 🛒`);
    setCartOpen(true);
  };

  const handleNav = () => {
    if (imageRef.current) saveRect(shoe.id, imageRef.current);
  };

  const productTarget = {
    to: "/product/$id" as const,
    params: { id: String(shoe.id) },
  };

  if (variant === "list") {
    return (
      <motion.article
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.4, delay: (index % 6) * 0.05 }}
        className="grid grid-cols-[120px_1fr_auto] items-center gap-4 rounded-2xl border border-border bg-surface p-3 transition-colors hover:border-neon/60 motion-reduce:transform-none sm:grid-cols-[160px_1fr_auto]"
      >
        <Link
          {...productTarget}
          onClick={handleNav}
          data-magnetic
          className="group contents"
          aria-label={`مشاهده محصول نمونه ${shoe.name}`}
        >
          <motion.div
            layoutId={`shoe-image-${shoe.id}`}
            className="relative aspect-square overflow-hidden rounded-xl bg-surface-2"
          >
            <img
              ref={imageRef}
              src={activeImage}
              alt={`${shoe.brand} ${shoe.name}`}
              loading="lazy"
              width={320}
              height={320}
              className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 ${shoe.isSoldOut ? "grayscale opacity-50" : ""}`}
            />
            {shoe.isNew ? (
              <span className="eyebrow absolute left-1.5 top-1.5 rounded-full bg-neon px-1.5 py-0.5 text-ink">
                نمونه جدید
              </span>
            ) : null}
          </motion.div>

          <div className="min-w-0 rounded-md focus-within:outline-none">
            <div className="flex items-center gap-2 text-xs">
              <span className="eyebrow text-muted-foreground">{shoe.brand}</span>
              <span className="rounded-full border border-border px-2 py-0.5 text-[0.65rem] text-muted-foreground">
                داده نمونه
              </span>
            </div>
            <h3 className="mt-1 truncate font-display text-base font-bold leading-tight transition-colors group-hover:text-neon sm:text-lg">
              {shoe.name}
            </h3>
            <p className="truncate text-xs text-muted-foreground">{shoe.colorway}</p>
            <div className="mt-2 flex gap-1" aria-label="رنگ‌های نمونه">
              {shoe.colors.slice(0, 4).map((color, colorIndex) => (
                <span
                  key={`${color}-${colorIndex}`}
                  className="size-3 rounded-full border border-border"
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
        </Link>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="text-left">
            <div className="font-mono-num text-sm font-bold text-neon">
              {formatPrice(shoe.sale_price ?? shoe.price)}
            </div>
            {shoe.sale_price ? (
              <div className="font-mono-num text-[10px] text-muted-foreground line-through">
                {formatPrice(shoe.price)}
              </div>
            ) : null}
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={handleWish}
              data-magnetic
              className="grid size-11 place-items-center rounded-full border border-border transition-colors hover:border-neon"
              aria-label={
                isWishlisted
                  ? `حذف ${shoe.name} از علاقه‌مندی`
                  : `افزودن ${shoe.name} به علاقه‌مندی`
              }
              aria-pressed={isWishlisted}
            >
              <Heart
                aria-hidden="true"
                size={16}
                className={isWishlisted ? "fill-neon text-neon" : ""}
              />
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={shoe.isSoldOut}
              data-magnetic
              className="grid size-11 place-items-center rounded-full bg-neon text-ink transition-transform hover:scale-105 disabled:opacity-30 motion-reduce:transition-none"
              aria-label={`افزودن ${shoe.name} به سبد`}
            >
              <ShoppingBag aria-hidden="true" size={16} />
            </button>
          </div>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: (index % 4) * 0.07, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.03, y: -6 }}
      whileTap={{ scale: 0.98 }}
      data-magnetic
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-neon/60 hover:shadow-[0_20px_50px_-20px_rgba(200,241,53,0.25)] motion-reduce:transform-none"
      style={{ transitionProperty: "border-color, box-shadow" }}
    >
      <div className="relative">
        <Link
          {...productTarget}
          onClick={handleNav}
          className="block rounded-t-2xl"
          aria-label={`مشاهده محصول نمونه ${shoe.name}`}
        >
          <motion.div
            layoutId={`shoe-image-${shoe.id}`}
            className="relative aspect-square overflow-hidden bg-gradient-to-br from-surface-2 to-ink"
          >
            <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
              <span className="eyebrow rounded-full border border-border bg-ink/80 px-2 py-0.5 text-muted-foreground backdrop-blur">
                نمونه
              </span>
              {shoe.isNew ? (
                <span className="eyebrow rounded-full bg-neon px-2 py-0.5 text-ink">NEW</span>
              ) : null}
              {shoe.isLimited ? (
                <span className="eyebrow rounded-full bg-neon-orange px-2 py-0.5 text-white">
                  LIMITED
                </span>
              ) : null}
              {shoe.sale_price ? (
                <span className="eyebrow rounded-full bg-purple-hype px-2 py-0.5 text-white">
                  -{discount}%
                </span>
              ) : null}
            </div>

            <motion.img
              key={activeImage}
              ref={imageRef}
              src={activeImage}
              alt={`${shoe.brand} ${shoe.name}`}
              loading="lazy"
              width={640}
              height={640}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 ${shoe.isSoldOut ? "grayscale opacity-60" : ""}`}
            />

            {shoe.isSoldOut ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="-rotate-12 border-2 border-white px-4 py-1 font-display text-2xl font-black tracking-widest text-white">
                  SOLD OUT
                </span>
              </div>
            ) : null}
          </motion.div>
        </Link>

        <button
          type="button"
          onClick={handleWish}
          data-magnetic
          className={`absolute right-3 top-3 z-20 grid size-11 place-items-center rounded-full backdrop-blur transition-colors ${
            isWishlisted ? "bg-neon text-ink" : "bg-ink/70 hover:bg-neon hover:text-ink"
          }`}
          aria-label={
            isWishlisted ? `حذف ${shoe.name} از علاقه‌مندی` : `افزودن ${shoe.name} به علاقه‌مندی`
          }
          aria-pressed={isWishlisted}
        >
          <Heart aria-hidden="true" size={16} className={isWishlisted ? "fill-current" : ""} />
        </button>

        <div className="absolute inset-x-3 bottom-3 z-20 flex translate-y-2 gap-2 opacity-0 transition-all duration-300 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transition-none">
          <Link
            {...productTarget}
            onClick={handleNav}
            className="eyebrow inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-white py-2.5 text-center text-ink"
          >
            <Eye aria-hidden="true" size={14} /> مشاهده محصول
          </Link>
          <button
            type="button"
            onClick={handleAdd}
            disabled={shoe.isSoldOut}
            data-magnetic
            className="grid size-11 place-items-center rounded-full bg-neon text-ink transition-transform hover:scale-105 disabled:opacity-30 motion-reduce:transition-none"
            aria-label={`افزودن ${shoe.name} به سبد`}
          >
            <ShoppingBag aria-hidden="true" size={16} />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="eyebrow text-muted-foreground">{shoe.brand}</span>
          <span className="rounded-full border border-border px-2 py-0.5 text-[0.65rem] text-muted-foreground">
            داده نمونه
          </span>
        </div>

        <Link {...productTarget} onClick={handleNav} className="block rounded-sm">
          <h3 className="truncate font-display text-base font-bold leading-tight transition-colors group-hover:text-neon">
            {shoe.name}
          </h3>
          <p className="mb-3 truncate text-xs text-muted-foreground">{shoe.colorway}</p>
        </Link>

        <div
          className="mb-3 flex h-11 items-center gap-1.5 opacity-70 transition-opacity group-hover:opacity-100"
          role="group"
          aria-label={`انتخاب رنگ نمایشی ${shoe.name}`}
        >
          {variants.map((variantOption, variantIndex) => (
            <button
              key={`${variantOption.label}-${variantIndex}`}
              type="button"
              onClick={() => setActiveVariant(variantIndex)}
              aria-label={variantOption.label}
              aria-pressed={variantIndex === activeVariant}
              title={variantOption.label}
              data-magnetic
              className={`size-8 rounded-full border-2 transition-transform motion-reduce:transition-none ${
                variantIndex === activeVariant
                  ? "scale-110 border-neon"
                  : "border-border hover:border-muted-foreground"
              }`}
              style={{ background: variantOption.color }}
            />
          ))}
        </div>

        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate font-mono-num text-sm font-semibold text-foreground">
              {formatPrice(shoe.sale_price ?? shoe.price)}
            </div>
            {shoe.sale_price ? (
              <div className="truncate font-mono-num text-xs text-muted-foreground line-through">
                {formatPrice(shoe.price)}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
