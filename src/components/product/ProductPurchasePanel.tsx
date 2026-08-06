import { Heart, Share2, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SizeGuideDialog } from "@/components/product/SizeGuideDialog";
import { Button } from "@/components/ui/button";
import {
  DiscountPrice,
  Price,
  QuantityStepper,
  StockState,
} from "@/components/ui/commerce-primitives";
import type { Shoe } from "@/data/shoes";
import { useStore } from "@/store";

type ProductPurchasePanelProps = {
  shoe: Shoe;
  onShare: () => Promise<void>;
};

export function ProductPurchasePanel({ shoe, onShare }: ProductPurchasePanelProps) {
  const addToCart = useStore((state) => state.addToCart);
  const setCartOpen = useStore((state) => state.setCartOpen);
  const toggleWishlist = useStore((state) => state.toggleWishlist);
  const isWishlisted = useStore((state) => state.wishlist.includes(shoe.id));
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setSelectedSize(null);
    setQuantity(1);
  }, [shoe.id]);

  const canAdd = !shoe.isSoldOut && selectedSize !== null;
  const currentPrice = shoe.sale_price ?? shoe.price;

  const handleAdd = () => {
    if (shoe.isSoldOut) return;
    if (selectedSize === null) {
      toast.error("پیش از افزودن، یک سایز را انتخاب کنید.");
      return;
    }

    addToCart(shoe.id, selectedSize, quantity);
    toast.success(`${quantity} عدد به سبد محلی اضافه شد.`);
    setCartOpen(true);
  };

  const handleWishlist = () => {
    toggleWishlist(shoe.id);
    toast(isWishlisted ? "از علاقه‌مندی محلی حذف شد." : "در علاقه‌مندی محلی ذخیره شد.");
  };

  return (
    <section
      data-testid="product-purchase-panel"
      aria-labelledby="product-title"
      className="min-w-0"
    >
      <p className="font-display text-xs font-bold uppercase tracking-[0.22em] text-primary">
        {shoe.brand}
      </p>
      <h1
        id="product-title"
        className="mt-2 font-display text-4xl font-black leading-none tracking-tight sm:text-5xl"
      >
        <bdi dir="ltr">{shoe.name}</bdi>
      </h1>
      <p className="mt-3 font-fa text-sm text-muted-foreground">
        رنگ ثبت‌شده: <bdi dir="ltr">{shoe.colorway}</bdi>
      </p>

      <div className="mt-6">
        {shoe.sale_price ? (
          <DiscountPrice
            price={shoe.sale_price}
            originalPrice={shoe.price}
            className="text-2xl font-black"
          />
        ) : (
          <Price value={currentPrice} className="text-2xl font-black" />
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-fa text-sm font-bold">انتخاب سایز EU</p>
            <p className="mt-1 font-fa text-xs text-muted-foreground">
              سایز به‌صورت خودکار انتخاب نمی‌شود.
            </p>
          </div>
          <SizeGuideDialog sizes={shoe.sizes} />
        </div>

        <div
          role="group"
          aria-label="انتخاب سایز محصول"
          className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6"
        >
          {shoe.sizes.map((size) => {
            const selected = selectedSize === size;
            return (
              <button
                key={size}
                type="button"
                aria-pressed={selected}
                data-testid="product-size-option"
                onClick={() => setSelectedSize(size)}
                className="min-h-11 rounded-xl border border-border bg-background px-2 font-mono-num text-sm font-semibold outline-none transition-colors hover:border-border-strong focus-visible:ring-2 focus-visible:ring-focus aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
              >
                {size}
              </button>
            );
          })}
        </div>

        <p data-testid="product-size-status" className="mt-3 font-fa text-xs text-muted-foreground">
          {selectedSize === null ? "هنوز سایزی انتخاب نشده است." : `سایز انتخابی: EU ${selectedSize}`}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
        <StockState
          status={shoe.isSoldOut ? "out-of-stock" : "in-stock"}
          label={
            shoe.isSoldOut
              ? "در Dataset ناموجود ثبت شده"
              : "در Dataset برای افزودن فعال است"
          }
        />
        <QuantityStepper
          value={quantity}
          onChange={setQuantity}
          min={1}
          max={10}
          disabled={shoe.isSoldOut}
          label="تعداد برای افزودن به سبد"
          className="bg-background"
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Button
          size="lg"
          disabled={!canAdd}
          onClick={handleAdd}
          data-testid="product-add-to-cart"
          className="min-h-14 rounded-full font-fa font-bold"
        >
          <ShoppingBag aria-hidden="true" />
          {shoe.isSoldOut
            ? "محصول ناموجود است"
            : selectedSize === null
              ? "ابتدا سایز را انتخاب کنید"
              : `افزودن ${quantity} عدد به سبد`}
        </Button>

        <Button
          variant="outline"
          size="lg"
          aria-pressed={isWishlisted}
          onClick={handleWishlist}
          data-testid="product-wishlist"
          className="min-h-14 rounded-full"
        >
          <Heart
            aria-hidden="true"
            className={isWishlisted ? "fill-primary text-primary" : undefined}
          />
          <span className="sm:sr-only">
            {isWishlisted ? "حذف از علاقه‌مندی" : "افزودن به علاقه‌مندی"}
          </span>
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={() => void onShare()}
          data-testid="product-share"
          className="min-h-14 rounded-full"
        >
          <Share2 aria-hidden="true" />
          <span className="sm:sr-only">اشتراک‌گذاری محصول</span>
        </Button>
      </div>

      <div className="mt-7 rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-fa text-sm font-bold">اطلاعات ثبت‌شده در Dataset</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-fa text-xs text-muted-foreground">شناسه کالا</dt>
            <dd className="mt-1 font-mono-num">{shoe.sku}</dd>
          </div>
          <div>
            <dt className="font-fa text-xs text-muted-foreground">دسته‌بندی</dt>
            <dd className="mt-1 font-display uppercase">{shoe.category}</dd>
          </div>
          <div>
            <dt className="font-fa text-xs text-muted-foreground">سایزهای ثبت‌شده</dt>
            <dd className="mt-1 font-mono-num">{shoe.sizes.join("، ")}</dd>
          </div>
          <div>
            <dt className="font-fa text-xs text-muted-foreground">برچسب‌ها</dt>
            <dd className="mt-1">
              {shoe.tags.length ? shoe.tags.join("، ") : "برچسبی ثبت نشده"}
            </dd>
          </div>
        </dl>

        <div className="mt-4 border-t border-border pt-4">
          <p className="font-fa text-xs leading-6 text-muted-foreground">
            Dataset فعلی اطلاعاتی درباره موجودی هر سایز، جنس، کشور سازنده،
            اصالت، زمان ارسال یا شرایط بازگشت ندارد؛ بنابراین این صفحه چنین
            ادعاهایی نمایش نمی‌دهد.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="پالت رنگ ثبت‌شده">
            <span className="font-fa text-xs text-muted-foreground">
              پالت رنگ ثبت‌شده:
            </span>
            {shoe.colors.map((color, index) => (
              <span
                key={`${color}-${index}`}
                role="img"
                aria-label={`رنگ ${index + 1}: ${color}`}
                title={color}
                className="size-8 rounded-full border border-border"
                style={{ backgroundColor: color }}
              />
            ))}
            <span className="font-fa text-xs text-muted-foreground">
              این رنگ‌ها Variant مستقل موجودی نیستند.
            </span>
          </div>
        </div>
      </div>

      <div
        data-testid="product-mobile-purchase"
        className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-[var(--z-sticky)] border-t border-border bg-background/95 p-3 backdrop-blur md:hidden"
      >
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-xs font-bold">
              {shoe.brand} {shoe.name}
            </p>
            <Price value={currentPrice} className="mt-1 text-sm font-bold" />
          </div>
          <Button
            disabled={!canAdd}
            onClick={handleAdd}
            data-testid="product-mobile-add-to-cart"
            className="min-h-12 rounded-full px-5 font-fa font-bold"
          >
            {shoe.isSoldOut
              ? "ناموجود"
              : selectedSize === null
                ? "انتخاب سایز"
                : `افزودن ${quantity}`}
          </Button>
        </div>
      </div>
    </section>
  );
}
