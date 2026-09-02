import { Link } from "@tanstack/react-router";
import { Eye, Heart } from "lucide-react";
import { useRef, type MouseEvent } from "react";
import { toast } from "sonner";

import { ResponsiveCatalogImage } from "@/components/catalog/ResponsiveCatalogImage";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/commerce-primitives";
import type { Shoe } from "@/data/shoes";
import { useProductionWishlistItem } from "@/engagement/production-wishlist-store";

interface Props {
  shoe: Shoe;
  index?: number;
  variant?: "grid" | "list";
  onQuickView?: (shoe: Shoe, opener: HTMLElement) => void;
}

export function ShoeCard({ shoe, index = 0, variant = "grid", onQuickView }: Props) {
  const wishlist = useProductionWishlistItem(shoe);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const productTarget = { to: "/product/$id" as const, params: { id: String(shoe.id) } };

  const toggle = async () => {
    if (wishlist.status === "unauthorized") {
      toast.error("برای ذخیره علاقه‌مندی وارد حساب شوید.");
      return;
    }
    try {
      const wasWishlisted = wishlist.isWishlisted;
      await wishlist.toggle();
      toast.success(wasWishlisted ? "از علاقه‌مندی حساب حذف شد." : "در علاقه‌مندی حساب ذخیره شد.");
    } catch {
      toast.error("تغییر علاقه‌مندی در Backend انجام نشد.");
    }
  };

  const quickView = (event: MouseEvent<HTMLButtonElement>) =>
    onQuickView?.(shoe, event.currentTarget);

  if (variant === "list") {
    return (
      <article
        data-testid="product-card"
        className="grid gap-3 rounded-2xl border border-border bg-surface p-3 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-center"
      >
        <Link {...productTarget} className="block aspect-square overflow-hidden rounded-xl bg-surface-2">
          <ResponsiveCatalogImage
            ref={imageRef}
            shoe={shoe}
            src={shoe.image}
            alt={`${shoe.brand} ${shoe.name}`}
            sizes="10rem"
            loading={index < 2 ? "eager" : "lazy"}
            width={640}
            height={640}
            className="h-full w-full object-cover"
          />
        </Link>
        <div className="min-w-0">
          <p className="eyebrow text-muted-foreground">{shoe.brand}</p>
          <Link {...productTarget} className="mt-1 block font-display text-lg font-bold">
            {shoe.name}
          </Link>
          <Price value={shoe.sale_price ?? shoe.price} className="mt-3 font-bold" />
        </div>
        <div className="flex gap-2 sm:flex-col">
          {onQuickView ? (
            <Button type="button" variant="outline" onClick={quickView} data-testid="quick-view-trigger">
              <Eye aria-hidden="true" className="size-4" /> نمایش سریع
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link {...productTarget}>جزئیات</Link>
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            aria-pressed={wishlist.isWishlisted}
            disabled={wishlist.variantId === null || wishlist.status === "loading"}
            onClick={() => void toggle()}
          >
            <Heart
              aria-hidden="true"
              className={wishlist.isWishlisted ? "size-4 fill-current" : "size-4"}
            />
            علاقه‌مندی
          </Button>
        </div>
      </article>
    );
  }

  return (
    <article
      data-testid="product-card"
      className="group overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-neon/60"
    >
      <div className="relative">
        <Link {...productTarget} className="block aspect-square overflow-hidden bg-surface-2">
          <ResponsiveCatalogImage
            ref={imageRef}
            shoe={shoe}
            src={shoe.image}
            alt={`${shoe.brand} ${shoe.name}`}
            sizes="(min-width: 1280px) 30vw, (min-width: 480px) 50vw, 100vw"
            loading={index < 2 ? "eager" : "lazy"}
            width={640}
            height={640}
            className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${shoe.isSoldOut ? "grayscale opacity-60" : ""}`}
          />
        </Link>
        <button
          type="button"
          aria-pressed={wishlist.isWishlisted}
          aria-label={wishlist.isWishlisted ? `حذف ${shoe.name} از علاقه‌مندی` : `افزودن ${shoe.name} به علاقه‌مندی`}
          disabled={wishlist.variantId === null || wishlist.status === "loading"}
          onClick={() => void toggle()}
          className={`absolute right-3 top-3 grid size-11 place-items-center rounded-full border backdrop-blur ${
            wishlist.isWishlisted
              ? "border-neon bg-neon text-ink"
              : "border-border bg-ink/75 text-white"
          }`}
        >
          <Heart aria-hidden="true" className={wishlist.isWishlisted ? "size-4 fill-current" : "size-4"} />
        </button>
      </div>
      <div className="p-4">
        <p className="eyebrow text-muted-foreground">{shoe.brand}</p>
        <Link {...productTarget} className="mt-2 block min-h-11">
          <h3 className="truncate font-display text-base font-bold">{shoe.name}</h3>
          <p className="truncate text-xs text-muted-foreground">{shoe.colorway}</p>
        </Link>
        <div className="mt-3 flex items-end gap-2">
          <Price value={shoe.sale_price ?? shoe.price} className="font-bold" />
          {shoe.sale_price ? (
            <Price value={shoe.price} className="text-xs text-muted-foreground line-through" />
          ) : null}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button asChild variant="outline">
            <Link {...productTarget}>جزئیات</Link>
          </Button>
          {onQuickView ? (
            <Button type="button" onClick={quickView} data-testid="quick-view-trigger">
              <Eye aria-hidden="true" className="size-4" /> نمایش سریع
            </Button>
          ) : (
            <Button asChild>
              <Link {...productTarget}>انتخاب سایز</Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
