import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";

import { useStore } from "@/store";
import { SHOES, formatPrice } from "@/data/shoes";

export function CartDrawer() {
  const isOpen = useStore((s) => s.isCartOpen);
  const setOpen = useStore((s) => s.setCartOpen);
  const cart = useStore((s) => s.cart);
  const updateQty = useStore((s) => s.updateQty);
  const removeFromCart = useStore((s) => s.removeFromCart);

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
        <DialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-overlay backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none" />
        <DialogPrimitive.Content
          dir="rtl"
          className="fixed inset-y-0 inset-inline-end-0 z-[var(--z-modal)] flex w-full flex-col border-s border-border bg-surface shadow-[var(--shadow-overlay)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right motion-reduce:animate-none sm:w-[420px]"
        >
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <DialogPrimitive.Title className="eyebrow text-primary">
                سبد خرید
              </DialogPrimitive.Title>
              <div className="font-display text-2xl font-black">
                {items.length}{" "}
                <span className="text-base font-normal text-muted-foreground">آیتم</span>
              </div>
              <DialogPrimitive.Description className="sr-only">
                مدیریت محصولات انتخاب‌شده و رفتن به صفحه سبد خرید
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
                <div className="text-sm text-muted-foreground">برای شروع، محصولات را ببین.</div>
              </div>
              <Link to="/products" onClick={() => setOpen(false)} className="btn-hype mt-2">
                مشاهده محصولات
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
                      className="flex gap-3 rounded-2xl border border-border bg-background p-3 motion-reduce:transform-none"
                    >
                      <Link
                        to="/product/$id"
                        params={{ id: String(item.id) }}
                        onClick={() => setOpen(false)}
                        className="shrink-0 rounded-xl"
                      >
                        <img
                          src={item.shoe.image}
                          alt={item.shoe.name}
                          width={80}
                          height={80}
                          className="size-20 rounded-xl bg-surface-elevated object-cover"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
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
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div
                            className="flex items-center gap-1 rounded-full bg-surface p-1"
                            role="group"
                            aria-label={`تعداد ${item.shoe.name}`}
                          >
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, item.size, item.qty - 1)}
                              className="flex size-10 items-center justify-center rounded-full hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
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
                              className="flex size-10 items-center justify-center rounded-full hover:bg-primary hover:text-primary-foreground"
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
                        className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
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
                  <span className="text-muted-foreground">جمع کل</span>
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
                    ادامه خرید
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
