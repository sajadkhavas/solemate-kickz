import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useStore } from "@/store";
import { SHOES, formatPrice } from "@/data/shoes";
import { useMemo } from "react";

export function CartDrawer() {
  const isOpen = useStore((s) => s.isCartOpen);
  const setOpen = useStore((s) => s.setCartOpen);
  const cart = useStore((s) => s.cart);
  const updateQty = useStore((s) => s.updateQty);
  const removeFromCart = useStore((s) => s.removeFromCart);

  const items = useMemo(
    () =>
      cart
        .map((c) => {
          const shoe = SHOES.find((s) => s.id === c.id);
          return shoe ? { ...c, shoe } : null;
        })
        .filter(Boolean) as Array<{ id: number; size: number; qty: number; shoe: (typeof SHOES)[number] }>,
    [cart],
  );

  const subtotal = items.reduce(
    (acc, i) => acc + (i.shoe.sale_price ?? i.shoe.price) * i.qty,
    0,
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] bg-ink/70 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
            className="fixed top-0 right-0 bottom-0 z-[61] w-full sm:w-[420px] bg-surface border-l border-border flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <div className="eyebrow text-neon">Your Bag</div>
                <div className="font-display font-black text-2xl">
                  {items.length} <span className="text-muted-foreground text-base font-normal">آیتم</span>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-full bg-ink hover:bg-neon hover:text-ink flex items-center justify-center transition"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-4">
                <div className="w-20 h-20 rounded-full bg-ink flex items-center justify-center">
                  <ShoppingBag size={32} className="text-muted-foreground" />
                </div>
                <div>
                  <div className="font-display font-bold text-xl mb-1">کیفت خالیه!</div>
                  <div className="text-muted-foreground text-sm">برو یه چیز باحال پیدا کن</div>
                </div>
                <Link
                  to="/products"
                  onClick={() => setOpen(false)}
                  className="btn-hype mt-2"
                >
                  Shop Now →
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  <AnimatePresence initial={false}>
                    {items.map((i) => (
                      <motion.div
                        key={`${i.id}-${i.size}`}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 80 }}
                        className="flex gap-3 bg-ink rounded-2xl p-3 border border-border"
                      >
                        <Link
                          to="/product/$id"
                          params={{ id: String(i.id) }}
                          onClick={() => setOpen(false)}
                          className="shrink-0"
                        >
                          <img
                            src={i.shoe.image}
                            alt={i.shoe.name}
                            className="w-20 h-20 rounded-xl object-cover bg-surface-2"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="eyebrow text-muted-foreground">{i.shoe.brand}</div>
                          <div className="font-display font-bold text-sm leading-tight truncate">
                            {i.shoe.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            سایز {i.size} · {i.shoe.colorway}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1 bg-surface rounded-full p-1">
                              <button
                                onClick={() => updateQty(i.id, i.size, i.qty - 1)}
                                className="w-6 h-6 rounded-full hover:bg-neon hover:text-ink flex items-center justify-center"
                                aria-label="Decrease"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-6 text-center font-mono-num text-sm">{i.qty}</span>
                              <button
                                onClick={() => updateQty(i.id, i.size, i.qty + 1)}
                                className="w-6 h-6 rounded-full hover:bg-neon hover:text-ink flex items-center justify-center"
                                aria-label="Increase"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            <div className="font-mono-num font-semibold text-sm">
                              {formatPrice((i.shoe.sale_price ?? i.shoe.price) * i.qty)}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(i.id, i.size)}
                          className="self-start text-muted-foreground hover:text-destructive transition"
                          aria-label="Remove"
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="border-t border-border p-5 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">جمع کل</span>
                    <span className="font-mono-num font-bold text-lg">{formatPrice(subtotal)}</span>
                  </div>
                  <Link
                    to="/cart"
                    onClick={() => setOpen(false)}
                    className="btn-hype w-full justify-center"
                  >
                    مشاهده سبد →
                  </Link>
                  <button
                    onClick={() => setOpen(false)}
                    className="block w-full text-center text-xs text-muted-foreground hover:text-neon transition"
                  >
                    ادامه خرید
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
