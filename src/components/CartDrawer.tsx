import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useMemo } from "react";

import { SHOES, formatPrice } from "@/data/shoes";
import { useStore } from "@/store";

function restoreCartTriggerFocus() {
  const triggers = Array.from(
    document.querySelectorAll<HTMLElement>('button[aria-label="Cart"]'),
  );
  const visibleTrigger = triggers.find((element) => {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  });
  (visibleTrigger ?? triggers[0])?.focus({ preventScroll: true });
}

export function CartDrawer() {
  const isOpen = useStore((state) => state.isCartOpen);
  const setOpen = useStore((state) => state.setCartOpen);
  const cart = useStore((state) => state.cart);
  const updateQty = useStore((state) => state.updateQty);
  const removeFromCart = useStore((state) => state.removeFromCart);

  const items = useMemo(
    () =>
      cart
        .map((cartItem) => {
          const shoe = SHOES.find((candidate) => candidate.id === cartItem.id);
          return shoe ? { ...cartItem, shoe } : null;
        })
        .filter(Boolean) as Array<{
        id: number;
        size: number;
        qty: number;
        shoe: (typeof SHOES)[number];
      }>,
    [cart],
  );

  const subtotal = items.reduce(
    (total, item) => total + (item.shoe.sale_price ?? item.shoe.price) * item.qty,
    0,
  );

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
          dir="rtl"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            restoreCartTriggerFocus();
          }}
          className="fixed inset-y-0 inset-inline-end-0 z-[var(--z-modal)] flex w-full flex-col border-s border-border bg-surface shadow-[var(--shadow-overlay)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left motion-reduce:animate-none sm:w-[420px]"
        >
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <DialogPrimitive.Title className="eyebrow text-primary">
                سبد خرید نمونه
              </DialogPrimitive.Title>
              <div className="font-display text-2xl font-black">
                {items.length}{" "}
                <span className="text-base font-normal text-muted-foreground">آیتم</span>
              </div>
              <DialogPrimitive.Description className="sr-only">
                مدیریت محصولات نمونه انتخاب‌شده و رفتن به صفحه سبد خرید
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                className="flex size-11 items-center justify-center rounded-full bg-background transition-colors hover:bg-primary hover:text-primary-foreground"
                aria-label="بستن سبد خرید"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </DialogPrimitive.Close>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
              <div className="flex size-20 items-center justify-center rounded-full bg-background">
                <ShoppingBag aria-hidden="true" size={32} className="text-muted-foreground" />
              </div>
              <div>
                <div className="mb-1 font-display text-xl font-bold">سبدت خالیه!</div>
                <div className="text-sm text-muted-foreground">
                  برای شروع، محصولات نمونه را ببین.
                </div>
              </div>
              <Link to="/products" onClick={() => setOpen(false)} className="btn-hype mt-2">
                مشاهده محصولات نمونه
              </Link>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <motion.div
                      key={`${item.id}-${item.size}`}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 32 }}
                      transition={{ duration: 0.2 }}
                      className="relative flex gap-3 rounded-2xl border border-border bg-background p-3 motion-reduce:transform-none"
                    >
                      <Link
                        to="/product/$id"
                        params={{ id: String(item.id) }}
                        onClick={() => setOpen(false)}
                        className="shrink-0 rounded-xl"
                        aria-label={`مشاهده محصول نمونه ${item.shoe.name}`}
                      >
                        <img
                          src={item.shoe.image}
                          alt={`${item.shoe.brand} ${item.shoe.name}`}
                          width={80}
                          height={80}
                          className="size-16 rounded-xl bg-surface-elevated object-cover sm:size-20"
                        />
                      </Link>
                      <div className="min-w-0 flex-1 pe-10">
                        <div className="eyebrow text-muted-foreground">{item.shoe.brand}</div>
                        <div
                          className="truncate font-display text-sm font-bold leading-tight"
                          dir="auto"
                        >
                          {item.shoe.name}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          سایز <bdi dir="ltr">{item.size}</bdi> · {item.shoe.colorway}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <div
                            className="flex items-center gap-1 rounded-full bg-surface p-1"
                            role="group"
                            aria-label={`تعداد ${item.shoe.name}`}
                          >
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, item.size, item.qty - 1)}
                              className="flex size-11 items-center justify-center rounded-full hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                              aria-label="کاهش تعداد"
                              disabled={item.qty <= 1}
                            >
                              <Minus aria-hidden="true" size={14} />
                            </button>
                            <output
                              aria-live="polite"
                              className="w-7 text-center font-mono-num text-sm"
                            >
                              {item.qty}
                            </output>
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, item.size, item.qty + 1)}
                              className="flex size-11 items-center justify-center rounded-full hover:bg-primary hover:text-primary-foreground"
                              aria-label="افزایش تعداد"
                            >
                              <Plus aria-hidden="true" size={14} />
                            </button>
                          </div>
                          <div className="font-mono-num text-sm font-semibold">
                            {formatPrice((item.shoe.sale_price ?? item.shoe.price) * item.qty)}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id, item.size)}
                        className="absolute inset-inline-end-2 top-2 flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                        aria-label={`حذف ${item.shoe.name} از سبد`}
                      >
                        <Trash2 aria-hidden="true" size={16} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="safe-area-bottom space-y-3 border-t border-border p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">جمع کل نمونه</span>
                  <span className="font-mono-num text-lg font-bold">{formatPrice(subtotal)}</span>
                </div>
                <Link
                  to="/cart"
                  onClick={() => setOpen(false)}
                  className="btn-hype w-full justify-center"
                >
                  مشاهده سبد
                </Link>
                <DialogPrimitive.Close asChild>
                  <button
                    type="button"
                    className="block min-h-11 w-full rounded-md text-center text-xs text-muted-foreground transition-colors hover:text-primary"
                  >
                    ادامه مشاهده
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
