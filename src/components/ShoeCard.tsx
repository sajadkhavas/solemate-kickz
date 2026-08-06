import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Eye, Heart } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/commerce-primitives";
import { type Shoe } from "@/data/shoes";
import { useSharedTransition } from "@/hooks/useSharedTransition";
import { useStore } from "@/store";

interface Props {
  shoe: Shoe;
  index?: number;
  variant?: "grid" | "list";
  onQuickView?: (shoe: Shoe) => void;
}

function buildPreviews(shoe: Shoe) {
  return shoe.colors.slice(0, 4).map((color, index) => ({
    color,
    image: shoe.images[index] ?? shoe.image,
    label: `پیش‌نمایش رنگ ${index + 1}`,
  }));
}

function ProductImage({
  shoe,
  source,
  imageRef,
  className,
}: {
  shoe: Shoe;
  source: string;
  imageRef: RefObject<HTMLImageElement | null>;
  className: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [source]);

  if (failed) {
    return (
      <div className={`${className} grid place-items-center bg-surface-2 p-4 text-center`}>
        <div>
          <span className="font-display text-2xl font-black text-muted-foreground">SOLE</span>
          <span className="mt-1 block font-fa text-xs text-muted-foreground">
            تصویر در دسترس نیست
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      ref={imageRef}
      src={source}
      alt={`${shoe.brand} ${shoe.name}`}
      loading="lazy"
      width={640}
      height={640}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

export function ShoeCard({ shoe, index = 0, variant = "grid", onQuickView }: Props) {
  const toggleWishlist = useStore((state) => state.toggleWishlist);
  const isWishlisted = useStore((state) => state.wishlist.includes(shoe.id));
  const { saveRect } = useSharedTransition();
  const imageRef = useRef<HTMLImageElement | null>(null);
  const previews = buildPreviews(shoe);
  const [activePreview, setActivePreview] = useState(0);
  const activeImage = previews[activePreview]?.image ?? shoe.image;
  const discount = shoe.sale_price
    ? Math.round(((shoe.price - shoe.sale_price) / shoe.price) * 100)
    : 0;

  const productTarget = {
    to: "/product/$id" as const,
    params: { id: String(shoe.id) },
  };

  const rememberImage = () => {
    if (imageRef.current) saveRect(shoe.id, imageRef.current);
  };

  const handleWishlist = () => {
    toggleWishlist(shoe.id);
    toast(isWishlisted ? "از علاقه‌مندی حذف شد" : "به علاقه‌مندی اضافه شد");
  };

  const openQuickView = () => onQuickView?.(shoe);

  if (variant === "list") {
    return (
      <motion.article
        data-testid="product-card"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.35, delay: (index % 6) * 0.04 }}
        className="grid gap-3 rounded-2xl border border-border bg-surface p-3 transition-colors hover:border-neon/60 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-center"
      >
        <Link
          {...productTarget}
          onClick={rememberImage}
          className="relative block aspect-square overflow-hidden rounded-xl bg-surface-2"
          aria-label={`مشاهده جزئیات ${shoe.name}`}
        >
          <ProductImage
            shoe={shoe}
            source={activeImage}
            imageRef={imageRef}
            className={`h-full w-full object-cover transition-transform duration-500 hover:scale-105 motion-reduce:transition-none ${shoe.isSoldOut ? "grayscale opacity-60" : ""}`}
          />
          {shoe.isSoldOut ? (
            <span className="absolute inset-x-2 bottom-2 rounded-full bg-ink/85 px-2 py-1 text-center font-fa text-xs text-white">
              ناموجود در داده نمایشی
            </span>
          ) : null}
        </Link>

        <div className="min-w-0">
          <p className="eyebrow text-muted-foreground">
            <bdi dir="ltr">{shoe.brand}</bdi>
          </p>
          <Link {...productTarget} onClick={rememberImage} className="mt-1 block rounded-sm">
            <h3 className="truncate font-display text-lg font-bold">
              <bdi dir="ltr">{shoe.name}</bdi>
            </h3>
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            <bdi dir="ltr">{shoe.colorway}</bdi>
          </p>
          <div className="mt-3 flex items-end gap-2">
            <Price value={shoe.sale_price ?? shoe.price} className="font-bold" />
            {shoe.sale_price ? (
              <Price value={shoe.price} className="text-xs text-muted-foreground line-through" />
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:flex-col">
          {onQuickView ? (
            <Button
              type="button"
              variant="outline"
              onClick={openQuickView}
              className="flex-1 sm:w-full"
              data-testid="quick-view-trigger"
            >
              <Eye aria-hidden="true" className="size-4" />
              نمایش سریع
            </Button>
          ) : (
            <Button asChild variant="outline" className="flex-1 sm:w-full">
              <Link {...productTarget} onClick={rememberImage}>
                انتخاب محصول
              </Link>
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            aria-pressed={isWishlisted}
            aria-label={
              isWishlisted
                ? `حذف ${shoe.name} از علاقه‌مندی`
                : `افزودن ${shoe.name} به علاقه‌مندی`
            }
            onClick={handleWishlist}
          >
            <Heart
              aria-hidden="true"
              className={isWishlisted ? "size-4 fill-current" : "size-4"}
            />
            <span className="sm:sr-only">علاقه‌مندی</span>
          </Button>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      data-testid="product-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: (index % 4) * 0.05 }}
      className="group overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-neon/60"
    >
      <div className="relative">
        <Link
          {...productTarget}
          onClick={rememberImage}
          className="block aspect-square overflow-hidden bg-surface-2"
          aria-label={`مشاهده جزئیات ${shoe.name}`}
        >
          <ProductImage
            shoe={shoe}
            source={activeImage}
            imageRef={imageRef}
            className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none ${shoe.isSoldOut ? "grayscale opacity-60" : ""}`}
          />
        </Link>

        <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1.5">
          <button
            type="button"
            onClick={handleWishlist}
            aria-pressed={isWishlisted}
            aria-label={
              isWishlisted
                ? `حذف ${shoe.name} از علاقه‌مندی`
                : `افزودن ${shoe.name} به علاقه‌مندی`
            }
            className={`grid size-11 place-items-center rounded-full border backdrop-blur transition-colors ${
              isWishlisted
                ? "border-neon bg-neon text-ink"
                : "border-border bg-ink/75 text-white hover:border-neon"
            }`}
          >
            <Heart
              aria-hidden="true"
              className={isWishlisted ? "size-4 fill-current" : "size-4"}
            />
          </button>
        </div>

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {shoe.isNew ? (
            <span className="eyebrow rounded-full bg-neon px-2 py-1 text-ink">جدید</span>
          ) : null}
          {shoe.isLimited ? (
            <span className="eyebrow rounded-full bg-neon-orange px-2 py-1 text-white">
              لیمیتد
            </span>
          ) : null}
          {discount ? (
            <span className="eyebrow rounded-full bg-purple-hype px-2 py-1 text-white">
              ٪{discount}-
            </span>
          ) : null}
        </div>

        {shoe.isSoldOut ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="-rotate-6 border-2 border-white bg-ink/60 px-4 py-2 font-fa text-sm font-bold text-white">
              ناموجود در داده نمایشی
            </span>
          </div>
        ) : null}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="eyebrow text-muted-foreground">
            <bdi dir="ltr">{shoe.brand}</bdi>
          </p>
          <span className="rounded-full border border-border px-2 py-0.5 font-fa text-[0.65rem] text-muted-foreground">
            داده نمایشی
          </span>
        </div>

        <Link {...productTarget} onClick={rememberImage} className="mt-2 block rounded-sm">
          <h3 className="truncate font-display text-base font-bold">
            <bdi dir="ltr">{shoe.name}</bdi>
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            <bdi dir="ltr">{shoe.colorway}</bdi>
          </p>
        </Link>

        {previews.length > 1 ? (
          <div
            role="group"
            aria-label={`تغییر پیش‌نمایش تصویر ${shoe.name}`}
            className="mt-3 flex min-h-11 items-center gap-2"
          >
            {previews.map((preview, previewIndex) => (
              <button
                key={`${preview.color}-${previewIndex}`}
                type="button"
                aria-label={preview.label}
                aria-pressed={previewIndex === activePreview}
                onClick={() => setActivePreview(previewIndex)}
                className={`size-11 rounded-full border-2 transition-transform ${
                  previewIndex === activePreview
                    ? "scale-105 border-neon"
                    : "border-border hover:border-muted-foreground"
                }`}
                style={{ backgroundColor: preview.color }}
              />
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex items-end gap-2">
          <Price value={shoe.sale_price ?? shoe.price} className="font-bold" />
          {shoe.sale_price ? (
            <Price value={shoe.price} className="text-xs text-muted-foreground line-through" />
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button asChild variant="outline">
            <Link {...productTarget} onClick={rememberImage}>
              جزئیات
            </Link>
          </Button>
          {onQuickView ? (
            <Button type="button" onClick={openQuickView} data-testid="quick-view-trigger">
              <Eye aria-hidden="true" className="size-4" />
              نمایش سریع
            </Button>
          ) : (
            <Button asChild>
              <Link {...productTarget} onClick={rememberImage}>
                انتخاب سایز
              </Link>
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
