import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { getCartQuantityCount, resolveCart } from "@/cart/cart-domain";
import { CartProductImage } from "@/components/cart/CartProductImage";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { EmptyState, Spinner } from "@/components/ui/commerce-primitives";
import { formatPrice } from "@/data/shoes";
import { useStore } from "@/store";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "سبد خرید نمایشی — SOLE" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const cart = useStore((state) => state.cart);
  const hasHydrated = useStore((state) => state.hasHydrated);
  const updateQty = useStore((state) => state.updateQty);
  const removeFromCart = useStore((state) => state.removeFromCart);
  const clearCart = useStore((state) => state.clearCart);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const items = useMemo(() => resolveCart(cart), [cart]);
  const itemCount = getCartQuantityCount(cart);
  const subtotal = items.reduce(
    (total, item) =>
      total + (item.status === "ready" && item.unitPrice ? item.unitPrice * item.qty : 0),
    0,
  );
  const hasBlockingIssues = items.some((item) => item.status !== "ready");

  const removeItem = (id: number, size: number, label: string) => {
    removeFromCart(id, size);
    setAnnouncement(`${label} از سبد حذف شد.`);
    window.requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
  };

  const clearAll = () => {
    clearCart();
    setAnnouncement("همه اقلام از سبد محلی حذف شدند.");
    window.requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main
        data-testid="f7-cart-page"
        className="page-container-wide pb-36 pt-8 md:pb-16"
        aria-labelledby="cart-page-heading"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-primary">Frontend Cart</p>
            <h1
              id="cart-page-heading"
              ref={headingRef}
              tabIndex={-1}
              className="mt-2 font-display text-4xl font-black tracking-tight outline-none sm:text-5xl md:text-6xl"
            >
              سبد خرید
            </h1>
            <p className="mt-3 max-w-2xl font-fa text-sm leading-7 text-muted-foreground">
              این سبد روی همین دستگاه ذخیره می‌شود. Checkout این فاز فقط برای بررسی اطلاعات است و به سفارش، ارسال یا پرداخت واقعی متصل نیست.
            </p>
          </div>
          {hasHydrated && items.length > 0 ? (
            <div className="rounded-full border border-border bg-surface px-4 py-2 font-fa text-sm">
              <span className="text-muted-foreground">تعداد: </span>
              <span className="font-mono-num" data-testid="cart-page-count">{itemCount}</span>
            </div>
          ) : null}
        </div>

        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>

        {!hasHydrated ? (
          <div
            data-testid="cart-page-hydrating"
            className="mt-10 flex min-h-72 items-center justify-center rounded-2xl border border-border bg-surface"
          >
            <Spinner label="در حال بازیابی سبد ذخیره‌شده" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            data-testid="cart-empty-state"
            className="mt-10 min-h-[24rem]"
            icon={<ShoppingBag className="size-10" />}
            title="سبد خرید خالی است"
            description="محصول و سایز موردنظر را انتخاب کنید تا اینجا نمایش داده شود."
            action={
              <Link to="/products" className="btn-hype">
                مشاهده محصولات
              </Link>
            }
          />
        ) : (
          <div className="mt-10 grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(20rem,0.85fr)]">
            <section aria-labelledby="cart-items-heading" className="min-w-0">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 id="cart-items-heading" className="font-display text-xl font-bold">
                  اقلام انتخاب‌شده
                </h2>
                <button
                  type="button"
                  onClick={clearAll}
                  className="min-h-11 rounded-full px-4 font-fa text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-danger"
                  data-testid="cart-clear"
                >
                  پاک‌کردن سبد محلی
                </button>
              </div>

              {hasBlockingIssues ? (
                <div
                  role="status"
                  data-testid="cart-stale-warning"
                  className="mb-4 flex gap-3 rounded-2xl border border-warning/50 bg-warning/10 p-4 font-fa text-sm leading-7"
                >
                  <AlertTriangle aria-hidden="true" className="mt-1 size-5 shrink-0 text-warning" />
                  <div>
                    <p className="font-bold">سبد ذخیره‌شده نیاز به بازبینی دارد.</p>
                    <p className="mt-1 text-muted-foreground">
                      حداقل یک محصول، سایز یا وضعیت دسترس‌پذیری با Dataset فعلی هماهنگ نیست. مورد مشکل‌دار را حذف کنید؛ تا آن زمان ورود به Review مسدود است.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {items.map((item) => {
                    const label = item.shoe
                      ? `${item.shoe.brand} ${item.shoe.name}`
                      : `محصول با شناسه ${item.id}`;
                    return (
                      <motion.article
                        key={item.key}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        transition={{ duration: 0.2 }}
                        data-testid="cart-page-item"
                        data-cart-status={item.status}
                        className="grid min-w-0 gap-4 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-[8rem_minmax(0,1fr)]"
                      >
                        {item.shoe ? (
                          <Link
                            to="/product/$id"
                            params={{ id: String(item.id) }}
                            className="aspect-square w-full overflow-hidden rounded-xl bg-surface-elevated sm:size-32"
                            aria-label={`مشاهده ${label}`}
                          >
                            <CartProductImage
                              src={item.shoe.image}
                              alt={label}
                              testId="cart-page-image"
                              className="h-full w-full object-cover"
                            />
                          </Link>
                        ) : (
                          <div
                            role="img"
                            aria-label="تصویر محصول در دسترس نیست"
                            className="grid aspect-square w-full place-items-center rounded-xl bg-surface-elevated font-display text-sm font-black text-muted-foreground sm:size-32"
                          >
                            SOLE
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex min-w-0 items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="eyebrow text-muted-foreground">
                                {item.shoe?.brand ?? "Stale item"}
                              </p>
                              {item.shoe ? (
                                <Link
                                  to="/product/$id"
                                  params={{ id: String(item.id) }}
                                  className="mt-1 block min-h-11 break-words rounded-sm font-display text-lg font-bold leading-6 hover:text-primary"
                                >
                                  <bdi dir="ltr">{item.shoe.name}</bdi>
                                </Link>
                              ) : (
                                <p className="mt-1 min-h-11 break-words font-display text-lg font-bold leading-6">
                                  {label}
                                </p>
                              )}
                              <p className="mt-1 font-fa text-xs text-muted-foreground">
                                سایز <bdi dir="ltr">{item.size}</bdi>
                                {item.shoe ? <> · <bdi dir="ltr">{item.shoe.colorway}</bdi></> : null}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id, item.size, label)}
                              className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                              aria-label={`حذف ${label} از سبد`}
                            >
                              <Trash2 aria-hidden="true" className="size-4" />
                            </button>
                          </div>

                          {item.blockingMessage ? (
                            <p
                              data-testid="cart-item-issue"
                              className="mt-3 rounded-lg border border-warning/40 bg-warning/10 p-3 font-fa text-xs leading-6 text-warning"
                            >
                              {item.blockingMessage}
                            </p>
                          ) : null}

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                            <div
                              role="group"
                              aria-label={`تعداد ${label}`}
                              className="inline-flex min-h-11 items-center rounded-full border border-border bg-background p-1"
                            >
                              <button
                                type="button"
                                onClick={() => updateQty(item.id, item.size, item.qty - 1)}
                                disabled={item.status !== "ready" || item.qty <= 1}
                                aria-label={`کاهش تعداد ${label}`}
                                className="flex size-11 items-center justify-center rounded-full transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                              >
                                <Minus aria-hidden="true" className="size-4" />
                              </button>
                              <output aria-live="polite" className="min-w-10 text-center font-mono-num text-sm">
                                {item.qty}
                              </output>
                              <button
                                type="button"
                                onClick={() => updateQty(item.id, item.size, item.qty + 1)}
                                disabled={item.status !== "ready"}
                                aria-label={`افزایش تعداد ${label}`}
                                className="flex size-11 items-center justify-center rounded-full transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                              >
                                <Plus aria-hidden="true" className="size-4" />
                              </button>
                            </div>

                            {item.status === "ready" && item.unitPrice ? (
                              <div className="text-end">
                                <p className="font-mono-num text-lg font-bold">
                                  {formatPrice(item.unitPrice * item.qty)}
                                </p>
                                <p className="font-fa text-[11px] text-muted-foreground">
                                  قیمت فعلی Dataset × تعداد
                                </p>
                              </div>
                            ) : (
                              <span className="font-fa text-xs text-muted-foreground">قیمت قابل بررسی نیست</span>
                            )}
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
              </div>
            </section>

            <aside
              aria-labelledby="cart-summary-heading"
              className="h-fit min-w-0 rounded-2xl border border-border bg-surface p-5 lg:sticky lg:top-28 sm:p-6"
              data-testid="cart-summary"
            >
              <p className="eyebrow text-primary">Review boundary</p>
              <h2 id="cart-summary-heading" className="mt-2 font-display text-2xl font-bold">
                خلاصه سبد
              </h2>

              <dl className="mt-6 space-y-4 font-fa text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted-foreground">جمع جزء اقلام قابل بررسی</dt>
                  <dd className="shrink-0 font-mono-num font-bold" data-testid="cart-page-subtotal">
                    {formatPrice(subtotal)}
                  </dd>
                </div>
                <div className="border-t border-border pt-4">
                  <dt className="font-bold">ارسال</dt>
                  <dd className="mt-1 text-xs leading-6 text-muted-foreground">
                    روش، هزینه و زمان ارسال هنوز از Backend معتبر دریافت نمی‌شود.
                  </dd>
                </div>
                <div className="border-t border-border pt-4">
                  <dt className="font-bold">پرداخت</dt>
                  <dd className="mt-1 text-xs leading-6 text-muted-foreground">
                    هیچ روش یا درگاه پرداخت واقعی در این فاز متصل نیست.
                  </dd>
                </div>
                <div className="border-t border-border pt-4">
                  <dt className="font-bold">مبلغ نهایی</dt>
                  <dd className="mt-1 text-xs leading-6 text-muted-foreground">
                    بدون قوانین معتبر ارسال، مالیات احتمالی و سرویس سفارش، مبلغ نهایی محاسبه نمی‌شود.
                  </dd>
                </div>
              </dl>

              <div className="mt-6 space-y-3">
                {!hasBlockingIssues ? (
                  <Link
                    to="/checkout"
                    className="btn-hype w-full justify-center text-center"
                    data-testid="cart-checkout-cta"
                  >
                    ادامه به بررسی Checkout
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="min-h-11 w-full rounded-full border border-border bg-interactive px-4 font-fa text-sm text-muted-foreground"
                    data-testid="cart-checkout-blocked"
                  >
                    ابتدا اقلام ناسازگار را رفع کنید
                  </button>
                )}
                <Link
                  to="/products"
                  className="flex min-h-11 w-full items-center justify-center rounded-full border border-border px-4 font-fa text-sm font-bold transition-colors hover:border-primary"
                >
                  ادامه خرید
                </Link>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
