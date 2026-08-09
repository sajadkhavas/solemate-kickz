import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { getCartQuantityCount, resolveCart } from "@/cart/cart-domain";
import { CartProductImage } from "@/components/cart/CartProductImage";
import { Spinner } from "@/components/ui/commerce-primitives";
import { formatPrice } from "@/data/shoes";
import { useStore } from "@/store";

function restoreCartTriggerFocus() {
  const triggers = Array.from(document.querySelectorAll<HTMLElement>('[data-cart-trigger="true"]'));
  const visibleTrigger = triggers.find((element) => {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return (
      style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0
    );
  });
  (visibleTrigger ?? triggers[0])?.focus({ preventScroll: true });
}

export function CartDrawer() {
  const isOpen = useStore((state) => state.isCartOpen);
  const setOpen = useStore((state) => state.setCartOpen);
  const cart = useStore((state) => state.cart);
  const hasHydrated = useStore((state) => state.hasHydrated);
  const updateQty = useStore((state) => state.updateQty);
  const removeFromCart = useStore((state) => state.removeFromCart);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
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
    window.requestAnimationFrame(() => titleRef.current?.focus({ preventScroll: true }));
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-foundation-overlay="cart"
          className="fixed inset-0 z-[var(--z-overlay)] bg-overlay backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none"
        />
        <DialogPrimitive.Content
          data-foundation-dialog="cart"
          data-foundation-shared
          data-testid="cart-drawer"
          dir="rtl"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            closeRef.current?.focus({ preventScroll: true });
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            restoreCartTriggerFocus();
          }}
          className="fixed inset-y-0 inset-inline-end-0 z-[var(--z-modal)] flex w-full max-w-full flex-col border-s border-border bg-surface shadow-[var(--shadow-overlay)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left motion-reduce:animate-none sm:w-[28rem]"
        >
          <div className="flex items-start justify-between gap-3 border-b border-border p-4 sm:p-5">
            <div className="min-w-0">
              <p className="eyebrow text-primary">Frontend Cart</p>
              <DialogPrimitive.Title
                ref={titleRef}
                tabIndex={-1}
                className="mt-1 font-display text-2xl font-black outline-none"
              >
                سبد خرید نمایشی
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 font-fa text-xs leading-5 text-muted-foreground">
                کالاهای انتخاب‌شده روی همین دستگاه نگهداری می‌شوند؛ سفارش، ارسال و پرداخت واقعی متصل
                نیستند.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close asChild>
              <button
                ref={closeRef}
                type="button"
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-background transition-colors hover:bg-primary hover:text-primary-foreground"
                aria-label="بستن سبد خرید"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </DialogPrimitive.Close>
          </div>

          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {announcement}
          </div>

          {!hasHydrated ? (
            <div
              data-testid="cart-drawer-hydrating"
              className="flex flex-1 items-center justify-center p-8"
            >
              <Spinner label="در حال بازیابی سبد ذخیره‌شده" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-12 text-center">
              <div className="flex size-20 items-center justify-center rounded-full bg-background">
                <ShoppingBag aria-hidden="true" size={32} className="text-muted-foreground" />
              </div>
              <div>
                <h2 className="mb-1 font-display text-xl font-bold">سبد خالی است</h2>
                <p className="text-sm text-muted-foreground">
                  برای شروع یکی از محصولات Dataset فعلی را انتخاب کنید.
                </p>
              </div>
              <Link to="/products" onClick={() => setOpen(false)} className="btn-hype mt-2">
                مشاهده محصولات
              </Link>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">تعداد کالا</span>
                  <span className="font-mono-num" data-testid="cart-drawer-count">
                    {itemCount}
                  </span>
                </div>

                {hasBlockingIssues ? (
                  <div
                    role="status"
                    className="flex gap-3 rounded-xl border border-warning/50 bg-warning/10 p-3 font-fa text-xs leading-6"
                    data-testid="cart-drawer-stale-warning"
                  >
                    <AlertTriangle
                      aria-hidden="true"
                      className="mt-1 size-4 shrink-0 text-warning"
                    />
                    <p>
                      بعضی اقلام ذخیره‌شده با Dataset فعلی هماهنگ نیستند. آن‌ها را حذف یا در صفحه
                      سبد بررسی کنید؛ Checkout تا رفع مشکل غیرفعال می‌ماند.
                    </p>
                  </div>
                ) : null}

                <AnimatePresence initial={false}>
                  {items.map((item) => {
                    const label = item.shoe
                      ? `${item.shoe.brand} ${item.shoe.name}`
                      : `محصول با شناسه ${item.id}`;
                    return (
                      <motion.article
                        key={item.key}
                        data-testid="cart-drawer-item"
                        data-cart-status={item.status}
                        layout
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 32 }}
                        transition={{ duration: 0.2 }}
                        className="relative flex min-w-0 gap-3 rounded-2xl border border-border bg-background p-3 motion-reduce:transform-none"
                      >
                        {item.shoe ? (
                          <Link
                            to="/product/$id"
                            params={{ id: String(item.id) }}
                            onClick={() => setOpen(false)}
                            className="size-20 shrink-0 overflow-hidden rounded-xl bg-surface-elevated"
                            aria-label={`مشاهده ${label}`}
                          >
                            <CartProductImage
                              src={item.shoe.image}
                              alt={label}
                              testId="cart-drawer-image"
                              className="size-20 object-cover"
                            />
                          </Link>
                        ) : (
                          <div
                            role="img"
                            aria-label="تصویر محصول در دسترس نیست"
                            className="grid size-20 shrink-0 place-items-center rounded-xl bg-surface-elevated font-display text-xs font-black text-muted-foreground"
                          >
                            SOLE
                          </div>
                        )}

                        <div className="min-w-0 flex-1 pe-10">
                          <p className="eyebrow text-muted-foreground">
                            {item.shoe?.brand ?? "Stale item"}
                          </p>
                          <p
                            className="break-words font-display text-sm font-bold leading-5"
                            dir="auto"
                          >
                            {item.shoe?.name ?? label}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            سایز <bdi dir="ltr">{item.size}</bdi>
                            {item.shoe ? (
                              <>
                                {" "}
                                · <bdi dir="ltr">{item.shoe.colorway}</bdi>
                              </>
                            ) : null}
                          </p>

                          {item.blockingMessage ? (
                            <p
                              className="mt-2 rounded-lg border border-warning/40 bg-warning/10 p-2 font-fa text-xs leading-5 text-warning"
                              data-testid="cart-item-issue"
                            >
                              {item.blockingMessage}
                            </p>
                          ) : null}

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            <div
                              className="flex items-center rounded-full bg-surface p-1"
                              role="group"
                              aria-label={`تعداد ${label}`}
                            >
                              <button
                                type="button"
                                onClick={() => updateQty(item.id, item.size, item.qty - 1)}
                                className="flex size-11 items-center justify-center rounded-full hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                                aria-label={`کاهش تعداد ${label}`}
                                disabled={item.status !== "ready" || item.qty <= 1}
                              >
                                <Minus aria-hidden="true" size={14} />
                              </button>
                              <output
                                aria-live="polite"
                                className="min-w-9 text-center font-mono-num text-sm"
                              >
                                {item.qty}
                              </output>
                              <button
                                type="button"
                                onClick={() => updateQty(item.id, item.size, item.qty + 1)}
                                className="flex size-11 items-center justify-center rounded-full hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                                aria-label={`افزایش تعداد ${label}`}
                                disabled={item.status !== "ready"}
                              >
                                <Plus aria-hidden="true" size={14} />
                              </button>
                            </div>
                            {item.status === "ready" && item.unitPrice ? (
                              <div className="font-mono-num text-sm font-semibold">
                                {formatPrice(item.unitPrice * item.qty)}
                              </div>
                            ) : (
                              <span className="font-fa text-xs text-muted-foreground">
                                قیمت قابل بررسی نیست
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.id, item.size, label)}
                          className="absolute inset-inline-end-1.5 top-1.5 flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                          aria-label={`حذف ${label} از سبد`}
                        >
                          <Trash2 aria-hidden="true" size={16} />
                        </button>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
              </div>

              <div className="safe-area-bottom space-y-3 border-t border-border p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">جمع جزء اقلام قابل بررسی</span>
                  <span
                    className="font-mono-num text-lg font-bold"
                    data-testid="cart-drawer-subtotal"
                  >
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <p className="font-fa text-[11px] leading-5 text-muted-foreground">
                  هزینه/روش ارسال، مالیات احتمالی و مبلغ نهایی بدون سرویس‌های واقعی محاسبه نمی‌شوند.
                </p>

                {!hasBlockingIssues ? (
                  <Link
                    to="/checkout"
                    onClick={() => setOpen(false)}
                    className="btn-hype w-full justify-center"
                    data-testid="cart-drawer-checkout"
                  >
                    ادامه به Checkout نمایشی
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="min-h-11 w-full rounded-full border border-border bg-interactive px-4 font-fa text-sm text-muted-foreground"
                  >
                    رفع مشکل سبد برای ادامه
                  </button>
                )}

                <Link
                  to="/cart"
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 w-full items-center justify-center rounded-full border border-border px-4 font-fa text-sm font-bold transition-colors hover:border-primary"
                >
                  مشاهده صفحه سبد
                </Link>
                <DialogPrimitive.Close asChild>
                  <button
                    type="button"
                    className="block min-h-11 w-full rounded-md text-center font-fa text-xs text-muted-foreground transition-colors hover:text-primary"
                  >
                    ادامه مشاهده محصولات
                  </button>
                </DialogPrimitive.Close>
              </div>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
