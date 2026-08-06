import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { IconButton, Price } from "@/components/ui/commerce-primitives";
import type { Shoe } from "@/data/shoes";
import { useStore } from "@/store";

interface QuickViewDialogProps {
  shoe: Shoe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickViewDialog({ shoe, open, onOpenChange }: QuickViewDialogProps) {
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const addToCart = useStore((state) => state.addToCart);
  const setCartOpen = useStore((state) => state.setCartOpen);
  const toggleWishlist = useStore((state) => state.toggleWishlist);
  const wishlisted = useStore((state) => (shoe ? state.wishlist.includes(shoe.id) : false));

  useEffect(() => {
    if (!open) return;
    setSelectedSize(null);
    setImageFailed(false);
  }, [open, shoe?.id]);

  if (!shoe) return null;

  const addSelectedSize = () => {
    if (shoe.isSoldOut || selectedSize === null) return;
    addToCart(shoe.id, selectedSize, 1);
    toast.success(`${shoe.name} با سایز ${selectedSize} به سبد اضافه شد`);
    onOpenChange(false);
    setCartOpen(true);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-overlay backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 motion-reduce:animate-none" />
        <DialogPrimitive.Content
          data-testid="quick-view-dialog"
          dir="rtl"
          className="fixed inset-x-3 top-1/2 z-[var(--z-modal)] mx-auto grid max-h-[min(90dvh,52rem)] max-w-4xl -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-surface-elevated shadow-[var(--shadow-overlay)] outline-none md:grid-cols-[minmax(0,1fr)_minmax(20rem,0.85fr)]"
        >
          <div className="relative min-h-72 overflow-hidden rounded-t-2xl bg-surface-2 md:min-h-full md:rounded-e-none md:rounded-s-2xl">
            {imageFailed ? (
              <div className="grid h-full min-h-72 place-items-center p-8 text-center">
                <div>
                  <p className="font-display text-4xl font-black text-muted-foreground">SOLE</p>
                  <p className="mt-2 font-fa text-sm text-muted-foreground">
                    پیش‌نمایش تصویر در دسترس نیست
                  </p>
                </div>
              </div>
            ) : (
              <img
                src={shoe.image}
                alt={`${shoe.brand} ${shoe.name}`}
                width={900}
                height={900}
                onError={() => setImageFailed(true)}
                className="h-full min-h-72 w-full object-cover"
              />
            )}
          </div>

          <div className="relative flex flex-col p-5 sm:p-7">
            <DialogPrimitive.Close asChild>
              <IconButton
                label="بستن نمایش سریع"
                variant="ghost"
                data-testid="quick-view-close"
                className="absolute left-3 top-3"
              >
                <X aria-hidden="true" className="size-5" />
              </IconButton>
            </DialogPrimitive.Close>

            <div className="pe-12">
              <p className="eyebrow text-neon">{shoe.brand}</p>
              <DialogPrimitive.Title className="mt-2 font-display text-3xl font-black leading-tight">
                <bdi dir="ltr">{shoe.name}</bdi>
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-2 font-fa text-sm leading-6 text-muted-foreground">
                نمایش سریع بر پایه داده نمایشی پروژه است. برای افزودن به سبد یک سایز را انتخاب کنید.
              </DialogPrimitive.Description>
              <p className="mt-1 text-sm text-muted-foreground">
                <bdi dir="ltr">{shoe.colorway}</bdi>
              </p>
            </div>

            <div className="mt-5 flex items-end gap-3">
              <Price value={shoe.sale_price ?? shoe.price} className="text-lg font-bold" />
              {shoe.sale_price ? (
                <Price value={shoe.price} className="text-sm text-muted-foreground line-through" />
              ) : null}
            </div>

            <fieldset className="mt-6" disabled={shoe.isSoldOut}>
              <legend className="font-fa text-sm font-bold">انتخاب سایز</legend>
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
                {shoe.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    data-testid="quick-view-size"
                    aria-pressed={selectedSize === size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-h-11 rounded-lg border font-mono-num text-sm transition-colors ${
                      selectedSize === size
                        ? "border-neon bg-neon text-ink"
                        : "border-border bg-background hover:border-neon"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </fieldset>

            {shoe.isSoldOut ? (
              <p
                role="status"
                className="mt-4 rounded-lg border border-border bg-background p-3 font-fa text-sm text-muted-foreground"
              >
                این محصول در داده نمایشی فعلاً ناموجود است.
              </p>
            ) : selectedSize === null ? (
              <p id="quick-view-size-help" className="mt-3 font-fa text-xs text-muted-foreground">
                قبل از افزودن به سبد، سایز را انتخاب کنید.
              </p>
            ) : null}

            <div className="mt-auto grid gap-2 pt-6 sm:grid-cols-[1fr_auto]">
              <Button
                type="button"
                data-testid="quick-view-add"
                disabled={shoe.isSoldOut || selectedSize === null}
                aria-describedby={selectedSize === null ? "quick-view-size-help" : undefined}
                onClick={addSelectedSize}
              >
                <ShoppingBag aria-hidden="true" className="size-4" />
                افزودن سایز انتخاب‌شده
              </Button>
              <Button
                type="button"
                data-testid="quick-view-wishlist"
                variant="outline"
                aria-pressed={wishlisted}
                onClick={() => toggleWishlist(shoe.id)}
              >
                <Heart
                  aria-hidden="true"
                  className={wishlisted ? "size-4 fill-current" : "size-4"}
                />
                {wishlisted ? "حذف علاقه‌مندی" : "علاقه‌مندی"}
              </Button>
            </div>

            <Button asChild variant="ghost" className="mt-2">
              <Link to="/product/$id" params={{ id: String(shoe.id) }}>
                مشاهده صفحه کامل محصول
              </Link>
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
