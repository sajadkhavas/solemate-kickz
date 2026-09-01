import { Heart, Share2, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { MAX_CART_ITEM_QUANTITY } from "@/cart/cart-domain";
import type { DiscoveryShoe } from "@/catalog/discovery-types";
import { registerBackInStockForRuntime } from "@/catalog/production-catalog";
import { putCommerceCartItem } from "@/commerce/commerce-api";
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
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const richShoe = shoe as DiscoveryShoe;

  useEffect(() => {
    setSelectedSize(null);
    setQuantity(1);
    setEmail("");
    setConsent(false);
  }, [shoe.id]);

  const selectedVariant = useMemo(
    () => richShoe.variants?.find((variant) => variant.size === selectedSize),
    [richShoe.variants, selectedSize],
  );
  const hasVariantTruth = import.meta.env.PROD && Boolean(richShoe.variants?.length);
  const selectedAvailable = hasVariantTruth
    ? selectedVariant?.availability === "in_stock" && (selectedVariant.availableQuantity ?? 0) > 0
    : !shoe.isSoldOut;
  const canAdd = selectedSize !== null && selectedAvailable;
  const currentPrice = shoe.sale_price ?? shoe.price;
  const quantityMax = hasVariantTruth
    ? Math.max(1, Math.min(MAX_CART_ITEM_QUANTITY, selectedVariant?.availableQuantity ?? 1))
    : MAX_CART_ITEM_QUANTITY;
  const canRegisterBackInStock =
    import.meta.env.PROD &&
    Boolean(richShoe.slug) &&
    Boolean(selectedVariant) &&
    selectedVariant?.availability === "out_of_stock";

  useEffect(() => {
    if (quantity > quantityMax) setQuantity(quantityMax);
  }, [quantity, quantityMax]);

  const handleAdd = async () => {
    if (!selectedAvailable) return;
    if (selectedSize === null) {
      toast.error("پیش از افزودن، یک سایز را انتخاب کنید.");
      return;
    }

    if (import.meta.env.PROD && selectedVariant) {
      try {
        await putCommerceCartItem(selectedVariant.id, quantity);
        toast.success(`${quantity} عدد در سبد سروری ثبت شد.`);
      } catch {
        toast.error("افزودن به سبد انجام نشد؛ موجودی را دوباره بررسی کنید.");
      }
      return;
    }

    if (!addToCart(shoe.id, selectedSize, quantity)) {
      toast.error("این انتخاب دیگر با Dataset فعلی قابل افزودن نیست یا به سقف سبد محلی رسیده است.");
      return;
    }
    toast.success(`${quantity} عدد به سبد محلی اضافه شد.`);
    setCartOpen(true);
  };

  const handleWishlist = () => {
    toggleWishlist(shoe.id);
    toast(isWishlisted ? "از علاقه‌مندی محلی حذف شد." : "در علاقه‌مندی محلی ذخیره شد.");
  };

  const handleBackInStock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canRegisterBackInStock || !richShoe.slug || !selectedVariant || !consent) return;

    setWaitlistSubmitting(true);
    const result = await registerBackInStockForRuntime({
      slug: richShoe.slug,
      variantId: selectedVariant.id,
      email: email.trim(),
      consent: true,
    });
    setWaitlistSubmitting(false);

    if (result.status === "registered") {
      toast.success("درخواست اطلاع از موجودشدن ثبت شد.");
      setEmail("");
      setConsent(false);
      return;
    }
    if (result.status === "already_available") {
      toast.info("این سایز اکنون موجود است؛ صفحه را تازه کنید.");
      return;
    }
    if (result.status === "invalid") {
      toast.error("ایمیل یا رضایت ثبت‌شده معتبر نیست.");
      return;
    }
    toast.error("ثبت درخواست فعلاً در دسترس نیست.");
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
          <SizeGuideDialog sizes={shoe.sizes} sizeGuide={shoe.sizeGuide} />
        </div>

        <div
          role="group"
          aria-label="انتخاب سایز محصول"
          className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6"
        >
          {shoe.sizes.map((size) => {
            const selected = selectedSize === size;
            const variant = richShoe.variants?.find((item) => item.size === size);
            const availability = hasVariantTruth
              ? (variant?.availability ?? "out_of_stock")
              : undefined;
            return (
              <button
                key={size}
                type="button"
                aria-pressed={selected}
                aria-label={
                  availability === "out_of_stock" ? `سایز ${size}، ناموجود` : `سایز ${size}`
                }
                data-testid="product-size-option"
                data-availability={availability}
                onClick={() => setSelectedSize(size)}
                className="min-h-11 rounded-xl border border-border bg-background px-2 font-mono-num text-sm font-semibold outline-none transition-colors hover:border-border-strong focus-visible:ring-2 focus-visible:ring-focus aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground data-[availability=out_of_stock]:border-dashed data-[availability=out_of_stock]:text-muted-foreground"
              >
                {size}
              </button>
            );
          })}
        </div>

        <p data-testid="product-size-status" className="mt-3 font-fa text-xs text-muted-foreground">
          {selectedSize === null
            ? "هنوز سایزی انتخاب نشده است."
            : hasVariantTruth && selectedVariant?.availability === "out_of_stock"
              ? `سایز EU ${selectedSize} انتخاب شد و اکنون ناموجود است.`
              : `سایز انتخابی: EU ${selectedSize}`}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
        <StockState
          status={selectedAvailable ? "in-stock" : "out-of-stock"}
          label={
            hasVariantTruth
              ? selectedSize === null
                ? "برای مشاهده موجودی، سایز را انتخاب کنید"
                : selectedAvailable
                  ? `${selectedVariant?.availableQuantity ?? 0} عدد موجود در موجودی رسمی`
                  : "این سایز در موجودی رسمی ناموجود است"
              : shoe.isSoldOut
                ? "در Dataset ناموجود ثبت شده"
                : "در Dataset برای افزودن فعال است"
          }
        />
        <QuantityStepper
          value={quantity}
          onChange={setQuantity}
          min={1}
          max={quantityMax}
          disabled={!selectedAvailable}
          label="تعداد برای افزودن به سبد"
          className="bg-background"
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Button
          size="lg"
          disabled={!canAdd}
          onClick={() => void handleAdd()}
          data-testid="product-add-to-cart"
          className="min-h-14 rounded-full font-fa font-bold"
        >
          <ShoppingBag aria-hidden="true" />
          {!selectedAvailable && selectedSize !== null
            ? "این سایز ناموجود است"
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

      {canRegisterBackInStock ? (
        <form
          data-testid="back-in-stock-form"
          onSubmit={(event) => void handleBackInStock(event)}
          className="mt-5 rounded-2xl border border-border bg-surface p-5"
        >
          <h2 className="font-fa text-sm font-bold">اطلاع از موجودشدن این سایز</h2>
          <p className="mt-2 font-fa text-xs leading-6 text-muted-foreground">
            ایمیل فقط برای همین درخواست ثبت می‌شود. ارسال اعلان در P09 فعال خواهد شد و این فرم وعده
            زمان ارسال نمی‌دهد.
          </p>
          <label className="mt-4 block font-fa text-xs font-bold" htmlFor="back-in-stock-email">
            ایمیل
          </label>
          <input
            id="back-in-stock-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-focus"
          />
          <label className="mt-4 flex items-start gap-3 font-fa text-xs leading-6">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(event) => setConsent(event.currentTarget.checked)}
              className="mt-1 size-4"
            />
            <span>رضایت می‌دهم ایمیل من فقط برای اطلاع از موجودشدن همین Variant ثبت شود.</span>
          </label>
          <Button
            type="submit"
            className="mt-4"
            disabled={!consent || !email.trim() || waitlistSubmitting}
          >
            {waitlistSubmitting ? "در حال ثبت…" : "ثبت درخواست"}
          </Button>
        </form>
      ) : null}

      <div className="mt-7 rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-fa text-sm font-bold">
          {import.meta.env.PROD ? "اطلاعات رسمی محصول" : "اطلاعات ثبت‌شده در Dataset"}
        </h2>
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
            <dd className="mt-1">{shoe.tags.length ? shoe.tags.join("، ") : "برچسبی ثبت نشده"}</dd>
          </div>
        </dl>

        {import.meta.env.PROD && richShoe.decisionSupport ? (
          <div className="mt-4 grid gap-3 border-t border-border pt-4 font-fa text-xs leading-6 text-muted-foreground sm:grid-cols-3">
            <p>امتیاز و نظر: تا وجود شواهد تأییدشده P08 نمایش داده نمی‌شود.</p>
            <p>ارسال: زمان یا وعده‌ای بدون داده معتبر نمایش داده نمی‌شود.</p>
            <p>بازگشت: شرطی بدون Policy معتبر نمایش داده نمی‌شود.</p>
          </div>
        ) : (
          <div className="mt-4 border-t border-border pt-4">
            <p className="font-fa text-xs leading-6 text-muted-foreground">
              Dataset فعلی اطلاعاتی درباره موجودی هر سایز، جنس، کشور سازنده، اصالت، زمان ارسال یا
              شرایط بازگشت ندارد؛ بنابراین این صفحه چنین ادعاهایی نمایش نمی‌دهد.
            </p>
          </div>
        )}
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
            {!selectedAvailable && selectedSize !== null
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
